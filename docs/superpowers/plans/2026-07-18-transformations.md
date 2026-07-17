# Transformations — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au joueur de déclarer des formes de transformation (pré-remplies depuis le bestiaire) et, tant qu'une forme est active, de remplacer les stats de combat affichées (DEF/Init/PV max) par celles de la forme.

**Architecture :** Frontend seul (`playState` = JSON opaque, aucune migration). `playState.forms` ; helpers purs `formFromCreature` (réutilise `companionFromCreature`) et `activateForm` (toggle exclusif) ; override de `combatStats`/`maxHp` dans le hook quand une forme est active (fonctions pures inchangées) ; UI `TransformationPanel` + bandeau « Transformé ». Aucune valeur dérivée persistée.

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-18-transformations-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration backend ; réutilise la lecture bestiaire.
- **Sans forme active** : DEF/Init/PV max identiques à aujourd'hui (objets + états composés) — pas de régression.
- **Une seule forme active** (exclusivité globale). Compteur PV `current` borné `0..max`.
- **Fonctions pures `cofRules` inchangées** ; override dans le hook.
- **Aucune valeur dérivée persistée**. **Baseline lint** ~133 ; gate = **0 nouvelle**, aucun nouveau `any`.

## File Structure

- **`app/src/types/character.ts`** — `Form` + champ `forms?` (Task 1).
- **`app/src/utils/cofRules.ts`** + **`.test.ts`** — `formFromCreature`, `activateForm` (Task 1).
- **`app/src/hooks/useCharacterSheet.ts`** — override combatStats/maxHp + expose `activeForm` (Task 2).
- **`app/src/components/character/TransformationPanel.tsx`** — nouveau (Task 2).
- **`app/src/pages/CharacterSheet.tsx`** — intègre le panneau (Task 2).

---

### Task 1 : Types + `formFromCreature` + `activateForm` (TDD)

**Files:**
- Modify: `app/src/types/character.ts`, `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `Form` ; `formFromCreature(c): Form` ; `activateForm(forms, idx, active): Form[]`.

- [ ] **Step 1 : Types dans `character.ts`**

Ajouter (avant `interface PlayState`) :

```ts
export interface Form {
    name: string;
    ref?: string;                          // IRI créature bestiaire (si issu du compendium)
    hp: { current: number; max: number };
    def: number;
    init: number;
    active: boolean;
}
```

et dans `interface PlayState`, après `activeStates?: ActiveState[];` :

```ts
    forms?: Form[];                        // formes de transformation (une seule active)
```

- [ ] **Step 2 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `formFromCreature, activateForm` depuis `./cofRules`) :

```ts
describe('formFromCreature', () => {
  it('mappe la créature en forme inactive (nom/PV/DEF/Init/IRI)', () => {
    expect(formFromCreature({ id: 7, name: 'Ours', hp: 30, def: 14, init: 11 })).toEqual({
      name: 'Ours', ref: '/api/creatures/7', hp: { current: 30, max: 30 }, def: 14, init: 11, active: false,
    });
  });
});

describe('activateForm (exclusivité globale)', () => {
  const base = [
    { name: 'Ours', hp: { current: 30, max: 30 }, def: 14, init: 11, active: false },
    { name: 'Loup', hp: { current: 18, max: 18 }, def: 13, init: 12, active: true },
  ];
  it('activer une forme désactive toutes les autres', () => {
    const r = activateForm(base, 0, true);
    expect(r[0].active).toBe(true);
    expect(r[1].active).toBe(false);
  });
  it('désactiver n\'affecte que la forme ciblée', () => {
    const r = activateForm(base, 1, false);
    expect(r[1].active).toBe(false);
    expect(r[0].active).toBe(false);
  });
  it('liste absente ⇒ []', () => {
    expect(activateForm(undefined, 0, true)).toEqual([]);
  });
});
```

- [ ] **Step 3 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (fonctions absentes).

- [ ] **Step 4 : Implémenter**

Dans `app/src/utils/cofRules.ts`, étendre l'import existant depuis `../types/character` pour ajouter `Form`. Puis ajouter (près de `companionFromCreature`) :

```ts
// Pré-remplit une forme depuis une créature du bestiaire (réutilise companionFromCreature).
export const formFromCreature = (
  c: { id?: number; name?: string; hp?: number; def?: number; init?: number },
): Form => ({ ...companionFromCreature(c), active: false });

