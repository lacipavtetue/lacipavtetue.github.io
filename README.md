# Tableur de calcul des cotisations CIPAV

 Ce tableur permet de déterminer les cotisations sociales obligatoires de retraite CIPAV calculées selon vos revenus.

Il est destiné a aider les professionnels libéraux affiliés à la CIPAV ainsi que le corps juridique dans l'établissement du calcul des cotisations.
Il est de notoriété que les services de la CIPAV sont défaillants et régulièrement condamnés par la justice.
Si vous êtes affilié à la CIPAV, il est possible que vos droits soient spoliés (cotisations majorées, indues ou droits à la retraite amputés)
La CIPAV se retranche derrière des calculs abscons généralement majorés en votre défaveur pour déterminer vos cotisations, ce tableur permet de préciser les éléments de cotisations dont vous êtes réellement redevable ainsi que les points de retraite acquis.

Le calcul des cotisations est réalisé dans le navigateur, aucune donné n'est envoyé à un serveur, vous pouvez utiliser cette interface en toute confidentialité (possibilité d'enregistrer cette page web sur votre ordinateur pour l'utiliser en local) 

Le tableur est accessible ici : https://lacipavtetue.github.io/ 

Le code source de cette interface est libre et <a href="https://github.com/lacipavtetue/lacipavtetue.github.io" target="_blank">librement accessible sur github</a>. 
                Cette interface a été créé par des bénévoles sans lien avec la Cipav.

* **./data_cipav.js** contient les données nécessaires à l'établissement des cotisations (classes de revenus/cotisation de base/cotisation complémentaire/points associés ventilé par années) basé sur les guides de la Cipav
* **./main.js** contient la logique applicative de calcul des cotisations
