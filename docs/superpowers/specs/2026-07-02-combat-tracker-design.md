# Refonte du Suivi de Combat (Combat Tracker) — Design

**Date** : 2026-07-02
**Statut** : validé, prêt pour plan d'implémentation
**Périmètre** : frontend uniquement (`app/`), 100 % client-side

## Contexte

L'outil MJ « Suivi de Combat » (`app/src/pages/CombatTracker.tsx`, route `/tools/tracker`)
est aujourd'hui un **prototype mock** : l'UI et la logique tours/rounds/PV fonctionnent, mais
les combattants sont générés par un `generateCombatant()` avec une **initiative aléatoire (d20)**,
des **PV/CA en dur** (30/50, CA 15), **aucune connexion** au bestiaire ou aux personnages, et
**aucune persistance** (état en `useState`, perdu au rechargement).

Objectif : en faire un vrai outil de table utilisable en session — données réelles, persistance,
états préjudiciables — sans backend ni temps réel (explicitement des phases futures dans
`doc/etat_des_lieux/roadmap.md` : sync Mercure, grille de combat).

## Décisions validées

- **Architecture** : client-side, persistance `localStorage` (comme les autres outils MJ).
- **Initiative** : valeur **INIT fixe COF2** (pas de jet de dé), tri décroissant, éditable.
- **Fonctionnalités** : persistance + import bestiaire + import PJ + états préjudiciables
  (+ saisie libre dégâts/soins).

## Architecture

Réécriture de `CombatTracker.tsx` en outil réel. La **logique pure** (tri, avance de tour,
retrait) est extraite dans un module testable `app/src/utils/combatTracker.ts` ; le composant
ne garde que l'état React, la persistance et le rendu.

### Sources de données (via `DataService`, `app/src/services/dataService.ts`)

Chargées à l'ouverture du panneau d'ajout, mises en cache dans l'état du composant :

- **Bestiaire** — `DataService.getCreatures()` → type `Creature` (`hp`, `init`, `def`).
  Ajout avec **quantité** et **auto-numérotation** en cas de doublon (« Gobelin 1 », « Gobelin 2 »).
- **Personnages (PJ)** — liste des `Character` de l'utilisateur (mêmes appels que `CharacterList.tsx`).
  Stats de combat `init` / `def` / `hp` issues du blob `data` (calculées par
  `cofRules.computeCombatStats()` : `init = 10 + PerMod`, `def = 10 + AgiMod + armure + bouclier`).
- **États préjudiciables** — compendium `HarmfulState` (getter `DataService`, comme la page `States.tsx`).
- **Manuel** — saisie libre (nom + init + PV + def) pour un PNJ improvisé.

### Type & persistance

- Étendre l'interface `Combatant` (`app/src/types/campaign.ts`) :
  - renommer `ac` → `def` (usage strictement interne au tracker),
  - ajouter `states: string[]` (noms/ids d'états posés),
  - ajouter `source?: 'manual' | 'bestiary' | 'character'`,
  - conserver `referenceId?` (id source bestiaire/perso).
- Clé `localStorage['co_combat_tracker']` stockant `{ round, activeId, combatants: Combatant[] }`.
- Pattern identique à `Soundboard.tsx` / `GlobalNotes.tsx` : `useState` initialisé depuis
  `localStorage`, `useEffect` de sauvegarde à chaque changement.

## Logique de combat (`utils/combatTracker.ts`, pure)

- **Tri** par `init` décroissant (COF2). Égalités : ordre stable (insertion).
- **Tour actif suivi par `id`**, pas par index. Corrige le bug actuel où la suppression d'un
  combattant décale/casse le tour actif.
- **`nextTurn`** : avance au combattant suivant dans l'ordre trié ; le passage du dernier au
  premier incrémente le `round`.
- **`removeCombatant`** : retire par id, recalcule le tour actif sans corruption.

Fonctions pures exportées (signatures indicatives) :
`sortByInitiative(combatants)`, `nextTurn(state) -> state`, `removeCombatant(state, id) -> state`.

## UI — rangée de combattant

Badge **INIT** (éditable inline) · nom · **DEF** · bloc **PV** avec **saisie libre dégâts/soins**
(en plus des ±1 rapides), clampé `0…max`, rouge sous 50 % · **badges d'états** (ajout via petit
sélecteur issu du compendium, retrait au clic) · bouton suppression. En-tête : compteur de round +
bouton « Tour suivant ». Style repris de l'existant (`glass-panel`, thème primary/stone).

## Tests

Tests unitaires vitest sur `utils/combatTracker.ts` (le runner existe déjà : `cofRules.test.ts`) :

- tri par init décroissant,
- `nextTurn` avance et wrap → incrémente le round,
- `removeCombatant` ne corrompt pas le tour actif (retrait du combattant actif, d'un précédent,
  du dernier).

## Hors périmètre (YAGNI)

- Persistance backend / entité `Encounter` (le type frontend `Encounter` vestigial et le bouton
  mort « Créer une rencontre » de `CampaignDetail.tsx` restent inchangés).
- Synchronisation temps réel (Mercure/WebSockets) — phase future.
- Grille / carte de combat — phase future.

## Fichiers touchés

- **Réécrit** `app/src/pages/CombatTracker.tsx`
- **Créé** `app/src/utils/combatTracker.ts` (+ `app/src/utils/combatTracker.test.ts`)
- **Modifié** `app/src/types/campaign.ts` (interface `Combatant`)
- Possible getter à ajouter dans `app/src/services/dataService.ts` si `HarmfulState` n'est pas
  déjà exposé.

## Vérification

- `npm run build` (type-check) et `npm run lint` sans nouvelle erreur (baseline no-explicit-any connue).
- `npm run test:run` (vitest) : les tests de `combatTracker.ts` passent.
- Manuel : ajouter un monstre du bestiaire (PV/INIT/DEF pré-remplis), un PJ, poser un état,
  appliquer des dégâts, avancer les tours sur plusieurs rounds, **recharger la page** → l'état est
  restauré depuis `localStorage`.