// (Dés)active une forme ; en activer une désactive toutes les autres (exclusivité globale).
export const activateForm = (
  forms: Form[] | undefined,
  idx: number,
  active: boolean,
): Form[] =>
  (forms ?? []).map((f, i) => (i === idx ? { ...f, active } : active ? { ...f, active: false } : f));
```

- [ ] **Step 5 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS. Puis `docker compose exec -T frontend npx tsc -b` → 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add app/src/types/character.ts app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): formFromCreature + activateForm (transformations)"
```

---

### Task 2 : Override hook + `TransformationPanel`

**Files:**
- Modify: `app/src/hooks/useCharacterSheet.ts`, `app/src/pages/CharacterSheet.tsx`
- Create: `app/src/components/character/TransformationPanel.tsx`

**Interfaces:**
- Consumes: `formFromCreature`, `activateForm`, `Form` (Task 1) ; `DataService.getCreatures`, `Creature` (existant).
- Produces: le hook expose `activeForm` et override `combatStats`/`maxHp` quand une forme est active.

- [ ] **Step 1 : Override dans le hook**

Dans `useCharacterSheet.ts`, juste avant le `return {`, après le bloc `bonuses`, ajouter :

```ts
    // Transformation : une forme active remplace les stats de combat affichées.
    const activeForm = (playState.forms ?? []).find(f => f.active);
```

Dans l'objet retourné, remplacer les deux lignes :
- `combatStats: { init: combatStats.init + bonuses.init, def: combatStats.def + bonuses.def },`
  → `combatStats: activeForm ? { init: activeForm.init, def: activeForm.def } : { init: combatStats.init + bonuses.init, def: combatStats.def + bonuses.def },`
- `maxHp: maxHp + bonuses.pv, mainFamily, damageReduction: damageReduction + bonuses.rd, languageSlots,`
  → `maxHp: activeForm ? activeForm.hp.max : maxHp + bonuses.pv, mainFamily, damageReduction: damageReduction + bonuses.rd, languageSlots,`

Et ajouter `activeForm,` à l'objet retourné.

- [ ] **Step 2 : Créer `TransformationPanel.tsx`**

Créer `app/src/components/character/TransformationPanel.tsx` :

