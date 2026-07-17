# Objets magiques / ad hoc — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au joueur de déclarer des objets magiques / ad hoc porteurs de bonus mécaniques (DEF, Init, PV, RD, attaque, DM) qui alimentent la dérivation quand ils sont équipés.

**Architecture :** Frontend seul (`playState` = JSON opaque, aucune migration). Liste structurée `playState.magicItems` séparée de l'inventaire libre. Helper pur `computeItemBonuses` sommant les objets équipés par cible ; les bonus sont **composés dans le hook** (ajoutés aux valeurs déjà dérivées) sans toucher les fonctions pures `computeCombatStats`/`computeHybridMaxHp`/`computeDamageReduction`. Nouveau composant `MagicItemsPanel`. Aucune valeur dérivée persistée.

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-17-objets-magiques-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration backend.
- **Aucune valeur dérivée persistée** : seuls les objets `playState.magicItems` (saisie joueur) sont stockés ; les bonus sont recalculés à l'affichage.
- **Fonctions pures `cofRules` inchangées** : la composition se fait dans le hook (addition unique).
- **Seuls les objets `equipped`** contribuent.
- **Baseline lint** ~133 ; gate = **0 nouvelle**, aucun nouveau `any`.
- Cibles : `def | init | pv | rd | attaque | dm`. `attaque` = bonus plat sur les attaques affichées (contact/tir) ; `dm` = note globale.

## File Structure

- **`app/src/types/character.ts`** — types `ItemBonusTarget`, `MagicItem` + champ `magicItems?` (Task 1).
- **`app/src/utils/cofRules.ts`** + **`.test.ts`** — `computeItemBonuses` (Task 1).
- **`app/src/hooks/useCharacterSheet.ts`** — compose les bonus, expose `itemBonuses` (Task 2).
- **`app/src/components/character/MagicItemsPanel.tsx`** — nouveau (Task 2).
- **`app/src/components/character/MainStatsPanel.tsx`** — attaque + note DM (Task 2).
- **`app/src/pages/CharacterSheet.tsx`** — intègre le panneau + props (Task 2).

---

### Task 1 : Types + `computeItemBonuses` (TDD)

**Files:**
- Modify: `app/src/types/character.ts`, `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `ItemBonusTarget`, `MagicItem` (types) ; `computeItemBonuses(items: MagicItem[] | undefined): Record<ItemBonusTarget, number>`.

- [ ] **Step 1 : Types dans `character.ts`**

Dans `app/src/types/character.ts`, ajouter (avant `interface PlayState`) :

```ts
export type ItemBonusTarget = 'def' | 'init' | 'pv' | 'rd' | 'attaque' | 'dm';
export interface MagicItem {
    name: string;
    target: ItemBonusTarget;
    value: number;
    equipped: boolean;
}
```

et dans `interface PlayState`, après `weapons: CharacterWeapon[];` :

```ts
    magicItems?: MagicItem[];              // objets à bonus mécaniques (équipés ⇒ dérivation)
```

- [ ] **Step 2 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `computeItemBonuses` depuis `./cofRules`) :

```ts
describe('computeItemBonuses (objets magiques équipés)', () => {
  const zero = { def: 0, init: 0, pv: 0, rd: 0, attaque: 0, dm: 0 };
  it('liste absente ⇒ tout 0', () => {
    expect(computeItemBonuses(undefined)).toEqual(zero);
  });
  it('somme les bonus des objets ÉQUIPÉS par cible', () => {
    const items = [
      { name: 'Cotte elfique', target: 'def' as const, value: 1, equipped: true },
      { name: 'Épée +1', target: 'dm' as const, value: 1, equipped: true },
      { name: 'Amulette', target: 'def' as const, value: 2, equipped: true },
    ];
    expect(computeItemBonuses(items)).toEqual({ ...zero, def: 3, dm: 1 });
  });
  it('ignore les objets non équipés', () => {
    const items = [
      { name: 'Anneau rangé', target: 'init' as const, value: 5, equipped: false },
      { name: 'Bottes', target: 'init' as const, value: 1, equipped: true },
    ];
    expect(computeItemBonuses(items)).toEqual({ ...zero, init: 1 });
  });
});
```

- [ ] **Step 3 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (`computeItemBonuses is not a function`).

- [ ] **Step 4 : Implémenter**

Dans `app/src/utils/cofRules.ts`, ajouter en tête l'import du type (à côté de l'import existant `CharacterVoieRef`/`VoieSource` depuis `../types/character`) : ajouter `MagicItem, ItemBonusTarget`. Puis ajouter la fonction (près des autres helpers dérivés) :

```ts
// Somme les bonus des objets magiques ÉQUIPÉS par cible (piloté joueur, jamais persisté).
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

