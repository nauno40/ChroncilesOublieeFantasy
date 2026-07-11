# Chroniques Oubliées Fantasy 2 — Règles au format Markdown

Transcription **complète** des règles de *Chroniques Oubliées Fantasy 2* (livre de base,
Black Book Éditions) au format Markdown, structurée par chapitre pour être exploitable dans
le projet.

## Comment ces fichiers ont été produits

- **Source :** le PDF officiel `CBHS_06_Chroniques_Oubliees_2_web_v2.pdf` (358 pages), présent dans ce dossier.
- **Méthode : extraction de la couche texte réelle du PDF (aucun OCR).** Le PDF contient déjà
  un vrai texte sélectionnable ; il a été extrait avec `pdftotext` en deux modes — mode *flux*
  (ordre de lecture des colonnes, pour la prose) et mode `-layout` (alignement spatial, pour
  reconstruire les tableaux). Un nettoyage déterministe a retiré le bruit récurrent (filigranes,
  en-têtes/pieds de page, césures de fin de ligne, glyphes de puces).
- **Mise en forme :** chaque chapitre a ensuite été restructuré en Markdown (titres, listes,
  **tableaux GFM**, encadrés en blockquotes), en recroisant les deux extractions pour rétablir
  l'ordre de lecture et reconstituer chaque tableau.
- **Fidélité :** le texte n'est ni résumé ni paraphrasé. Les coquilles présentes dans le PDF
  d'origine sont en principe conservées telles quelles.

## Arborescence

### Ouverture
- [Crédits & Avant-propos](00-front-matter.md)
- [Introduction](01-introduction.md) — qu'est-ce que le JdR, les ingrédients du jeu, la Fantasy, les Terres d'Osgild

### Partie I · Le personnage
- [Chapitre 1 · Création du personnage](partie1-personnage/01-creation-du-personnage.md)
- [Chapitre 2 · Progression & niveaux](partie1-personnage/02-progression-niveaux.md)
- [Chapitre 3 · Peuples](partie1-personnage/03-peuples.md) — demi-elfe, demi-orc, elfes, gnome, halfelin, humain, nain
- [Chapitre 4 · Famille des aventuriers](partie1-personnage/04-famille-aventuriers.md) — arquebusier, barde, rôdeur, voleur
- [Chapitre 5 · Famille des combattants](partie1-personnage/05-famille-combattants.md) — barbare, chevalier, guerrier
- [Chapitre 6 · Famille des mages](partie1-personnage/06-famille-mages.md) — ensorceleur, forgesort, magicien, sorcier
- [Chapitre 7 · Famille des mystiques](partie1-personnage/07-famille-mystiques.md) — druide, moine, prêtre
- [Chapitre 8 · Voies de prestige](partie1-personnage/08-voies-de-prestige.md)
- [Chapitre 9 · Profils hybrides](partie1-personnage/09-profils-hybrides.md)
- [Chapitre 10 · Équipement](partie1-personnage/10-equipement.md) — armes, armures, biens, équipement de qualité/exotique

### Partie II · Les règles
- [Chapitre 1 · Les règles de base](partie2-regles/01-regles-de-base.md) — le test, tests de caractéristique, points de chance
- [Chapitre 2 · Le combat](partie2-regles/02-combat.md)
- [Chapitre 3 · Magie et sorts](partie2-regles/03-magie-et-sorts.md)

### Partie III · Mener des parties
- [Chapitre 1 · Les règles de l'aventure](partie3-mj/01-regles-de-l-aventure.md) — voyage, dangers, enquête
- [Chapitre 2 · Objets magiques](partie3-mj/02-objets-magiques.md)
- [Chapitre 3 · Opposition (bestiaire)](partie3-mj/03-bestiaire-opposition.md)
- [Chapitre 4 · Devenir MJ](partie3-mj/04-devenir-mj.md)
- [Chapitre 5 · Scénario « La Tour errante »](partie3-mj/05-scenario-la-tour-errante.md)
- [Chapitre 6 · Scénario « Requiem pour Clairval »](partie3-mj/06-scenario-2.md)

### Annexes
- [Index des sorts par rang](annexes/index-des-sorts.md)
- [Feuille de personnage](annexes/feuille-de-personnage.md)

## Limitations connues

- **Pages purement illustrées** (planches de dessins d'armes, cartes, illustrations) : sans texte,
  elles n'apparaissent pas ici — seul le contenu textuel/tabulaire des règles est transcrit.
- **Feuille de personnage :** le formulaire vierge est surtout graphique ; seule la grille des
  voies possède une couche texte. Les autres champs (nom, caractéristiques…) ne figurent pas
  dans le PDF sous forme de texte et n'ont pas été inventés.
- Quelques renvois de page du PDF d'origine sont incomplets dans sa propre couche texte
  (ex. « voir pages et 56 ») ; ils sont reproduits tels quels.
