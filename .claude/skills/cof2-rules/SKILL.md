---
name: cof2-rules
description: Use when developing, reviewing, or debugging any game-rules logic in this Chroniques Oubliées Fantasy 2 companion app — character creation, caractéristiques, PV/DR/PC/PM, initiative, défense, valeurs d'attaque, progression, combat, magie/mana, profils/voies/capacités, équipement, armures, bestiaire, objets magiques. Consult before implementing or changing any auto-computed stat or rules behavior.
---

# Règles COF2 (source de vérité)

Les **règles complètes de Chroniques Oubliées Fantasy 2** vivent dans ce dépôt, en
Markdown, dans **`doc/getRulesFullToMD/`** (transcription fidèle du livre officiel, sans OCR).
**Elles font foi.** Avant d'implémenter ou de modifier une mécanique, ouvre le fichier
concerné et vérifie la règle exacte — ne code jamais une mécanique de mémoire.

## Où trouver quoi

Index complet : `doc/getRulesFullToMD/README.md`. Les plus utiles pour le code :

| Sujet | Fichier |
|---|---|
| Création perso, **caractéristiques**, PV, DR, PC, PM, Init, DEF, attaques, progression pas-à-pas | `partie1-personnage/01-creation-du-personnage.md` |
| Progression & niveaux (coût des capacités, rang→niveau requis, dés évolutifs d4°) | `partie1-personnage/02-progression-niveaux.md` |
| Peuples (modificateurs, voies de peuple) | `partie1-personnage/03-peuples.md` |
| Profils : familles, stats de profil, **armures maîtrisées**, 5 voies × 5 capacités | `partie1-personnage/04..07-famille-*.md` |
| Voies de prestige (rangs 4-8) | `partie1-personnage/08-voies-de-prestige.md` |
| Équipement : **tables armes/armures** (DEF, DM, prix, portée) | `partie1-personnage/10-equipement.md` |
| Règles de base (le test, difficultés, PC) | `partie2-regles/01-regles-de-base.md` |
| Combat (round, init, actions, options tactiques, DM) | `partie2-regles/02-combat.md` |
| Magie & sorts (lancer un sort, récup mana) | `partie2-regles/03-magie-et-sorts.md` |
| Objets magiques (puissance, catégories) | `partie3-mj/02-objets-magiques.md` |
| Bestiaire (profils de créatures, table NC) | `partie3-mj/03-bestiaire-opposition.md` |

## Invariants de fidélité à respecter dans le code

Ces points sont ceux où l'on se trompe le plus (paradigme D&D ≠ COF2) :

- **Les caractéristiques SONT les valeurs, pas des scores.** À COF2 chaque carac vaut
  **‑2 à +5** et s'utilise **directement**. Il n'y a **PAS** de score 3-18 ni de conversion
  `floor((score-10)/2)`. À la création on choisit une **série** (polyvalent `+2,+2,+2,+1,+1,0,‑1`,
  expert `+3,+2,+1,+1,0,0,‑1`, spécialiste `+4,+2,+1,0,0,‑1,‑1`) puis on applique le
  **modificateur de peuple (±1 à la valeur)**.
- **Formules de niveau 1** (la carac = sa valeur directe) :
  - **PV** = `(2 × PV_base_famille) + CON` — PV_base : Aventuriers 4, Combattants 5, Mages 3, Mystiques 4.
  - **DR** = `[2 + CON]` dés (Mystiques `[3 + CON]`) ; type : Aventuriers/Mystiques d8, Combattants d10, Mages d6.
  - **PC** = `[2 + CHA]` ; Aventuriers **+1** ; voie de l'humain (Diversité, rang 1) **+1**.
  - **PM** = `VOL + nb de sorts appris`, seulement si ≥ 1 sort (capacité marquée `*`).
  - **Initiative** = `10 + PER` (+ bonus de capacités).
  - **DEF** = `10 + AGI + DEF armure + DEF bouclier` (+ bonus de capacités).
  - **Attaques** = `niveau + FOR` (contact), `niveau + AGI` (distance), `niveau + VOL` (magique).
- **Limite d'armure par profil** (DEF max de l'armure la plus lourde autorisée ; valeurs de la
  table équipement : cuir simple +2, cuir renforcé +3, chemise de mailles +4, cotte de mailles +5,
  plaque +6, plaque complète +7) :

  | Profil | Limite | DEF max |
  |---|---|---|
  | Magicien, Ensorceleur, Sorcier, **Moine** | aucune armure | 0 |
  | **Forgesort**, Voleur, Druide | cuir simple | 2 |
  | Barde, Rôdeur, Barbare | cuir renforcé | 3 |
  | Arquebusier, Prêtre | chemise de mailles | 4 |
  | Guerrier | cotte de mailles | 5 |
  | Chevalier | plaque (complète = +7 via capacité rang 3) | 6 |

  (Certaines capacités relèvent ces limites : barbare→chemise de mailles au rang 2, guerrier→plaque
  au rang 3, chevalier→plaque complète au rang 3, prêtre d'une divinité guerrière→cotte de mailles.)

## Le code de règles

La logique de calcul vit surtout dans `app/src/utils/cofRules.ts` (+ `cofRules.test.ts`),
consommée par `app/src/hooks/useCharacterSheet.ts` et les composants `app/src/components/character/`.
Combat/rencontres : `app/src/utils/combatTracker.ts`, `encounters.ts`, `creature.ts`.
Compendium (données) : fixtures backend `backend/data/*.json` + `backend/src/DataFixtures/AppFixtures.php`.

Quand une valeur calculée diverge des exemples chiffrés du livre (Lhagva, Ionas dans le
chapitre création), **le livre a raison** : corrige le code, pas la règle.
