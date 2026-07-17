# États activables — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au joueur de déclarer des états activables (buffs/postures) qui, actifs, composent leurs bonus dans la dérivation — avec exclusion mutuelle par groupe.

**Architecture :** Frontend seul (`playState` = JSON opaque, aucune migration). `playState.activeStates` ; helpers purs `computeActiveStateBonuses` (somme des actifs) et `activateState` (toggle + exclusion de groupe) ; le hook **combine** objets magiques + états actifs et compose le total dans les dérivés (fonctions pures inchangées) ; UI `ActiveStatesPanel`. Aucune valeur dérivée persistée.

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-17-etats-activables-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration backend.
- **Sans état actif** : dérivés identiques (bonus 0) — pas de régression vs objets magiques seuls.
- **Fonctions pures `cofRules` inchangées** ; composition (objets + états) dans le hook.
- Exclusion : **une seule active par `group`** ; états sans groupe indépendants.
- **Aucune valeur dérivée persistée**. **Baseline lint** ~133 ; gate = **0 nouvelle**, aucun nouveau `any`.

## File Structure

- **`app/src/types/character.ts`** — `ActiveState` + champ `activeStates?` (Task 1).
- **`app/src/utils/cofRules.ts`** + **`.test.ts`** — `computeActiveStateBonuses`, `activateState` (Task 1).
- **`app/src/hooks/useCharacterSheet.ts`** — combine objets + états (Task 2).
- **`app/src/components/character/ActiveStatesPanel.tsx`** — nouveau (Task 2).
- **`app/src/pages/CharacterSheet.tsx`** — intègre le panneau + renomme `itemBonuses`→`bonuses` (Task 2).

---

### Task 1 : Types + `computeActiveStateBonuses` + `activateState` (TDD)

**Files:**
- Modify: `app/src/types/character.ts`, `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `ActiveState` ; `computeActiveStateBonuses(states): Record<ItemBonusTarget, number>` ; `activateState(states, idx, active): ActiveState[]`.

- [ ] **Step 1 : Types dans `character.ts`**

Ajouter (avant `interface PlayState`) :

```ts
export interface ActiveState {
    name: string;
    group?: string;                        // groupe d'exclusion (une seule active par groupe)
    active: boolean;
    target: ItemBonusTarget;               // def | init | pv | rd | attaque | dm
    value: number;
}
```

et dans `interface PlayState`, après `caracSubstitutions?: { contact?: CaracKey; distance?: CaracKey };` :

```ts
    activeStates?: ActiveState[];          // buffs/postures activables (bonus quand actifs)
```

- [ ] **Step 2 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `computeActiveStateBonuses, activateState` depuis `./cofRules`) :

```ts
describe('computeActiveStateBonuses (états actifs)', () => {
  const zero = { def: 0, init: 0, pv: 0, rd: 0, attaque: 0, dm: 0 };
  it('liste absente ⇒ tout 0', () => {
    expect(computeActiveStateBonuses(undefined)).toEqual(zero);
  });
  it('somme les états ACTIFS par cible, ignore les inactifs', () => {
    const states = [
      { name: 'Rage', active: true, target: 'attaque' as const, value: 2 },
      { name: 'Posture def', active: true, target: 'def' as const, value: 1 },
      { name: 'Non actif', active: false, target: 'def' as const, value: 9 },
    ];
    expect(computeActiveStateBonuses(states)).toEqual({ ...zero, attaque: 2, def: 1 });
  });
});

