# Design — Système de repos COF2 (récupération rapide / complète)

- **Date :** 2026-07-18
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** design initial `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` §4.3 (sémantique de repos)

## 1. Contexte & objectif

La fiche suit désormais les réserves de jeu (PV, PM, dés de récupération DR, usages) mais
n'a aucune **action de repos** pour les restaurer. Ce sous-projet ajoute les deux repos
COF2 — **récupération rapide** (repos court) et **récupération complète** (repos long) —
comme actions d'aide de table qui mutent `playState`. Il **réutilise `resetUsages`** (livré
avec les usages limités) et clôt la boucle « suivi en séance ».

## 2. Règle COF2 (§4.3)

- **Récupération rapide (repos court, 30 min)** : dépense **1 DR** (`recovery.used +1`, dans
  la limite du total) → soigne **(1 dé de récup. lancé + ½ niveau)** PV, plafonné aux PV
  max ; réinitialise les usages `combat` (et `round`).
- **Récupération complète (repos long, 8 h, 1/jour)** : restaure **tous les PM**
  (`mana.current` = max), régénère les DR (`recovery.used → 0`), remet les PV au max, et
  réinitialise les usages `jour` (+ `combat` + `round`).

## 3. Périmètre & non-objectifs

**Dans le périmètre :** helpers purs `recoveryDice`, `shortRestHeal`, `applyShortRest`,
`applyLongRest` ; UI `RestPanel` (deux actions, jet de DR in-app). **Frontend uniquement**.

**Hors périmètre :** les **points de chance** (PC), qui se rafraîchissent par séance et non
par repos → non touchés ; l'état « **0 PV → inconscient + perte d'1 DR** » (indicateur
visuel possible, mais **pas d'automatisme** de pénalité) ; le suivi calendaire du « 1/jour »
du repos long (pas de compteur de jours) ; le soin exact du repos long au-delà de « PV au
max » (simplification assumée).

## 4. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Jet du DR (repos court) | **Lancé en app** (`Math.random`) | Pratique en séance ; le résultat s'affiche. |
| État de repos | Mute `playState` (`hp`/`mana`/`recovery`/`usages`) | Aide de table ; réutilise `resetUsages`. |
| PC (points de chance) | **Non touchés** | Rafraîchis par séance, pas par repos (règles). |
| Transitions d'état | **Fonctions pures testables** (`applyShortRest`/`applyLongRest`) | Le cœur logique est testé ; le jet (aléatoire) reste dans l'UI. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque ; valeurs dérivées lues du hook. |

## 5. Helpers purs (`cofRules.ts`)

```ts
// Nombre de dés de récupération (DR) et faces du dé, dérivés du profil (COF2).
// total = base de famille + CON (min 0) ; sides = faces du dé de la famille (6/8/10).
export const recoveryDice = (
  profileName: string | undefined,
  conMod: number,
): { total: number; sides: number } => {
  const family = profileName ? PROFILE_FAMILIES[profileName] : undefined;
  if (!family) return { total: 0, sides: 0 };
  return { total: Math.max(0, family.base + conMod), sides: parseInt(family.die.slice(1), 10) || 0 };
};

// Soin d'un repos court : dé de récup. lancé + ½ niveau (arrondi inférieur).
export const shortRestHeal = (dieRoll: number, level: number): number =>
  dieRoll + Math.floor((level || 0) / 2);

// Applique un repos court : soigne (plafonné maxHp), dépense 1 DR (plafonné total),
// réinitialise les usages combat/round. Pur.
export const applyShortRest = (
  ps: PlayState,
  opts: { heal: number; maxHp: number; drTotal: number },
): PlayState => ({
  ...ps,
  hp: { ...ps.hp, current: Math.min(opts.maxHp, ps.hp.current + opts.heal) },
  recovery: { ...ps.recovery, used: Math.min(opts.drTotal, (ps.recovery.used || 0) + 1) },
  usages: resetUsages(ps.usages, ['combat', 'round']),
});

// Applique un repos long : PV & PM au max, DR régénérés, usages jour/combat/round reset. Pur.
export const applyLongRest = (
  ps: PlayState,
  opts: { maxHp: number; maxMana: number },
): PlayState => ({
  ...ps,
  hp: { ...ps.hp, current: opts.maxHp },
  mana: { ...ps.mana, current: opts.maxMana },
  recovery: { ...ps.recovery, used: 0 },
  usages: resetUsages(ps.usages, ['jour', 'combat', 'round']),
});
```

## 6. Câblage hook (`useCharacterSheet.ts`)

Exposer l'info de DR pour le repos court :

```ts
const recoveryInfo = recoveryDice(profileName, mods.CON); // { total, sides }
```

et l'ajouter au retour (à côté de `maxHp`, `manaPoints`, `recoveryDieString`). Le
`RestPanel` reçoit `maxHp`, `maxMana` (= `manaPoints`) et `recoveryInfo` en props.

## 7. UI (`RestPanel`, nouveau)

- Deux boutons :
  - **Repos court** : si `recovery.used < recoveryInfo.total`, lance `1dX` (X =
    `recoveryInfo.sides`), calcule `shortRestHeal(jet, niveau)`, applique via
    `applyShortRest(ps, { heal, maxHp, drTotal: recoveryInfo.total })`, affiche « +N PV
    (dé : R) » ; sinon indique « aucun DR disponible ».
  - **Repos long** : applique `applyLongRest(ps, { maxHp, maxMana })` (PV/PM au max, DR
    régénérés, usages reset).
- Un petit récap « DR : {total − used} / {total} » (disponibles). Placement : colonne
  équipement/jeu, style `glass-panel`.
- Écrit `playState` (via `setCharacter`).

## 8. Tests

- **Unitaires (`cofRules.test.ts`)** : `recoveryDice` (total = base+CON, sides du dé ;
  profil inconnu → 0/0) ; `shortRestHeal` (dé + ½ niveau) ; `applyShortRest` (soin plafonné
  maxHp, `used+1` plafonné total, usages combat/round remis à 0, jour intact) ;
  `applyLongRest` (PV/PM au max, used=0, usages jour/combat/round remis à 0).
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (~133) ; aucun `any`.
- **E2E** : non-régression fiche (`character-sheet`).

## 9. Migration & compatibilité

- Aucun changement de modèle (les champs `hp`/`mana`/`recovery`/`usages` existent déjà) ;
  aucune migration. Purement additif (helpers + UI).

## 10. Critères de succès

- Repos court : dépense 1 DR, soigne (dé + ½ niveau) plafonné, reset usages combat/round ;
  bloqué si aucun DR. Repos long : PV/PM au max, DR régénérés, usages jour/combat/round
  reset. Les PC ne bougent pas.
- Fonctions pures testées ; aucune valeur dérivée persistée (les repos écrivent les
  `current`/`used`, qui sont bien de l'état de jeu).
- `tsc`, `vitest` et l'e2e passent.

## 11. Suite

Dernière mécanique Phase 5 : **capacités à choix (#6)** — compendium-driven (structuration
des options par capacité). Incrémental : indicateur « 0 PV / inconscient », gestion du
« 1/jour » du repos long, structuration des `effect.*`.
