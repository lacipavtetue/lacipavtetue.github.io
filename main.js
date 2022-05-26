function getClasse(year, type) {
	idx = 0;
	for (i = END_YEAR; i >= START_YEAR; i--) {
		if (year == i) {
			return type[idx];
		}
		idx++;
	}
}

/* format correctement les sommes (2 chiffres après la digit) */
var nf = Intl.NumberFormat("fr-FR");
function formatNumber(number) {
	return nf.format(Number(number).toFixed(2));
}

function initTooltips() {
	//on cache les anciens tooltips 
    $('[data-bs-toggle="tooltip"]').each(function(i, obj) {
			$(this).tooltip('hide');
	});
	
	//initialisation des tooltips
	var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
	var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl)
	})

}

function showLastSave() {
	$('#lastsave').text("dernière sauvegarde effectuée le "+localStorage.getItem('datesave'));
}

function calculateYearsCotis(row) {
	/*if(row.find(".inputrevenu").val().trim() == '')
			return;*/
	revenu = Number(row.find(".inputrevenu").val().replace(/\s/g,''));
	paid = row.find(".inputpaid").val();
	regulpaid = row.find(".regulpaid").val();
	year = Number(row.attr("id"));

	row.data('revenu', revenu); //revenu déclaré
	row.data('paid', paid);
	row.data('regulpaid', regulpaid);
	
	if(row.data('regularisation') != null){
		regularisationDue = row.data('regularisation').replace(/\s/g,'');
		if(nf.format(Number(regularisationDue).toFixed(0))  != nf.format(Number(regulpaid).toFixed(0)) ){
			row.next().find(".warningregul").html("<b>Attention:</b> la régularisation payées en "+year+" d'un montant de "+formatNumber(regulpaid)+" sur vos cotisations "+(year-1)+" ne correspond pas au montant des régulations dues d'un montant de "+regularisationDue+" (écart de "+formatNumber(regulpaid-regularisationDue)+")");
		} else {
			row.next().find(".warningregul").html("");
		}
	}

	/************************************************
		  calcul des cotisations de la retraite de base
		  exemple pour 2022 : 
		  revenus déficitaires ou inférieurs à 4 731 €
			  Forfait de 477 €
		  revenus supérieurs à 4 731 € 
			  Tranche 1  8,23 % pour les revenus allant de 0 € à 41 136 €
			  Tranche 2	1,87 % pour les revenus allant de 0 € à 205 680 €
		  revenus non connus 
			  assiette forfaitaire de taxation d’office
	*************************************************/
	//seuil  forfait tranche1 tranche1taux tranche2 tranche2taux
	cotisation_base = 0;
	classeCotisationsBase = getClasse(year, classe_cotisations_base);

	if (revenu < classeCotisationsBase[0]) {  //revenus supérieurs au seuil
		cotisation_base = classeCotisationsBase[1];
		txt = "Vos revenus sont inférieurs à "+classeCotisationsBase[0]+" €, votre cotisation est basée sur un forfait de "+formatNumber(classeCotisationsBase[1])+" €";
		row.find(".baseinfo").attr("title", txt);
		row.find(".baseinfoexpanded").html(txt);
	} else {
		tranche1 = classeCotisationsBase[3] * revenu;
		if (revenu > classeCotisationsBase[2]) 
			tranche1 = classeCotisationsBase[3] * classeCotisationsBase[2];
		tranche2 = classeCotisationsBase[5] * revenu;
		if (revenu > classeCotisationsBase[4])
			tranche2 = classeCotisationsBase[5] * classeCotisationsBase[4];
		cotisation_base = tranche1 + tranche2;
		row.data('tranche1', tranche1);
		row.data('tranche2', tranche2);
		txt = "<div style='width:400px'><b>Tranche 1: </b>"+formatNumber(tranche1)+" € ("+classeCotisationsBase[3]+" * "+revenu+") <br/><b>Tranche 2: </b>"+formatNumber(tranche2)+" € ("+classeCotisationsBase[5]+" * "+revenu+")</div>";
		row.find(".baseinfo").attr("title", txt);
		row.find(".baseinfoexpanded").html(txt);
	}
	row.data('cotisation_base', cotisation_base);
	row.find(".base").text(formatNumber(cotisation_base));

	/************************************************
	Calcul des points attribuées en retraite de base
	  En tranche 1 :
		  • 1 point pour 68,70 de revenus, 
		  soit 450 points maximum
		  En tranche 2 :
		  • 1 point pour 1 509,44             			
		  de revenus, soit 100 points 
		  supplémentaires maximum
		  • Au maximum, vous obtenez 550 points
  *************************************************/
	pointTranche1 = revenu / 68.7;
	if (pointTranche1 > 450)
		pointTranche1 = 450;
	pointTranche2 = revenu / 1509, 44;
	if (pointTranche2 > 100)
		pointTranche2 = 100;
	pointRetraiteBase = pointTranche1 + pointTranche2;

	row.data('pointRetraiteBase', pointRetraiteBase);
	row.find(".ptsregimebase").text(formatNumber(pointRetraiteBase))
	row.find(".ptsbasetitle").attr("title", "Vos revenus vous permettent d'obtenir "+formatNumber(pointRetraiteBase)+" points de retraite de base (function Beta)");

	/************************************************************************************************
		  Calcul des cotisations et des points de la retraite complémentaire   
		
		  Contrairement à la cotisation du régime de base, la
		  cotisation de retraite complémentaire est forfaitaire.
		  Son montant est déterminé selon vos revenus :
			  Exemple pour 2022
				  Jusqu’à 26 580 € classe a : 1 527 €
				  de 26 581 € à 49 280 € classe B : 3 055 €
				  de 49 281 € à 57 850 € classe c : 4 582 €
				  de 57 851 € à 66 400 € classe d : 7 637 €
				  de 66 401 € à 83 060 € classe e : 10 692 €
				  de 83 061 € à 103 180 € classe f : 16 802 €
				  de 103 181 € à 123 300 € classe G : 18 329 €
				  123 301 € et plus classe h : 19 857 €	   		
	************************************************************************************************/
	classe = 'A';
	cotisation_complem = 0;
	points = 0;
	classeRevenus = getClasse(year, classe_revenus);
	classeCotisations = getClasse(year, classe_cotisations);
	classePoints = getClasse(year, classe_points);
	//on détermine la classe de cotisation
	for (i = 0; i < classeRevenus.length; i++) {
		if (revenu <= classeRevenus[i]) {
			classe = classe_type[i];
			cotisation_complem = classeCotisations[i];
			points = classePoints[i];
			txt = "<div style='width:400px'>Vos revenus sont inférieurs à "+formatNumber(classeRevenus[i])+" €.<br/>Votre classe de cotisation est "+classe+" dont le montant de la cotisation forfaitaire est de "+formatNumber(classeCotisations[i])+" €</div>";
			row.find(".compleminfo").attr("title", txt);
			row.find(".compleminfoexpanded").html(txt);
			break;
		}
	}
	row.data('cotisation_complem', cotisation_complem);
	row.data('classe', classe);
	row.data('points', points);

	row.find(".complem").text(formatNumber(cotisation_complem))
	row.find(".clas").text(classe);
	row.find(".pts").text(points);
	row.find(".ptstitle").attr("title", "votre classe de cotisation "+classe+" basée sur vos revenus "+year+" vous permet d'obtenir "+points+" points de retraite");
	
	/************************************************
    
	calcul de l'invalidité décès
    
   *************************************************/
    cinvalid = "A";
	cotisation_invalid = 76;
	if (row.find(".invalidcheckA").prop('checked') == true) {
		cotisation_invalid = 76;
		row.find(".invaliddeces").text("A");
		cinvalid = "A";
	} else if (row.find(".invalidcheckB").prop('checked') == true) {
		cotisation_invalid = 228;
		row.find(".invaliddeces").text("B");
		cinvalid = "B";
	} else if (row.find(".invalidcheckC").prop('checked') == true) {
		cotisation_invalid = 380;
		row.find(".invaliddeces").text("C");
		cinvalid = "C";
	}
	txt = "Vous pouvez choisir de cotiser en classe A, B ou C pour votre régime obligatoire d'invalidité-décès, quels que soient vos revenus.<br/>Votre classe de cotisation est "+cinvalid+" dont le montant est de "+cotisation_invalid+" €";
	row.find(".invaldecesinfo").attr("title", txt);
	row.find(".invalidinfoexpanded").html(txt);
	
	row.data('cotisation_invalid', cotisation_invalid);
	row.find(".deces").text(formatNumber(cotisation_invalid));

	// calcul des cotisations complètes
	complet = Number(cotisation_base) + Number(cotisation_complem) + Number(cotisation_invalid);
	row.data('cotisation_complet', complet);
	row.find(".complet").each(function(i, obj) {
		$(this).text(formatNumber(complet));
	});
	row.next().find(".complet").each(function(i, obj) {
		$(this).text(formatNumber(complet));
	});
	row.next().find(".paid").each(function(i, obj) {
		$(this).text(formatNumber(paid));
	});
	
	//régulation à intégrer en N+1
	regulNplusOne = formatNumber((complet - paid).toFixed(0))
	$("#" + (year + 1)).find(".reste").each(function(i, obj) { 
		$(this).text(regulNplusOne);
	});
	$("#" + (year + 1)).data('regularisation', regulNplusOne);
	row.next().find(".reste").each(function(i, obj) {
		$(this).text(regulNplusOne);
	});
	row.next().find(".summary").css({ "visibility": "visible" });

	/**** 
		mise à jour du total de l'ensemble des années '(footer)
	*******/
	cotisations_total = 0;
	paid_total = 0;
	regul_total = 0;
	pointbase_total = 0;
	pointscomplemtotal = 0;
	for (i = END_YEAR; i >= START_YEAR; i--) {
		if ($("#" + i).data('cotisation_complet') != null)
			cotisations_total += Number($("#" + i).data('cotisation_complet'));
		if ($("#" + i).data('paid') != null)
			paid_total += Number($("#" + i).data('paid'));
		if ($("#" + i).data('regulpaid') != null)
			regul_total += Number($("#" + i).data('regulpaid'));
		if ($("#" + i).data('pointRetraiteBase') != null)
			pointbase_total += Number($("#" + i).data('pointRetraiteBase'));
		if ($("#" + i).data('points') != null)
			pointscomplemtotal += Number($("#" + i).data('points'));

	}
	$("#cotisations_total").text(formatNumber(cotisations_total) + " €");
	$("#paid_total").html("Vous avez payé " + formatNumber(paid_total) + " € de cotisations.<br/>" +
		"Vous avez payé " + formatNumber(regul_total) + " € de régularisation.<br/>" +
		"soit un total de " + formatNumber(paid_total + regul_total) + " € .<br/>");
	$("#pointbase_total").text(formatNumber(pointbase_total));
	$("#pointscomplemtotal").text(formatNumber(pointscomplemtotal));
	
	//refresh des tooltips
	initTooltips();
}

