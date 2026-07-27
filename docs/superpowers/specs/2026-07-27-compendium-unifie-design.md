# Compendium unifié (officiel + communauté) — design

**Constat** : l'app est devenue un *compendium communautaire + aide de jeu*, mais l'agencement sépare le contenu officiel (Compendium) du contenu communautaire/homebrew (Bibliothèque, Mes Monstres, rangés sous « Aide de jeu »). Or, la Bibliothèque étant désormais structurée (une race homebrew = même schéma qu'une race officielle), officiel et communautaire du même type devraient cohabiter.

**Décision** (validée) : **compendium unifié par type**, chaque page de type affichant Officiel + Communauté + Mes créations, avec création homebrew en place. « Mes Monstres » se fond dans « Créatures » ; la « Bibliothèque » se dissout dans les pages de type. L'aide de table se réduit aux vrais outils de partie.

## Nav cible

- **Accueil**
- **Ma table** : Campagnes · Mes Personnages
- **Compendium** (officiel + communauté) : Règles · Peuples · Profils · Voies · Capacités & Sorts · Créatures · Équipement · Objets magiques · États · Poisons · Pièges
- **Table de jeu** : Combat Tracker · Dés · Ambiances

## Motif « page de type unifiée » (réutilisable)

- **Filtre source** : Officiel · Communauté · Mes créations (+ Tous).
- **Bouton « + Créer »** → formulaire structuré en place (composants existants : `HomebrewFields` pour HomebrewEntry, `MonsterForm` pour CustomCreature).
- Recherche + filtres existants du type.
- Fiche : rendu officiel existant (pages *Detail*) OU rendu homebrew structuré (`HomebrewData`). Sur le communautaire : « Dupliquer chez moi ».

### Mapping type ↔ sources

| Page de type | Officiel | Communauté / Mes créations |
|---|---|---|
| Peuples | Race | HomebrewEntry `race` |
| Profils | Profile | HomebrewEntry `classe` |
| Voies | Voie | HomebrewEntry `voie` |
| Capacités & Sorts | Capability | HomebrewEntry `capacite` / `sort` |
| **Créatures** | Creature | **CustomCreature** (schéma structuré + tracker) |
| Équipement | Equipment | HomebrewEntry `equipement` |
| Objets magiques | (calculateur) | HomebrewEntry `objet-magique` |
| États | HarmfulState | HomebrewEntry `etat` |
| Poisons | Poison | HomebrewEntry `poison` |
| Pièges | Trap | HomebrewEntry `piege` |

## Phasage

- **Phase 1 — Créatures** : fusionner Bestiaire + Mes Monstres en une page « Créatures » (filtre source, création/édition CustomCreature en place, duplication, lien tracker). Retirer « Mes Monstres » de la nav ; « Bestiaire » → « Créatures ». Prouve le motif.
- **Phase 2 — Peuples · Profils · Voies · Capacités/Sorts** : intégrer HomebrewEntry (par catégorie) dans les pages compendium correspondantes (filtre source + création en place via HomebrewFields).
- **Phase 3 — Objets magiques · Équipement · États/Poisons/Pièges** : idem, puis **dissolution de la Bibliothèque** (page retirée ou réduite à une vue « Mes créations » agrégée) et **refonte finale de la nav** (renommer « Aide de jeu » → « Table de jeu », n'y garder que Tracker/Dés/Ambiances ; sortir Objets magiques comme type de compendium).

## Invariants

- Le contenu communautaire reste **consultable + duplicable**, pas d'intégration mécanique du contenu d'autrui (cf. vision). Exception existante : CustomCreature (mes créatures) utilisables au tracker.
- Backend inchangé (les entités et le scoping existent déjà) — refonte surtout front (composants de page + nav).
- Gates habituels par phase : tsc/lint/vitest, phpunit si backend touché, vérif visuelle desktop + mobile.
