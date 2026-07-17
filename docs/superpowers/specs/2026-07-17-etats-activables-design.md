# Design — États activables (toggles/buffs avec exclusion de groupe)

- **Date :** 2026-07-17
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** design initial `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` §7 #3

## 1. Contexte & objectif

Cinquième sous-projet de la **Phase 5**. Certaines capacités COF2 sont des **états
activables** (buffs, postures, concentration) qui modifient les valeurs de jeu tant qu'ils
sont actifs — rage, postures du moine, Mains d'énergie, etc. — souvent avec des
**incompatibilités** (une seule posture à la fois). Ce sous-projet permet au joueur de
déclarer des états, de les (dés)activer en séance, et d'en composer les bonus dans la
dérivation ; le trait distinctif vs les objets magiques (#7) est l'**exclusion de groupe**.

## 2. Périmètre & non-objectifs

**Dans le périmètre :** modèle `playState.activeStates` ; helpers purs
`computeActiveStateBonuses` (somme des états actifs) et `activateState` (toggle + exclusion
de groupe) ; composition des bonus dans le hook (combinés aux objets magiques) ; UI
`ActiveStatesPanel`. **Frontend uniquement**.

**Hors périmètre :** exclusions **cross-mécaniques dures** (« la rage empêche de lancer des
sorts » — pas de moteur de sorts sur la fiche) → restent indicatives (notes) ; l'auto-
dérivation depuis `Capability.effect.activation` (structuration incrémentale) ; les états à
effet non numérique (restent en prose).

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Source | **Piloté joueur** (déclaration + toggle) | `effect.activation` non peuplé ; self-contained, cohérent avec #7/#4. |
| Bonus | Réutilise les cibles des objets (`def\|init\|pv\|rd\|attaque\|dm`), **un bonus par état** | Compose exactement comme les objets équipés ; DRY. |
| Exclusion | **Une seule active par `group`** (groupes déclarés par le joueur, souple) | Modélise postures/stances sans dépendance données. |
| Câblage | **Composition dans le hook** (objets + états combinés) | Fonctions pures inchangées ; un seul point de combinaison. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque ; aucune migration. |

## 4. Modèle (`playState`)

Ajout dans `app/src/types/character.ts` :

```ts
export interface ActiveState {
    name: string;
    group?: string;                        // groupe d'exclusion (une seule active par groupe)
    active: boolean;
    target: ItemBonusTarget;               // def | init | pv | rd | attaque | dm
    value: number;
}
```

(`ItemBonusTarget` existe déjà — sous-projet objets magiques.)

et dans `interface PlayState`, après `caracSubstitutions?` :

```ts
    activeStates?: ActiveState[];          // buffs/postures activables (bonus quand actifs)
```

## 5. Helpers purs (`cofRules.ts`)

```ts
// Somme les bonus des états ACTIFS par cible (piloté joueur, jamais persisté).
export const computeActiveStateBonuses = (
  states: ActiveState[] | undefined,
): Record<ItemBonusTarget, number> => {
  const acc: Record<ItemBonusTarget, number> = { def: 0, init: 0, pv: 0, rd: 0, attaque: 0, dm: 0 };
  (states ?? []).forEach(s => { if (s.active && s.target in acc) acc[s.target] += s.value || 0; });
  return acc;
};

// (Dés)active un état ; en activant un état d'un `group`, désactive les autres du même groupe.
export const activateState = (
  states: ActiveState[] | undefined,
  idx: number,
  active: boolean,
): ActiveState[] => {
  const list = states ?? [];
  const grp = list[idx]?.group;
  return list.map((s, i) => {
    if (i === idx) return { ...s, active };
    if (active && grp && s.group === grp) return { ...s, active: false }; // exclusion de groupe
    return s;
  });
};
```

## 6. Composition dans le hook (`useCharacterSheet.ts`)

Le hook calcule déjà `itemBonuses` (objets équipés). Ajouter `stateBonuses` puis un objet
**combiné** utilisé pour la composition et exposé :

```ts
const stateBonuses = useMemo(() => computeActiveStateBonuses(playState.activeStates), [playState.activeStates]);
const bonuses = { def: itemBonuses.def + stateBonuses.def, init: itemBonuses.init + stateBonuses.init,
  pv: itemBonuses.pv + stateBonuses.pv, rd: itemBonuses.rd + stateBonuses.rd,
  attaque: itemBonuses.attaque + stateBonuses.attaque, dm: itemBonuses.dm + stateBonuses.dm };
```

`combatStats`/`maxHp`/`damageReduction` se composent désormais avec `bonuses` (au lieu de
`itemBonuses`) ; le hook expose `bonuses` (attaque/dm consommés par `MainStatsPanel`). Les
fonctions pures `cofRules` restent inchangées ; aucune valeur dérivée persistée.

## 7. UI (`ActiveStatesPanel`, nouveau)

- Liste d'états : **toggle actif** (via `activateState` → respecte l'exclusion de groupe),
  **nom**, **groupe** (optionnel), **cible** (menu), **valeur**, suppression. Un état actif
  est mis en évidence.
- Écrit `playState.activeStates`. Placement : colonne équipement/jeu, style `glass-panel`.

## 8. Tests

- **Unitaires (`cofRules.test.ts`)** : `computeActiveStateBonuses` (actifs sommés, inactifs
  ignorés, liste absente → 0) ; `activateState` (toggle simple ; activer dans un groupe
  désactive les autres du groupe ; sans groupe n'affecte que l'état ciblé).
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (~133) ; aucun `any`.
- **E2E** : non-régression fiche (`character-sheet`).

## 9. Migration & compatibilité

- Ajout purement additif (`activeStates?` optionnel) ; aucune fiche à convertir ; aucune
  migration backend. Sans état actif, les dérivés sont identiques (bonus 0).

## 10. Critères de succès

- Le joueur déclare des états, les active/désactive (l'exclusion de groupe fonctionne), et
  voit DEF/Init/PV/RD/attaque se composer avec les états actifs (comme les objets).
- Aucune valeur dérivée persistée ; fonctions pures inchangées.
- `tsc`, `vitest` et l'e2e de non-régression passent.

## 11. Suite

Autres mécaniques Phase 5 : capacités à choix (#6), transformations (#2). Incrémental :
auto-dérivation depuis `effect.activation`, exclusions cross-mécaniques, système de repos.