- [ ] **Step 5 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS. Puis `docker compose exec -T frontend npx tsc -b` → 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add app/src/types/character.ts app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): computeItemBonuses + types MagicItem (objets à bonus)"
```

---

### Task 2 : Composition hook + `MagicItemsPanel` + affichage

**Files:**
- Modify: `app/src/hooks/useCharacterSheet.ts`, `app/src/components/character/MainStatsPanel.tsx`, `app/src/pages/CharacterSheet.tsx`
- Create: `app/src/components/character/MagicItemsPanel.tsx`

**Interfaces:**
- Consumes: `computeItemBonuses`, `MagicItem`/`ItemBonusTarget` (Task 1).
- Produces: le hook expose `itemBonuses: Record<ItemBonusTarget, number>` et compose `maxHp`/`combatStats`/`damageReduction`.

- [ ] **Step 1 : Composer les bonus dans le hook**

Dans `useCharacterSheet.ts`, ajouter `computeItemBonuses` à l'import depuis `../utils/cofRules`. Juste avant le `return {` final, ajouter :

```ts
    // Objets magiques équipés : bonus composés (ajoutés aux dérivés ; cofRules inchangé).
    const itemBonuses = useMemo(() => computeItemBonuses(playState.magicItems), [playState.magicItems]);
```

Dans l'objet retourné, remplacer les trois valeurs par leur version composée et ajouter `itemBonuses` :

- remplacer `combatStats,` par
  `combatStats: { init: combatStats.init + itemBonuses.init, def: combatStats.def + itemBonuses.def },`
- dans la ligne `maxHp, mainFamily, damageReduction, languageSlots,`, remplacer `maxHp,` par `maxHp: maxHp + itemBonuses.pv,` et `damageReduction,` par `damageReduction: damageReduction + itemBonuses.rd,`
- ajouter `itemBonuses,` à l'objet retourné.

(Les memos internes `maxHp`/`combatStats`/`damageReduction` restent la base ; l'effet de création qui initialise `hp.current` continue d'utiliser la base — les objets ne bumpent pas rétroactivement les PV courants.)

- [ ] **Step 2 : `MainStatsPanel` — attaque + note DM**

Ajouter deux props à l'interface `Props` de `MainStatsPanel.tsx` :

```ts
    /** Bonus d'attaque plat des objets équipés (ajouté aux attaques affichées). */
    attackBonus: number;
    /** Bonus de DM des objets équipés (note globale). */
    dmBonus: number;
```

Les déstructurer dans le composant (`… damageReduction, attackBonus, dmBonus }`). Ajouter `+ attackBonus` aux deux valeurs d'attaque :

- `{attackValue(mods.FOR, character.level || 1) + attackBonus}` (Atk CàC)
- `{attackValue(mods.AGI, character.level || 1) + attackBonus}` (Atk Tir)

Et, dans le bloc « Attacks » (le `<div className="glass-panel p-3 rounded-xl col-span-2 …">`), après la grille des deux attaques, ajouter une note conditionnelle :

```tsx
                {dmBonus > 0 && (
                    <div className="text-[9px] text-amber-500/70 font-bold uppercase text-center mt-1">+{dmBonus} DM (objets)</div>
                )}
```

- [ ] **Step 3 : Créer `MagicItemsPanel.tsx`**

Créer `app/src/components/character/MagicItemsPanel.tsx` :

```tsx
import React from 'react';
import type { Character, MagicItem, ItemBonusTarget } from '../../types/character';