describe('activateState (exclusion de groupe)', () => {
  const base = [
    { name: 'Posture A', group: 'posture', active: false, target: 'def' as const, value: 1 },
    { name: 'Posture B', group: 'posture', active: true, target: 'attaque' as const, value: 1 },
    { name: 'Rage', active: false, target: 'attaque' as const, value: 2 },
  ];
  it('activer un état d\'un groupe désactive les autres du même groupe', () => {
    const r = activateState(base, 0, true);
    expect(r[0].active).toBe(true);   // A activée
    expect(r[1].active).toBe(false);  // B (même groupe) désactivée
    expect(r[2].active).toBe(false);  // hors groupe, inchangée
  });
  it('désactiver n\'affecte que l\'état ciblé', () => {
    const r = activateState(base, 1, false);
    expect(r[1].active).toBe(false);
    expect(r[0].active).toBe(false);
  });
  it('état sans groupe n\'affecte que lui-même', () => {
    const r = activateState(base, 2, true);
    expect(r[2].active).toBe(true);
    expect(r[1].active).toBe(true);   // groupe posture inchangé
  });
});
```

- [ ] **Step 3 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (fonctions absentes).

- [ ] **Step 4 : Implémenter**

Dans `app/src/utils/cofRules.ts`, étendre l'import existant depuis `../types/character` pour ajouter `ActiveState`. Puis ajouter (près de `computeItemBonuses`) :

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

- [ ] **Step 5 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS. Puis `docker compose exec -T frontend npx tsc -b` → 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add app/src/types/character.ts app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): computeActiveStateBonuses + activateState (états activables)"
```

---

### Task 2 : Composition hook (objets + états) + `ActiveStatesPanel`

**Files:**
- Modify: `app/src/hooks/useCharacterSheet.ts`, `app/src/pages/CharacterSheet.tsx`
- Create: `app/src/components/character/ActiveStatesPanel.tsx`

**Interfaces:**
- Consumes: `computeActiveStateBonuses`, `activateState`, `ActiveState` (Task 1).
- Produces: le hook expose `bonuses` (objets + états combinés) au lieu de `itemBonuses`.

- [ ] **Step 1 : Combiner objets + états dans le hook**

Dans `useCharacterSheet.ts`, ajouter `computeActiveStateBonuses` à l'import depuis `../utils/cofRules`. Remplacer le bloc `itemBonuses` (actuellement) :

```ts
    // Objets magiques équipés : bonus composés (ajoutés aux dérivés ; cofRules inchangé).
    const itemBonuses = useMemo(() => computeItemBonuses(playState.magicItems), [playState.magicItems]);
```

par :

```ts
    // Bonus composés (objets magiques équipés + états actifs) — ajoutés aux dérivés ; cofRules inchangé.
    const itemBonuses = useMemo(() => computeItemBonuses(playState.magicItems), [playState.magicItems]);
    const stateBonuses = useMemo(() => computeActiveStateBonuses(playState.activeStates), [playState.activeStates]);
    const bonuses = {
        def: itemBonuses.def + stateBonuses.def, init: itemBonuses.init + stateBonuses.init,
        pv: itemBonuses.pv + stateBonuses.pv, rd: itemBonuses.rd + stateBonuses.rd,
        attaque: itemBonuses.attaque + stateBonuses.attaque, dm: itemBonuses.dm + stateBonuses.dm,
    };
```

Dans l'objet retourné, remplacer les usages de `itemBonuses` par `bonuses` :
- `combatStats: { init: combatStats.init + itemBonuses.init, def: combatStats.def + itemBonuses.def },` → `combatStats: { init: combatStats.init + bonuses.init, def: combatStats.def + bonuses.def },`
- `maxHp: maxHp + itemBonuses.pv, mainFamily, damageReduction: damageReduction + itemBonuses.rd, languageSlots,` → `maxHp: maxHp + bonuses.pv, mainFamily, damageReduction: damageReduction + bonuses.rd, languageSlots,`
- `itemBonuses,` → `bonuses,`

- [ ] **Step 2 : `CharacterSheet.tsx` — renommer `itemBonuses`→`bonuses`**

Dans la déstructuration du hook, remplacer `itemBonuses` par `bonuses`. Dans les props de `MainStatsPanel`, remplacer `attackBonus={itemBonuses.attaque}` par `attackBonus={bonuses.attaque}` et `dmBonus={itemBonuses.dm}` par `dmBonus={bonuses.dm}`.

- [ ] **Step 3 : Créer `ActiveStatesPanel.tsx`**

Créer `app/src/components/character/ActiveStatesPanel.tsx` :