$(document).ready(function() {
	/************************************
	
	 construction du tableau de calcul des cotisations
	 
	 ***************************************/
	for (i = END_YEAR; i >= START_YEAR; i--) {
		bg = i % 2 == 0 ? "#efefef" : "#fff";
		line = `
              	<tr id="`+ i + `" style="background-color: ` + bg + ` !important;"> 
            		<td scope="row"><b style="font-size: 12px">`+ i + `</b></td>
            		<td scope="row">
            			<div class="input-group mb-3 revenu input-group-sm mb-3" style=''>
            				<div class="input-group-prepend">
            					<span class="input-group-text" id="inputGroup-sizing-sm"> €</span>
            				</div>
            				<input type="text" class="form-control form-control-sm inputrevenu" data-bs-toggle="tooltip" data-bs-placement="top" title="renseignez ici les revenus non salariés de l'année `+ i + ` déclarés dans votre déclaration d'impôt (2042 C) ` + i + `" placeholder="revenus déclarés" aria-label="revenus déclarés" aria-describedby="inputGroup-sizing-sm">
            			</div>
            		</td>
            		<td style='width:310px; font-size: 12px; padding: 0 0 0 0; margin: 0 0;'>
            			<span style='font-size: 14px;'><b class="complet">0</b> € dont</span>:
            			<div style='padding-left: 14px;'>
            				<i class="bi bi-info-circle baseinfo" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" title=""></i> <span class="base"></span> € (retraite de base) <br/>
            				<div class="expanded baseinfoexpanded"></div> 
            				<i class="bi bi-info-circle compleminfo" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" title=""></i> <span class="complem"></span> € (retraite complémentaire) - classe <span class="clas">E</span><br/>
            				<div class="expanded compleminfoexpanded"></div>
            				<i class="bi bi-info-circle invaldecesinfo" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="top" title=""></i> <span class="deces"></span> € (invalidité décès) - classe <span class="invaliddeces">A</span> - 
            				<input type="radio" class="invalidcheck invalidcheckA" checked data-bs-toggle="tooltip" data-bs-placement="top" title="L'adhérent peut choisir sa classe de prévoyance invalidité-décès" name="flexRadioDefault`+ i + `"> A 
            				<input type="radio" class="invalidcheck invalidcheckB" data-bs-toggle="tooltip" data-bs-placement="top" title="L'adhérent peut choisir sa classe de prévoyance invalidité-décès" name="flexRadioDefault`+ i + `"> B 
            				<input type="radio" class="invalidcheck invalidcheckC" data-bs-toggle="tooltip" data-bs-placement="top" title="L'adhérent peut choisir sa classe de prévoyance invalidité-décès" name="flexRadioDefault`+ i + `"> C
            				<div class="expanded invalidinfoexpanded"></div>
						</div>
            		</td>
            
            		<td style='width:100px'><b style='font-size: 14px;'><span class="reste">0</span> €</b>  
            			<i class="bi bi-info-circle" title="La régularisation correspond aux cotisations dues pour l'années `+ (i - 1) + ` auquelles sont retranchées les cotisations payées en ` + (i - 1) + `" data-bs-toggle="tooltip">
            		</td>
            		<td>
            			<div class="input-group mb-3 revenu input-group-sm mb-3" style="width:300px;padding: 0 0 0 0; margin: 0 0 0 0 !important;">
            				<div class="input-group-prepend">
            					<span class="input-group-text" id="inputGroup-sizing-sm"> €</span>
            				</div>
            				<input type="text" class="form-control form-control-sm inputpaid" data-bs-toggle="tooltip" data-bs-placement="top" title="renseignez ici le provisionnel appelées en `+ i + ` (c'est à dire les provisions ` + i + ` calculés sur vos revenus ` + (i - 1) + ` sans la régularisation N-1)" placeholder="provisionnel payés" aria-label="provisionnel payés" aria-describedby="inputGroup-sizing-sm">
            				<br/>
            				<input type="text" class="form-control form-control-sm regulpaid" data-bs-toggle="tooltip" data-bs-placement="top" title="renseignez ici uniquement la régularisation payées en `+ i + ` sur N-1 (` + (i - 1) + `)" placeholder="régularisation payées" aria-label="régularisation déclarés" aria-describedby="inputGroup-sizing-sm">
            				
            				<span style="font-size: 12px;">Les cotisations appelées par la CIPAV en `+ i + ` sont constituées d'un provisionnel (basé sur vos revenus ` + (i - 1) + `) auquels est rajouté la régularisation N-1  
            				<a data-toggle="tooltip" data-bs-toggle="tooltip" data-bs-html="true" title="<img src='rev.png' />">
            					<i class="bi bi-info-circle" ></i>
            		        </a></span>
            			</div>
            		</td>
            		<td>
            			<b style='font-size: 14px;' class="ptsregimebase">0</b> pts 
            			<i class="bi bi-info-circle ptsbasetitle" title="" data-bs-toggle="tooltip"></i>
            			<br/><span style="color: #c0392b; font-size: 10px;">Beta</span>
            		</td>
            		<td>
            			<div class="input-group mb-3 input-group-sm mb-3 points">
            				<input type="text" class="form-control form-control-sm" aria-describedby="inputGroup-sizing-sm">
            			</div>
            		</td>
            		<td>
            			<b style='font-size: 14px;' class="pts">0</b> pts
            			<i class="bi bi-info-circle ptstitle" title="" data-bs-toggle="tooltip">
            		</td>
            		<td>
            			<div class="input-group mb-3 input-group-sm mb-3 points">
            				<input type="text" class="form-control form-control-sm" aria-describedby="inputGroup-sizing-sm">
            			</div>
            		</td>
            	</tr>
            	<tr id="`+ i + `" style="font-size: 12px; background-color: ` + bg + ` !important;"> 
            		<td scope="row"></td>
            		<td scope="row" colspan="8">
            			<div class="summary" style="visibility: hidden">
            				Vous avez payé <span class="paid"></span> € de cotisations CIPAV en `+ i + `. 
            				Vos cotisations CIPAV définitives calculées sur vos revenus `+ i + ` sont de <span class="complet"></span> €. Vous devrez donc payer <span class="reste">XXX</span> € (<span class="complet">XXX</span> - <span class="paid">XXX</span>) de régularisation en ` + (i + 1) + ` </b><br/>
            				<span class="warningregul" style="color: #c0392b; font-size: 12px;"></span>
            			</div>	
            		</td>
            	</tr>
            `;

		$(line).appendTo($("#tbodymain"));
	}

	// construction du tableau informatif des cotisations du régime de base
	for (i = END_YEAR; i >= START_YEAR; i--) {
		//seuil  forfait tranche1 tranche1taux tranche2 tranche2taux
		classeCotisationsBase = getClasse(i, classe_cotisations_base);

		line = `<tr><td><b style="font-size: 12px">` + i + `<br /><a href="pdf/` + i + `.pdf" target="_blank">source</a></b></td>`;
		line += `<td>Revenus déficitaires ou inférieurs à ` + formatNumber(classeCotisationsBase[0]) + ` € Forfait de ` + formatNumber(classeCotisationsBase[1]) + ` € <br /> Revenus supérieurs à ` + formatNumber(classeCotisationsBase[0]) + ` € Tranche 1 8,23 % pour les revenus allant de 0 € à ` + formatNumber(classeCotisationsBase[2]) + ` € Tranche 2 1,87 % pour les revenus allant de 0 € à ` + formatNumber(classeCotisationsBase[4]) + ` € <br /> Revenus non connus Assiette forfaitaire de taxation d'office</td>`;
		line += `</tr>`;
		$(line).appendTo($("#tbodycotisbase"));
	}


	// construction du tableau informatif des cotisations du régime complémentaire
	for (i = END_YEAR; i >= START_YEAR; i--) {
		classeRevenus = getClasse(i, classe_revenus);
		classeCotisations = getClasse(i, classe_cotisations);
		classePoints = getClasse(i, classe_points);

		line = `<tr><td><b style="font-size: 12px">` + i + `<br /><a href="pdf/` + i + `.pdf" target="_blank">source</a></b></td>`;
		for (j = 0; j < classeRevenus.length; j++) {
			classe = classe_type[j];
			cotisation_complem = classeCotisations[j];
			points = classePoints[j];
			if (j == 0)
				line += `<td>Jusqu'à ` + formatNumber(classeRevenus[j]) + ` €<br />Cotisation: ` + formatNumber(cotisation_complem) + ` €<br />Points: ` + points + `</td>`;
			else if (j == classeRevenus.length - 1)
				line += `<td>` + formatNumber(classeRevenus[j - 1]) + ` € et plus<br />Cotisation: ` + formatNumber(cotisation_complem) + ` €<br />Points: ` + points + `</td>`;
			else
				line += `<td>De ` + formatNumber(classeRevenus[j - 1]) + ` à ` + formatNumber(classeRevenus[j]) + ` €<br />Cotisation: ` + formatNumber(cotisation_complem) + ` €<br />Points: ` + points + `</td>`;
		}

		line += `</tr>`;
		$(line).appendTo($("#tabcotiscomplem"));
	}



	/**********************************************************************
	
		calcul des cotisations sur modification d'un champ du formulaire
		
	**********************************************************************/
	$(".inputrevenu, .inputpaid, .regulpaid, .invalidcheck").on("change ", function() {
		row = $(this).parent().parent().parent();
		calculateYearsCotis(row);
	});

	//initialisation des tooltips
	initTooltips();
	
	//event clic sur sauvegarde
	$('#save').click(function(){
		
		for (i = END_YEAR; i >= START_YEAR; i--) {
			try {
				row = $('#'+i);
		
				localStorage.setItem(i+'.inputrevenu', row.find(".inputrevenu").val());
				localStorage.setItem(i+'.inputpaid', row.find(".inputpaid").val());
				localStorage.setItem(i+'.regulpaid', row.find(".regulpaid").val());
				
				if (row.find(".invalidcheckA").prop('checked') == true) {
					localStorage.setItem(i+'.invalidcheck', "A");
				} else if (row.find(".invalidcheckB").prop('checked') == true) {
					localStorage.setItem(i+'.invalidcheck', "B");
				} else if (row.find(".invalidcheckC").prop('checked') == true) {
					localStorage.setItem(i+'.invalidcheck', "C");
				}
			} catch (e) {
    			console.log('Une erreur à eu lieu : ' + e); 
			}
		}
		
		//date de dernière sauvegarde
  		localStorage.setItem('datesave', new Date().toLocaleString());
		showLastSave();
	    
	});
	
	$('#deletesave').click(function(){
		localStorage.clear();
		$('#lastsave').text("");
	});
	
	$('#compact').change(function() {
   		if($(this).is(":checked")) 
			$(".expanded").css({ "display": "none" });
      	else
      		$(".expanded").css({ "display": "block" });
    });
	
	if(localStorage.getItem('datesave') != null){
		showLastSave();
		
		//chargement de la sauvegarde si nécessaire
		for (t = START_YEAR; t <= END_YEAR ; t++) {
			try {
				row = $('#'+t);
				
				row.find(".inputrevenu").val(localStorage.getItem(t+'.inputrevenu'));
				row.find(".inputpaid").val(localStorage.getItem(t+'.inputpaid'));
				row.find(".regulpaid").val(localStorage.getItem(t+'.regulpaid'));
				
				if (localStorage.getItem(t+'.invalidcheck') == "A") {
					row.find(".invalidcheckA").prop('checked', true);
				} else if (localStorage.getItem(t+'.invalidcheck') == "B") {
					row.find(".invalidcheckB").prop('checked', true);
				} else if (localStorage.getItem(t+'.invalidcheck') == "C") {
					row.find(".invalidcheckC").prop('checked', true);
				}
				
				if(row.find(".inputrevenu").val() == '' && row.find(".inputrevenu").val() == ''  && row.find(".inputrevenu").val() == ''){
					continue;
				}else
					calculateYearsCotis(row);
			} catch (e) {
    			console.log('Une erreur à eu lieu : ' + e); 
			}
		}
	}
		
		
});