```tsx
import React, { useState, useEffect } from 'react';
import type { Character, Form } from '../../types/character';
import type { Creature } from '../../types/normalized';
import { DataService } from '../../services/dataService';
import { formFromCreature, activateForm } from '../../utils/cofRules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Transformations (COF2 §7 #2, ex. forme animale du druide). Une forme active remplace les
 * stats de combat affichées (DEF/Init/PV) — override géré par le hook. Piloté joueur ;
 * une seule forme active. Aucun effet sans forme active.
 */
export const TransformationPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const [creatures, setCreatures] = useState<Creature[]>([]);
    useEffect(() => {
        DataService.getCreatures().then(setCreatures).catch(() => setCreatures([]));
    }, []);

    const forms = character.playState?.forms ?? [];
    const active = forms.find(f => f.active);

    const write = (next: Form[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, forms: next } }));
    const update = (idx: number, patch: Partial<Form>) =>
        write(forms.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
    const toggle = (idx: number, f: Form) => write(activateForm(forms, idx, !f.active));
    const remove = (idx: number) => write(forms.filter((_, i) => i !== idx));
    const addCustom = () => write([...forms, { name: '', hp: { current: 0, max: 0 }, def: 0, init: 0, active: false }]);
    const addFromCreature = (id: string) => {
        const cr = creatures.find(c => String(c.id) === id);
        if (cr) write([...forms, formFromCreature(cr)]);
    };
    const setHp = (idx: number, f: Form, delta: number) =>
        update(idx, { hp: { ...f.hp, current: Math.max(0, Math.min(f.hp.max, f.hp.current + delta)) } });
    const setMaxHp = (idx: number, f: Form, max: number) =>
        update(idx, { hp: { max, current: Math.min(f.hp.current, max) } });

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Transformations</h3>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-[11px] text-stone-300 outline-none"
                        value=""
                        onChange={e => { if (e.target.value) addFromCreature(e.target.value); e.target.value = ''; }}
                    >
                        <option value="">+ Bestiaire…</option>
                        {creatures.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <button onClick={addCustom} className="text-stone-500 hover:text-primary-400 text-sm" title="Forme personnalisée">+ Custom</button>
                </div>
            </div>
            {active && (
                <div className="text-[10px] uppercase font-black tracking-[0.2em] text-purple-300 bg-purple-900/20 border border-purple-500/40 rounded-lg px-3 py-1.5">
                    Transformé : {active.name || '(forme)'}
                </div>
            )}
            {forms.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucune forme.</p>}
            {forms.map((f, idx) => (
                <div key={idx} className={`rounded-lg border p-2 space-y-1.5 ${f.active ? 'border-purple-500/40 bg-purple-900/10' : 'border-white/5 bg-stone-950/20'}`}>
                    <div className="flex items-center gap-1.5 text-xs">
                        <button
                            onClick={() => toggle(idx, f)}
                            title={f.active ? 'Active' : 'Inactive'}
                            className={`text-[9px] uppercase font-black px-2 py-1 rounded border transition-all ${f.active ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-stone-950 border-stone-700 text-stone-500 hover:text-white'}`}
                        >{f.active ? 'Active' : 'Off'}</button>
                        <input type="text" className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 font-bold outline-none focus:border-primary-500/40"
                            placeholder="Nom de la forme" value={f.name} onChange={e => update(idx, { name: e.target.value })} />
                        <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="flex items-center gap-1">
                            <span className="text-stone-500 uppercase font-bold">PV</span>
                            <button onClick={() => setHp(idx, f, -1)} className="text-stone-500 hover:text-red-400 w-4 text-center">−</button>
                            <span className="font-mono font-bold text-green-400">{f.hp.current}/</span>
                            <input type="number" className="w-9 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                value={f.hp.max} onChange={e => setMaxHp(idx, f, Math.max(0, parseInt(e.target.value) || 0))} />
                            <button onClick={() => setHp(idx, f, 1)} className="text-stone-500 hover:text-green-400 w-4 text-center">+</button>
                        </span>
                        <label className="flex items-center gap-1"><span className="text-stone-500 uppercase font-bold">DEF</span>
                            <input type="number" className="w-10 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                value={f.def} onChange={e => update(idx, { def: parseInt(e.target.value) || 0 })} /></label>
                        <label className="flex items-center gap-1"><span className="text-stone-500 uppercase font-bold">Init</span>
                            <input type="number" className="w-10 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                value={f.init} onChange={e => update(idx, { init: parseInt(e.target.value) || 0 })} /></label>
                    </div>
                </div>
            ))}
        </div>
    );
};
```

- [ ] **Step 3 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { TransformationPanel } from '../components/character/TransformationPanel';`

Rendre `<TransformationPanel character={character} setCharacter={setCharacter} />` après `<ActiveStatesPanel … />` (colonne équipement).

- [ ] **Step 4 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 5 : Commit**

```bash
git add app/src/hooks/useCharacterSheet.ts app/src/components/character/TransformationPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): transformations — override des stats de combat (forme active)"
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

- `formFromCreature` (bestiaire + `active:false`) et `activateForm` (exclusivité globale) testés.
- `PlayState.forms` + `Form` ; le hook override `combatStats`/`maxHp` quand une forme est active et expose `activeForm` ; `TransformationPanel` (ajout bestiaire/custom, toggle exclusif, bandeau, suivi PV).
- Sans forme active : DEF/Init/PV identiques. Aucune valeur dérivée persistée ; fonctions pures inchangées.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

Dernière mécanique Phase 5 : capacités à choix (#6). Incrémental : override des attaques/RD sous forme, système de repos COF2 complet.
