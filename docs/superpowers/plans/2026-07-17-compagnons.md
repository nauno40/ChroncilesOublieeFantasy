# Compagnons / invocations — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un roster de compagnons/invocations/montures sur la fiche (aide de table), piloté par le joueur, avec pré-remplissage depuis le bestiaire et suivi des PV.

**Architecture :** Frontend seul (`playState` = JSON opaque, aucune migration). Liste `playState.companions` (état de jeu, aucun effet sur la fiche du perso) ; helper pur `companionFromCreature` ; composant `CompanionsPanel` qui lit le bestiaire via `DataService.getCreatures()`. Aucune valeur dérivée persistée.

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-17-compagnons-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration backend ; réutilise la lecture bestiaire existante.
- **Roster séparé** : les compagnons n'influencent AUCUNE valeur dérivée de la fiche du personnage.
- Compteur PV `current` borné `0..max`.
- **Aucune valeur dérivée persistée** (le roster est de l'état de jeu).
- **Baseline lint** ~133 ; gate = **0 nouvelle**, aucun nouveau `any`.

## File Structure

- **`app/src/types/character.ts`** — type `Companion` + champ `companions?` (Task 1).
- **`app/src/utils/cofRules.ts`** + **`.test.ts`** — `companionFromCreature` (Task 1).
- **`app/src/components/character/CompanionsPanel.tsx`** — nouveau (Task 2).
- **`app/src/pages/CharacterSheet.tsx`** — intègre le panneau (Task 2).

---

### Task 1 : Type + `companionFromCreature` (TDD)

**Files:**
- Modify: `app/src/types/character.ts`, `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `Companion` (type) ; `companionFromCreature(c: { id?: number; name?: string; hp?: number; def?: number; init?: number }): Companion`.

- [ ] **Step 1 : Type dans `character.ts`**

Dans `app/src/types/character.ts`, ajouter (avant `interface PlayState`) :

```ts
export interface Companion {
    name: string;
    ref?: string;                          // IRI créature bestiaire (si issu du compendium)
    hp: { current: number; max: number };
    def: number;
    init: number;
    notes?: string;
}
```

et dans `interface PlayState`, après `usages?: Usage[];` :

```ts
    companions?: Companion[];              // roster de compagnons / invocations / montures
```

- [ ] **Step 2 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `companionFromCreature` depuis `./cofRules`) :

```ts
describe('companionFromCreature (pré-remplissage bestiaire)', () => {
  it('mappe nom / PV (current=max) / DEF / Init et construit l\'IRI', () => {
    expect(companionFromCreature({ id: 12, name: 'Loup', hp: 18, def: 13, init: 12 })).toEqual({
      name: 'Loup', ref: '/api/creatures/12', hp: { current: 18, max: 18 }, def: 13, init: 12,
    });
  });
  it('valeurs par défaut si champs absents ; pas d\'IRI sans id', () => {
    expect(companionFromCreature({})).toEqual({
      name: '', ref: undefined, hp: { current: 0, max: 0 }, def: 0, init: 0,
    });
  });
});
```

- [ ] **Step 3 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (`companionFromCreature is not a function`).

- [ ] **Step 4 : Implémenter**

Dans `app/src/utils/cofRules.ts`, étendre l'import existant depuis `../types/character` (qui importe déjà `CharacterVoieRef, VoieSource, MagicItem, ItemBonusTarget, Usage, UsagePeriod`) pour ajouter `Companion`. Puis ajouter la fonction (près de `resetUsages`) :

```ts
// Pré-remplit un compagnon depuis une créature du bestiaire (nom, PV, DEF, Init, IRI).
export const companionFromCreature = (
  c: { id?: number; name?: string; hp?: number; def?: number; init?: number },
): Companion => ({
  name: c.name ?? '',
  ref: c.id != null ? `/api/creatures/${c.id}` : undefined,
  hp: { current: c.hp ?? 0, max: c.hp ?? 0 },
  def: c.def ?? 0,
  init: c.init ?? 0,
});
```

- [ ] **Step 5 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS. Puis `docker compose exec -T frontend npx tsc -b` → 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add app/src/types/character.ts app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): companionFromCreature + type Companion (roster)"
```

---

### Task 2 : `CompanionsPanel` + intégration

**Files:**
- Create: `app/src/components/character/CompanionsPanel.tsx`
- Modify: `app/src/pages/CharacterSheet.tsx`

**Interfaces:**
- Consumes: `companionFromCreature`, `Companion` (Task 1) ; `DataService.getCreatures` (existant) ; `Creature` (existant).

- [ ] **Step 1 : Créer `CompanionsPanel.tsx`**

Créer `app/src/components/character/CompanionsPanel.tsx` :

```tsx
import React, { useState, useEffect } from 'react';
import type { Character, Companion } from '../../types/character';
import type { Creature } from '../../types/normalized';
import { DataService } from '../../services/dataService';
import { companionFromCreature } from '../../utils/cofRules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Roster de compagnons / invocations / montures (COF2 §7 #1) — aide de table.
 * Piloté joueur ; pré-remplissage depuis le bestiaire. Aucun effet sur la fiche du perso.
 */
export const CompanionsPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const [creatures, setCreatures] = useState<Creature[]>([]);
    useEffect(() => {
        DataService.getCreatures().then(setCreatures).catch(() => setCreatures([]));
    }, []);

    const companions = character.playState?.companions ?? [];

    const write = (next: Companion[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, companions: next } }));
    const update = (idx: number, patch: Partial<Companion>) =>
        write(companions.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
    const remove = (idx: number) => write(companions.filter((_, i) => i !== idx));
    const addCustom = () => write([...companions, { name: '', hp: { current: 0, max: 0 }, def: 0, init: 0 }]);
    const addFromCreature = (id: string) => {
        const cr = creatures.find(c => String(c.id) === id);
        if (cr) write([...companions, companionFromCreature(cr)]);
    };
    const setHp = (idx: number, c: Companion, delta: number) =>
        update(idx, { hp: { ...c.hp, current: Math.max(0, Math.min(c.hp.max, c.hp.current + delta)) } });
    const setMaxHp = (idx: number, c: Companion, max: number) =>
        update(idx, { hp: { max, current: Math.min(c.hp.current, max) } });

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Compagnons & Invocations</h3>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-[11px] text-stone-300 outline-none"
                        value=""
                        onChange={e => { if (e.target.value) addFromCreature(e.target.value); e.target.value = ''; }}
                    >
                        <option value="">+ Bestiaire…</option>
                        {creatures.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <button onClick={addCustom} className="text-stone-500 hover:text-primary-400 text-sm" title="Compagnon personnalisé">+ Custom</button>
                </div>
            </div>
            {companions.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucun compagnon.</p>}
            {companions.map((c, idx) => {
                const down = c.hp.current <= 0;
                return (
                    <div key={idx} className={`rounded-lg border p-2 space-y-1.5 ${down ? 'border-red-900/40 bg-red-950/10' : 'border-white/5 bg-stone-950/20'}`}>
                        <div className="flex items-center gap-1.5 text-xs">
                            <input
                                type="text"
                                className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 font-bold outline-none focus:border-primary-500/40"
                                placeholder="Nom du compagnon"
                                value={c.name}
                                onChange={e => update(idx, { name: e.target.value })}
                            />
                            <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1">
                                <span className="text-stone-500 uppercase font-bold">PV</span>
                                <button onClick={() => setHp(idx, c, -1)} className="text-stone-500 hover:text-red-400 w-4 text-center">−</button>
                                <span className={`font-mono font-bold ${down ? 'text-red-400' : 'text-green-400'}`}>{c.hp.current}/</span>
                                <input type="number" className="w-9 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    value={c.hp.max} onChange={e => setMaxHp(idx, c, Math.max(0, parseInt(e.target.value) || 0))} />
                                <button onClick={() => setHp(idx, c, 1)} className="text-stone-500 hover:text-green-400 w-4 text-center">+</button>
                            </span>
                            <label className="flex items-center gap-1"><span className="text-stone-500 uppercase font-bold">DEF</span>
                                <input type="number" className="w-10 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    value={c.def} onChange={e => update(idx, { def: parseInt(e.target.value) || 0 })} /></label>
                            <label className="flex items-center gap-1"><span className="text-stone-500 uppercase font-bold">Init</span>
                                <input type="number" className="w-10 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    value={c.init} onChange={e => update(idx, { init: parseInt(e.target.value) || 0 })} /></label>
                        </div>
                        <input
                            type="text"
                            className="w-full bg-transparent border-none outline-none text-[11px] text-stone-500 italic placeholder:text-stone-800"
                            placeholder="Notes (attaques, capacités…)"
                            value={c.notes || ''}
                            onChange={e => update(idx, { notes: e.target.value })}
                        />
                    </div>
                );
            })}
        </div>
    );
};
```

- [ ] **Step 2 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { CompanionsPanel } from '../components/character/CompanionsPanel';`

Rendre `<CompanionsPanel character={character} setCharacter={setCharacter} />` après `<UsagesPanel … />` (colonne équipement).

- [ ] **Step 3 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 4 : Commit**

```bash
git add app/src/components/character/CompanionsPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): roster de compagnons/invocations (bestiaire + suivi PV)"
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

- `companionFromCreature` testé (mapping bestiaire, IRI depuis id, défauts).
- `PlayState.companions` + `Companion` ; `CompanionsPanel` : ajout depuis bestiaire ou custom, suivi PV borné −/+, DEF/Init/notes éditables, suppression.
- Aucun effet sur les valeurs dérivées de la fiche ; aucune valeur dérivée persistée.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

Autres mécaniques Phase 5 : états activables (#3), substitution de carac (#5), capacités à choix (#6), transformations (#2). Incrémental : gabarit dérivé des compagnons (`effect.summon`), système de repos complet.