const TARGET_LABELS: Record<ItemBonusTarget, string> = {
    def: 'DEF', init: 'Init', pv: 'PV', rd: 'RD', attaque: 'Attaque', dm: 'DM',
};
const TARGETS: ItemBonusTarget[] = ['def', 'init', 'pv', 'rd', 'attaque', 'dm'];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Objets magiques / ad hoc porteurs d'un bonus mécanique. Les objets « équipés »
 * alimentent la dérivation (DEF/Init/PV/RD/attaque, DM en note). Piloté joueur.
 */
export const MagicItemsPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const items = character.playState?.magicItems ?? [];

    const write = (next: MagicItem[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, magicItems: next } }));
    const update = (idx: number, patch: Partial<MagicItem>) =>
        write(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    const add = () => write([...items, { name: '', target: 'def', value: 1, equipped: true }]);
    const remove = (idx: number) => write(items.filter((_, i) => i !== idx));

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Objets magiques</h3>
                <button onClick={add} className="text-stone-500 hover:text-primary-400 text-sm" title="Ajouter un objet">+</button>
            </div>
            {items.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucun objet à bonus.</p>}
            {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-xs">
                    <input
                        type="checkbox"
                        checked={it.equipped}
                        onChange={e => update(idx, { equipped: e.target.checked })}
                        title="Équipé"
                        className="accent-primary-500"
                    />
                    <input
                        type="text"
                        className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 outline-none focus:border-primary-500/40"
                        placeholder="Nom de l'objet"
                        value={it.name}
                        onChange={e => update(idx, { name: e.target.value })}
                    />
                    <select
                        className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-stone-200 outline-none"
                        value={it.target}
                        onChange={e => update(idx, { target: e.target.value as ItemBonusTarget })}
                    >
                        {TARGETS.map(t => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
                    </select>
                    <input
                        type="number"
                        className="w-12 bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-center text-stone-200 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        value={it.value}
                        onChange={e => update(idx, { value: parseInt(e.target.value) || 0 })}
                    />
                    <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                </div>
            ))}
        </div>
    );
};
```

- [ ] **Step 4 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { MagicItemsPanel } from '../components/character/MagicItemsPanel';`

Récupérer `itemBonuses` dans la déstructuration du hook (à côté de `maxHp` etc.).

Passer les bonus à `MainStatsPanel` (ajouter aux props existantes) :

```tsx
                        attackBonus={itemBonuses.attaque}
                        dmBonus={itemBonuses.dm}
```

Rendre `<MagicItemsPanel character={character} setCharacter={setCharacter} />` après `<WeaponsSection … />` (colonne équipement).

- [ ] **Step 5 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 6 : Commit**

```bash
git add app/src/hooks/useCharacterSheet.ts app/src/components/character/MagicItemsPanel.tsx app/src/components/character/MainStatsPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): objets magiques à bonus équipés (composition DEF/Init/PV/RD/attaque/DM)"
```

---

### Task 3 : Gate d'intégration

**Files:** aucun (vérification).

- [ ] **Step 1 : Type-check + tests unitaires**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.

- [ ] **Step 2 : Lint**

Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3`
Expected: ≤ baseline (~133), 0 nouvelle.

- [ ] **Step 3 : E2E de non-régression fiche**

Run: `bash scripts/e2e.sh e2e/character-sheet.spec.ts` puis `bash scripts/e2e.sh e2e/character-voies.spec.ts`
Expected: PASS (le panneau objets magiques n'introduit pas de régression). Réessayer une fois en cas de flake réseau.

## Definition of Done

- `computeItemBonuses` testé (équipés sommés par cible, non équipés ignorés, liste absente → 0).
- `PlayState.magicItems` + `MagicItem`/`ItemBonusTarget` ; le hook compose `maxHp`/`combatStats`/`damageReduction` et expose `itemBonuses`.
- UI : ajout/édition d'objets (nom, cible, valeur, équipé) ; DEF/Init/PV/RD/attaque se mettent à jour, note DM affichée ; décocher retire le bonus.
- Aucune valeur dérivée persistée ; fonctions pures `cofRules` inchangées.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

Autres mécaniques Phase 5 (sous-projets dédiés) : usages limités (#4), compagnons (#1), états activables (#3), substitution de carac (#5), capacités à choix (#6).
