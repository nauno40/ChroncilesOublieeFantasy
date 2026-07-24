# Séparation technique / métier (frontend) — Design

**Date :** 2026-07-24
**Branche de départ :** `refactor/couches-technique-metier`
**Objectif utilisateur :** séparer clairement la partie **technique** (I/O, API, infra) de la partie **métier** (règles COF2), pour un code plus lisible et testable.

## Diagnostic

Le **backend est déjà surtout technique** (API Platform déclaratif : CRUD/persistance/auth ; la dérivation des règles vit côté front par choix de design). **Le mélange technique/métier est côté frontend**, concentré dans `app/src/utils/` — un fourre-tout :

| Fichier `utils/` | Nature |
|---|---|
| `cofRules.ts` (773 l.), `combatTracker.ts`, `encounters.ts`, `magicItems.ts`, `creature.ts` (+ tests) | **Métier pur** (règles, fonctions sans React ni I/O) |
| `campaignService.ts` (222 l.) | **Technique** (mapping front↔back + CRUD API) — mal rangé |

Deux problèmes : (1) `utils/` mélange métier pur et un service technique ; (2) `cofRules.ts` est un **monolithe de 773 lignes / ~50 fonctions** non découpé.

## Cible : 4 couches explicites

```
app/src/
├── domain/        ← MÉTIER : règles COF2 pures (aucune dépendance React ni I/O)
│   ├── rules/     ← cofRules.ts éclaté en modules focalisés + barrel index.ts
│   ├── combatTracker.ts, encounters.ts, magicItems.ts, creature.ts (+ tests)
├── services/      ← TECHNIQUE : accès données/I/O (api, AuthService, dataService,
│                    monsterService, sharingService, + campaignService rapatrié)
├── hooks/         ← APPLICATION : orchestration + état React (bridge domaine ↔ services ↔ UI)
├── components/, pages/  ← PRÉSENTATION
├── types/, constants/, context/   ← contrats & transverses (inchangés)
```

**Principe :** le `domain/` ne dépend que de `types/` (aucun `import` de `services/`, `react`, `fetch`). C'est le critère de séparation. `utils/` disparaît (ou ne garde que d'éventuels helpers vraiment génériques).

### Découpage de `cofRules.ts` → `domain/rules/`

| Module | Contenu |
|---|---|
| `types.ts` | Types partagés du domaine (`Stats`, `Compendium*`, `Protection`, `BonusTarget`, `CapabilityEffect`, `RacialGrant`, …) |
| `stats.ts` | `calculateMod`, `STAT_SERIES`, `computeModifiers`, `computeFinalStats`, `migrateLegacyStats`, `MIN/MAX_STAT` |
| `health.ts` | `FAMILY_BASE_HP`, `computeMaxHp`, `computeHybridMaxHp`, `PROFILE_FAMILIES`, `computeRecoveryDie`, `recoveryDice`, `shortRestHeal`, `applyShortRest`, `applyLongRest` |
| `resources.ts` | `computeLuckPoints`, `computeManaPoints` |
| `progression.ts` | `RANK_REQUIRED_LEVEL`, `PRESTIGE_*`, `capacityCost`, `capacityBudget`, `MAX_VOIES`, `countCappedVoies`, `canAddVoie`, `voieKindOf`, `rankUnlockLevel`, `rankCost`, `canAcquireRank`, `computeSpentPoints` |
| `effects.ts` | `evolutiveDie`, `resolveCapabilityEffect`, `aggregateResolvedBonuses` |
| `combat.ts` | `computeCombatStats`, `attackValue`, `attackCarac`, `computeDamageReduction`, `resolveArmorCap`, `resolveCaracTestBonuses` |
| `languages.ts` | `computeLanguageSlots`, `computeLanguageUsage`, `RACE_NATIVE_LANGUAGE`, `baseLanguages` |
| `racial.ts` | `racialGrantInfo`, `isTraitGrantValid` |
| `mechanics.ts` | `computeItemBonuses`, `computeActiveStateBonuses`, `activateState`, `resetUsages`, `companionFromCreature`, `formFromCreature`, `activateForm` |
| `choices.ts` | `capabilityChoiceKey`, `capabilityChoiceHelp` |
| `index.ts` | **barrel** : `export * from './stats'` … (surface publique identique à l'ancien `cofRules.ts`) |

Les tests suivent leur module (`cofRules.test.ts` reste au vert en important le barrel, puis pourra être découpé plus tard — hors périmètre).

## Contrainte absolue : **zéro changement de comportement**

C'est un refactor de structure. **Aucune** modification de logique. Le filet de sécurité = les gates existants, verts **à chaque PR** : `tsc -b` (0), `vitest run` (identique), `npm run lint` (0 nouvelle erreur), e2e existants. Les barrels/ré-exports évitent de casser les imports.

## Séquence incrémentale (une PR par mouvement)

- **PR A — `campaignService` → `services/`** : déplacer `utils/campaignService.ts` → `services/campaignService.ts`, mettre à jour ses 8 importeurs. (Inclut cette spec.)
- **PR B — couche `domain/` (déplacement)** : créer `app/src/domain/`, y déplacer `combatTracker.ts`, `encounters.ts`, `magicItems.ts`, `creature.ts` (+ leurs tests), mettre à jour les importeurs.
- **PR C — découpe de `cofRules.ts`** : créer `domain/rules/*` (modules ci-dessus) + `domain/rules/index.ts` (barrel). `utils/cofRules.ts` devient un simple ré-export `export * from '../domain/rules'` → **zéro churn d'imports**, gates verts.
- **PR D — bascule des imports + suppression du shim** : remplacer partout `utils/cofRules` → `domain/rules`, supprimer `utils/cofRules.ts`. Import rename mécanique. `utils/` ne contient alors plus que d'éventuels helpers génériques (sinon supprimé).

Chaque PR est autonome, revue facilement, et laisse l'app fonctionnelle.

## Hors périmètre

- Refonte hexagonale complète (ports/adapters) — sur-ingénierie pour un SPA.
- Découpe des composants ou des hooks (autre sujet).
- Backend (déjà surtout technique ; extraction des tables de dérivation de `AppFixtures` = éventuel chantier séparé).
- Découpe de `cofRules.test.ts` en fichiers par module (peut suivre plus tard).

## Découpage prévu

4 PR (A→D), chacune un plan d'exécution simple (déplacements + mise à jour d'imports + gates). PR A d'abord (la plus petite), puis B, C, D.