```tsx
import React from 'react';
import type { Character, ActiveState, ItemBonusTarget } from '../../types/character';
import { activateState } from '../../utils/cofRules';

const TARGET_LABELS: Record<ItemBonusTarget, string> = {
    def: 'DEF', init: 'Init', pv: 'PV', rd: 'RD', attaque: 'Attaque', dm: 'DM',
};
const TARGETS: ItemBonusTarget[] = ['def', 'init', 'pv', 'rd', 'attaque', 'dm'];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * États activables (buffs/postures, COF2 §7 #3). Un état actif compose son bonus dans la
 * dérivation (comme un objet équipé). Exclusion : une seule active par `group`. Piloté joueur.
 */
export const ActiveStatesPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const states = character.playState?.activeStates ?? [];

    const write = (next: ActiveState[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, activeStates: next } }));
    const update = (idx: number, patch: Partial<ActiveState>) =>
        write(states.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
    const toggle = (idx: number, s: ActiveState) => write(activateState(states, idx, !s.active));
    const add = () => write([...states, { name: '', active: false, target: 'def', value: 1 }]);
    const remove = (idx: number) => write(states.filter((_, i) => i !== idx));

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">États activables</h3>
                <button onClick={add} className="text-stone-500 hover:text-primary-400 text-sm" title="Ajouter un état">+</button>
            </div>
            {states.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucun état.</p>}
            {states.map((s, idx) => (
                <div key={idx} className={`flex flex-wrap items-center gap-1.5 text-xs rounded-lg border p-1.5 ${s.active ? 'border-primary-500/40 bg-primary-900/10' : 'border-white/5'}`}>
                    <button
                        onClick={() => toggle(idx, s)}
                        title={s.active ? 'Actif' : 'Inactif'}
                        className={`text-[9px] uppercase font-black px-2 py-1 rounded border transition-all ${s.active ? 'bg-primary-500/20 border-primary-500 text-primary-200' : 'bg-stone-950 border-stone-700 text-stone-500 hover:text-white'}`}
                    >{s.active ? 'Actif' : 'Off'}</button>
                    <input type="text" className="flex-1 min-w-[80px] bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 outline-none focus:border-primary-500/40"
                        placeholder="Nom (ex. Rage)" value={s.name} onChange={e => update(idx, { name: e.target.value })} />
                    <input type="text" className="w-20 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-400 outline-none focus:border-primary-500/40"
                        placeholder="Groupe" value={s.group || ''} onChange={e => update(idx, { group: e.target.value || undefined })} />
                    <select className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-stone-200 outline-none"
                        value={s.target} onChange={e => update(idx, { target: e.target.value as ItemBonusTarget })}>
                        {TARGETS.map(t => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
                    </select>
                    <input type="number" className="w-12 bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-center text-stone-200 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        value={s.value} onChange={e => update(idx, { value: parseInt(e.target.value) || 0 })} />
                    <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                </div>
            ))}
        </div>
    );
};
```

- [ ] **Step 4 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { ActiveStatesPanel } from '../components/character/ActiveStatesPanel';`

Rendre `<ActiveStatesPanel character={character} setCharacter={setCharacter} />` après `<CaracSubstitutionsPanel … />` (colonne équipement).

- [ ] **Step 5 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 6 : Commit**

```bash
git add app/src/hooks/useCharacterSheet.ts app/src/components/character/ActiveStatesPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): états activables avec exclusion de groupe (bonus composés)"
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
Expected: PASS. Réessayer une fois en cas de flake réseau.

## Definition of Done

- `computeActiveStateBonuses` (actifs sommés) et `activateState` (exclusion de groupe) testés.
- `PlayState.activeStates` + `ActiveState` ; le hook combine objets + états et compose le total ; `ActiveStatesPanel` (toggle avec exclusion, nom/groupe/cible/valeur).
- Sans état actif : dérivés identiques. Aucune valeur dérivée persistée ; fonctions pures inchangées.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

Autres mécaniques Phase 5 : capacités à choix (#6), transformations (#2). Incrémental : auto-dérivation depuis `effect.activation`, système de repos.
