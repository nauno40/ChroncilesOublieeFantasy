# Usages limités — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fournir un tracker d'aide de table pour les capacités à usage limité (X/jour, /combat, /round), piloté par le joueur, avec remise à zéro par période.

**Architecture :** Frontend seul (`playState` = JSON opaque, aucune migration). Liste `playState.usages` (état de jeu pur, aucun effet sur les valeurs dérivées) ; un helper pur testable `resetUsages` ; un composant `UsagesPanel`. Aucune valeur dérivée persistée (les usages SONT de l'état de jeu, pas un calcul).

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-17-usages-limites-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration backend.
- **Tracker pur** : les usages n'influencent AUCUNE valeur dérivée (DEF/PV/attaques inchangés).
- Les boutons de reset agissent **uniquement** sur `playState.usages` (jamais PV/PM/DR).
- Compteur `used` borné `0..max`.
- **Baseline lint** ~133 ; gate = **0 nouvelle**, aucun nouveau `any`.

## File Structure

- **`app/src/types/character.ts`** — types `UsagePeriod`, `Usage` + champ `usages?` (Task 1).
- **`app/src/utils/cofRules.ts`** + **`.test.ts`** — `resetUsages` (Task 1).
- **`app/src/components/character/UsagesPanel.tsx`** — nouveau (Task 2).
- **`app/src/pages/CharacterSheet.tsx`** — intègre le panneau (Task 2).

---

### Task 1 : Types + `resetUsages` (TDD)

**Files:**
- Modify: `app/src/types/character.ts`, `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `UsagePeriod`, `Usage` (types) ; `resetUsages(usages: Usage[] | undefined, periods: UsagePeriod[]): Usage[]`.

- [ ] **Step 1 : Types dans `character.ts`**

Dans `app/src/types/character.ts`, ajouter (avant `interface PlayState`) :

```ts
export type UsagePeriod = 'jour' | 'combat' | 'round' | 'autre';
export interface Usage {
    name: string;
    max: number;
    used: number;
    per: UsagePeriod;
}
```

et dans `interface PlayState`, après `magicItems?: MagicItem[];` :

```ts
    usages?: Usage[];                      // suivi des capacités à usage limité (aide de table)
```

- [ ] **Step 2 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `resetUsages` depuis `./cofRules`) :

```ts
describe('resetUsages (remise à zéro par période)', () => {
  const base = [
    { name: 'Phénix', max: 1, used: 1, per: 'jour' as const },
    { name: 'Frappe', max: 3, used: 2, per: 'combat' as const },
    { name: 'Esquive', max: 1, used: 1, per: 'round' as const },
  ];
  it('remet à zéro uniquement les périodes visées', () => {
    expect(resetUsages(base, ['combat', 'round'])).toEqual([
      { name: 'Phénix', max: 1, used: 1, per: 'jour' },
      { name: 'Frappe', max: 3, used: 0, per: 'combat' },
      { name: 'Esquive', max: 1, used: 0, per: 'round' },
    ]);
  });
  it('repos long : jour + combat + round', () => {
    expect(resetUsages(base, ['jour', 'combat', 'round']).every(u => u.used === 0)).toBe(true);
  });
  it('liste absente ⇒ []', () => {
    expect(resetUsages(undefined, ['jour'])).toEqual([]);
  });
  it('ne mute pas la liste d\'origine', () => {
    const copy = JSON.parse(JSON.stringify(base));
    resetUsages(base, ['jour']);
    expect(base).toEqual(copy);
  });
});
```

- [ ] **Step 3 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (`resetUsages is not a function`).

- [ ] **Step 4 : Implémenter**

Dans `app/src/utils/cofRules.ts`, étendre l'import existant depuis `../types/character` (qui importe déjà `CharacterVoieRef, VoieSource, MagicItem, ItemBonusTarget`) pour ajouter `Usage, UsagePeriod`. Puis ajouter la fonction (près de `computeItemBonuses`) :

```ts
// Remet `used` à 0 pour les usages dont la période figure dans `periods` (repos/reset).
// Pur : renvoie une nouvelle liste, ne mute pas l'entrée d'origine.
export const resetUsages = (
  usages: Usage[] | undefined,
  periods: UsagePeriod[],
): Usage[] => (usages ?? []).map(u => (periods.includes(u.per) ? { ...u, used: 0 } : u));
```

- [ ] **Step 5 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS. Puis `docker compose exec -T frontend npx tsc -b` → 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add app/src/types/character.ts app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): resetUsages + types Usage (suivi usages limités)"
```

---

### Task 2 : `UsagesPanel` + intégration

**Files:**
- Create: `app/src/components/character/UsagesPanel.tsx`
- Modify: `app/src/pages/CharacterSheet.tsx`

**Interfaces:**
- Consumes: `resetUsages`, `Usage`/`UsagePeriod` (Task 1).

- [ ] **Step 1 : Créer `UsagesPanel.tsx`**

Créer `app/src/components/character/UsagesPanel.tsx` :

```tsx
import React from 'react';
import type { Character, Usage, UsagePeriod } from '../../types/character';
import { resetUsages } from '../../utils/cofRules';

const PERIOD_LABELS: Record<UsagePeriod, string> = {
    jour: 'Jour', combat: 'Combat', round: 'Round', autre: 'Autre',
};
const PERIODS: UsagePeriod[] = ['jour', 'combat', 'round', 'autre'];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Suivi des capacités à usage limité (X/jour, /combat, /round) — aide de table.
 * Piloté joueur ; aucun effet sur les valeurs dérivées. Les boutons de reset ne touchent
 * que les usages (pas PV/PM/DR).
 */
export const UsagesPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const usages = character.playState?.usages ?? [];

    const write = (next: Usage[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, usages: next } }));
    const update = (idx: number, patch: Partial<Usage>) =>
        write(usages.map((u, i) => (i === idx ? { ...u, ...patch } : u)));
    const add = () => write([...usages, { name: '', max: 1, used: 0, per: 'jour' }]);
    const remove = (idx: number) => write(usages.filter((_, i) => i !== idx));
    const setUsed = (idx: number, u: Usage, delta: number) =>
        update(idx, { used: Math.max(0, Math.min(u.max, u.used + delta)) });
    const reset = (periods: UsagePeriod[]) => write(resetUsages(usages, periods));

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Usages limités</h3>
                <button onClick={add} className="text-stone-500 hover:text-primary-400 text-sm" title="Ajouter un usage">+</button>
            </div>
            {usages.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucune capacité à usage limité suivie.</p>}
            {usages.map((u, idx) => {
                const spent = u.used >= u.max;
                return (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                        <input
                            type="text"
                            className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 outline-none focus:border-primary-500/40"
                            placeholder="Nom de la capacité"
                            value={u.name}
                            onChange={e => update(idx, { name: e.target.value })}
                        />
                        <select
                            className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-stone-200 outline-none"
                            value={u.per}
                            onChange={e => update(idx, { per: e.target.value as UsagePeriod })}
                        >
                            {PERIODS.map(p => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setUsed(idx, u, -1)} className="text-stone-500 hover:text-green-400 w-5 text-center" title="−1 utilisé">−</button>
                            <span className={`font-mono font-bold ${spent ? 'text-red-400' : 'text-stone-300'}`}>{u.used}/</span>
                            <input
                                type="number"
                                className="w-9 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                value={u.max}
                                onChange={e => update(idx, { max: Math.max(0, parseInt(e.target.value) || 0) })}
                            />
                            <button onClick={() => setUsed(idx, u, 1)} className="text-stone-500 hover:text-red-400 w-5 text-center" title="+1 utilisé">+</button>
                        </div>
                        <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                    </div>
                );
            })}
            {usages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <button onClick={() => reset(['jour', 'combat', 'round'])} className="text-[9px] uppercase font-bold px-2 py-1 rounded border border-stone-700 text-stone-400 hover:border-primary-500/50 hover:text-primary-300 transition-all">Repos long</button>
                    <button onClick={() => reset(['combat', 'round'])} className="text-[9px] uppercase font-bold px-2 py-1 rounded border border-stone-700 text-stone-400 hover:border-primary-500/50 hover:text-primary-300 transition-all">Fin de combat</button>
                    <button onClick={() => reset(['round'])} className="text-[9px] uppercase font-bold px-2 py-1 rounded border border-stone-700 text-stone-400 hover:border-primary-500/50 hover:text-primary-300 transition-all">Nouveau round</button>
                </div>
            )}
        </div>
    );
};
```

- [ ] **Step 2 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { UsagesPanel } from '../components/character/UsagesPanel';`

Rendre `<UsagesPanel character={character} setCharacter={setCharacter} />` après `<MagicItemsPanel … />` (colonne équipement).

- [ ] **Step 3 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 4 : Commit**

```bash
git add app/src/components/character/UsagesPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): panneau de suivi des usages limités (aide de table)"
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

- `resetUsages` testé (périodes visées remises à 0, autres intactes, liste absente → [], immuable).
- `PlayState.usages` + `Usage`/`UsagePeriod` ; `UsagesPanel` : ajout/édition (nom, max, période), compteur borné −/+, boutons de reset par période.
- Aucun effet sur les valeurs dérivées ; les boutons ne touchent que les usages.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

Autres mécaniques Phase 5 : compagnons (#1), états activables (#3), substitution de carac (#5), capacités à choix (#6). Puis le système de repos COF2 complet (réutilisera `resetUsages`).
