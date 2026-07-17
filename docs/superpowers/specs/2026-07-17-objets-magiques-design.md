# Design — Objets magiques / ad hoc (bonus mécaniques équipés)

- **Date :** 2026-07-17
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** design initial `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` §7 #7

## 1. Contexte & objectif

Premier sous-projet de la **Phase 5** (mécaniques spéciales). Les objets magiques et
objets créés/consommables (élixirs, runes, mutations du forgesort, butin) portent des
**bonus mécaniques** (+X à DEF, DM, tests…) que la fiche ne sait pas encore intégrer. Ce
sous-projet permet au joueur de **déclarer des objets à bonus** qui alimentent la
dérivation quand ils sont équipés — sans dépendance à des données de compendium
(entièrement piloté par le joueur), et sans toucher les fonctions pures de `cofRules`.

Le design initial (§7 #7) prévoyait des items `adhoc` porteurs de bonus dans
`playState.equipment[]`. La Phase 2 ayant matérialisé `equipment` en `string[]`
(inventaire libre), on introduit une **liste structurée séparée** `magicItems` plutôt que
de restructurer l'inventaire narratif.

## 2. Périmètre & non-objectifs

**Dans le périmètre :** modèle `playState.magicItems` ; helper pur `computeItemBonuses` ;
composition des bonus dans le hook (DEF, Init, PV max, RD, attaque) ; note globale DM ;
UI `MagicItemsPanel`. **Frontend uniquement**.

**Hors périmètre :** affectation d'un bonus DM à une **arme précise** (le DM reste une note
globale ; les armes gardent leur saisie libre) ; objets liés à des capacités du compendium
(structuration des effets = incrémental) ; consommables à usage limité (→ mécanique #4
« usages ») ; auras/bonus aux alliés (#8) ; malus/conditionnels (#9, prose).

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Stockage | **Liste séparée `magicItems`** (l'inventaire libre `equipment: string[]` reste) | Non disruptif, incrémental ; ne restructure pas l'inventaire narratif. |
| Cibles de bonus | `def \| init \| pv \| rd \| attaque \| dm` | Couvre les valeurs dérivées agrégées de la fiche ; `attaque` = bonus plat sur contact/tir/magie ; `dm` = note globale. |
| Câblage | **Composition dans le hook** (addition aux valeurs déjà dérivées) | Laisse `computeCombatStats`/`computeHybridMaxHp`/`computeDamageReduction` intactes ; un seul point d'addition. |
| Équipé | Seuls les objets `equipped` comptent | Un objet rangé ne confère pas son bonus. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque ; aucune migration. |

## 4. Modèle (`playState`)

Ajout dans `app/src/types/character.ts` (`PlayState`) :

```ts
magicItems?: MagicItem[];
```

et le type :

```ts
export type ItemBonusTarget = 'def' | 'init' | 'pv' | 'rd' | 'attaque' | 'dm';
export interface MagicItem {
    name: string;
    target: ItemBonusTarget;
    value: number;
    equipped: boolean;
}
```

## 5. Dérivation (`cofRules.ts`) — helper pur

```ts
// Somme les bonus des objets magiques ÉQUIPÉS par cible. Piloté joueur ; jamais persisté.
export const computeItemBonuses = (
  items: MagicItem[] | undefined,
): Record<ItemBonusTarget, number> => {
  const acc: Record<ItemBonusTarget, number> = { def: 0, init: 0, pv: 0, rd: 0, attaque: 0, dm: 0 };
  (items ?? []).forEach(it => {
    if (it.equipped && it.target in acc) acc[it.target] += it.value || 0;
  });
  return acc;
};
```

(`MagicItem`/`ItemBonusTarget` sont importés depuis `types/character.ts`, ou redéclarés
en forme minimale locale à `cofRules` pour éviter un couplage — décision d'implémentation.)

## 6. Composition dans le hook (`useCharacterSheet.ts`)

Calculer une fois `const itemBonuses = computeItemBonuses(playState.magicItems)`, puis
**ajouter** aux valeurs dérivées déjà exposées :

- `maxHp` → `maxHp + itemBonuses.pv`
- `combatStats` → `{ init: combatStats.init + itemBonuses.init, def: combatStats.def + itemBonuses.def }`
- `damageReduction` → `damageReduction + itemBonuses.rd`
- Exposer `itemBonuses` (pour `attaque` et `dm`, consommés à l'affichage).

Les fonctions pures de `cofRules` restent inchangées ; l'addition est locale au hook.
Aucune valeur dérivée n'est persistée.

## 7. UI

- **`MagicItemsPanel`** (nouveau) : liste éditable d'objets — nom, cible (menu `def/init/pv/
  rd/attaque/dm` avec libellés FR), valeur (nombre), case « équipé ». Récap des bonus
  actifs. Écrit `playState.magicItems`.
- **`MainStatsPanel`** : les valeurs d'attaque (contact/tir/magie) intègrent
  `itemBonuses.attaque` ; une note « +X DM (objets) » s'affiche si `itemBonuses.dm > 0`.
- Placement : nouveau panneau dans la colonne équipement, cohérent `glass-panel`.

## 8. Tests

- **Unitaires (`cofRules.test.ts`)** : `computeItemBonuses` — objets équipés sommés par
  cible, objets non équipés ignorés, liste absente → tout 0, valeurs multiples cumulées.
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (~133) ; aucun `any`.
- **E2E** : non-régression fiche (`character-sheet`) ; le panneau rend sans casser la fiche.

## 9. Migration & compatibilité

- Ajout purement additif (`magicItems?` optionnel) ; aucune fiche à convertir ; aucune
  migration backend (JSONB opaque).

## 10. Critères de succès

- Le joueur ajoute un objet à bonus (ex. « Cotte elfique → DEF +1 », « Épée +1 → DM +1 »),
  le coche « équipé », et voit DEF/Init/PV/RD/attaque se mettre à jour en direct (DM en
  note) ; décocher retire le bonus. Tout persiste dans `playState.magicItems`.
- Aucune valeur dérivée persistée ; les fonctions pures `cofRules` restent inchangées.
- `tsc`, `vitest` et l'e2e de non-régression passent.

## 11. Suite

Autres mécaniques spéciales (Phase 5, sous-projets dédiés) : usages limités (#4), compagnons
(#1), états activables (#3), substitution de carac (#5), capacités à choix (#6). Puis les
suivis incrémentaux (structurer `effect.bonuses` par capacité, coût sort PM, DEF
capacité-consciente, etc.).
