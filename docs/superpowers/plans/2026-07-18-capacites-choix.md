# Capacités à choix (tranche minimale) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au joueur d'enregistrer et d'afficher son choix pour les capacités acquises qui offrent une option (tatouages, élixirs, etc.), dans `characterVoies[].choices`.

**Architecture :** Frontend seul (aucun changement backend — `Capability.details` et `CharacterVoie.choices` sont déjà exposés/writable). Helper pur `capabilityChoiceKey` (détecte une capacité à choix) ; composant `ChoicesPanel` qui parcourt les voies du personnage, résout les capacités depuis le compendium et affiche un champ de choix par capacité concernée. Aucune valeur dérivée persistée (le choix est une saisie joueur).

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-18-capacites-choix-design.md`.

## Global Constraints

- **Frontend uniquement** — aucun changement backend ; réutilise `characterVoies[].choices` (writable, round-trip OK).
- **Enregistrement + affichage** seulement (pas de résolution add/remplacement).
- **Aucune valeur dérivée persistée** (le choix est une saisie joueur).
- **Baseline lint** ~133 ; gate = **0 nouvelle**, **aucun nouveau `any`** (typer via les alias dérivés, pas de `any` explicite dans le composant).

## File Structure

- **`app/src/utils/cofRules.ts`** + **`.test.ts`** — `capabilityChoiceKey` (Task 1).
- **`app/src/components/character/types.ts`** — alias `AllVoieList` (Task 2).
- **`app/src/components/character/ChoicesPanel.tsx`** — nouveau (Task 2).
- **`app/src/pages/CharacterSheet.tsx`** — intègre le panneau (Task 2).

---

### Task 1 : `capabilityChoiceKey` (TDD)

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `capabilityChoiceKey(details: Record<string, unknown> | undefined | null): string | undefined`.

- [ ] **Step 1 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `capabilityChoiceKey` depuis `./cofRules`) :

```ts
describe('capabilityChoiceKey', () => {
  it('détecte une clé options_*/choix_*', () => {
    expect(capabilityChoiceKey({ options_tatouages: 'texte' })).toBe('options_tatouages');
    expect(capabilityChoiceKey({ choix_dieu: '...' })).toBe('choix_dieu');
  });
  it('renvoie undefined sans clé de choix / details vide / null', () => {
    expect(capabilityChoiceKey({ statistiques_dm: '2d6' })).toBeUndefined();
    expect(capabilityChoiceKey({})).toBeUndefined();
    expect(capabilityChoiceKey(undefined)).toBeUndefined();
    expect(capabilityChoiceKey(null)).toBeUndefined();
  });
});
```

- [ ] **Step 2 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (`capabilityChoiceKey is not a function`).

- [ ] **Step 3 : Implémenter**

Dans `app/src/utils/cofRules.ts`, ajouter (fonction autonome, aucun import nouveau) :

```ts
// Renvoie la clé de choix (`options_*`/`choix_*`) des details d'une capacité, sinon undefined.
export const capabilityChoiceKey = (
  details: Record<string, unknown> | undefined | null,
): string | undefined =>
  details ? Object.keys(details).find(k => /^(options|choix)/i.test(k)) : undefined;
```

- [ ] **Step 4 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS. Puis `docker compose exec -T frontend npx tsc -b` → 0 erreur.

- [ ] **Step 5 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): capabilityChoiceKey (détection des capacités à choix)"
```

---

### Task 2 : `ChoicesPanel` + intégration

**Files:**
- Modify: `app/src/components/character/types.ts`, `app/src/pages/CharacterSheet.tsx`
- Create: `app/src/components/character/ChoicesPanel.tsx`

**Interfaces:**
- Consumes: `capabilityChoiceKey` (Task 1) ; `races`, `profiles`, `allVoies` (compendium, existant via `useCharacterData`).

- [ ] **Step 1 : Alias `AllVoieList` dans `types.ts`**

Dans `app/src/components/character/types.ts`, après `export type VoieList = RefData['prestigePaths'];`, ajouter :

```ts
export type AllVoieList = RefData['allVoies'];
```

- [ ] **Step 2 : Créer `ChoicesPanel.tsx`**

Créer `app/src/components/character/ChoicesPanel.tsx` :

```tsx
import React from 'react';
import type { Character } from '../../types/character';
import { capabilityChoiceKey } from '../../utils/cofRules';
import type { RaceList, ProfileList, AllVoieList } from './types';

interface CompendiumCap { rank?: number; name?: string; details?: Record<string, unknown> }
interface CompendiumVoieLite { name?: string; capabilities?: CompendiumCap[] }

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    races: RaceList;
    profiles: ProfileList;
    allVoies: AllVoieList;
}

/**
 * Capacités à choix (COF2 §7 #6, tranche minimale) : pour chaque capacité acquise offrant
 * une option (`details.options_*`/`choix_*`), le joueur enregistre son choix (texte libre)
 * dans `characterVoies[].choices[<rang>]`. Piloté joueur ; pas de résolution add/remplacement.
 */
export const ChoicesPanel: React.FC<Props> = ({ character, setCharacter, races, profiles, allVoies }) => {
    const byIri = new Map<string, CompendiumVoieLite>();
    for (const r of races) for (const v of (r.availableVoies || [])) if (v?.['@id']) byIri.set(v['@id'], v);
    for (const p of profiles) for (const v of (p.voies || [])) if (v?.['@id']) byIri.set(v['@id'], v);
    for (const v of allVoies) if (v?.['@id']) byIri.set(v['@id'], v);

    const voies = character.characterVoies ?? [];
    const rows: { idx: number; rank: number; voieName: string; capName: string; help?: string; value: string }[] = [];
    voies.forEach((entry, idx) => {
        const v = byIri.get(entry.voie);
        if (!v) return;
        for (let rank = 1; rank <= entry.rank; rank++) {
            const cap = (v.capabilities || []).find(c => c.rank === rank);
            const key = cap ? capabilityChoiceKey(cap.details) : undefined;
            if (cap && key) {
                const help = cap.details?.[key];
                rows.push({
                    idx, rank, voieName: v.name || '', capName: cap.name || '',
                    help: typeof help === 'string' ? help : undefined,
                    value: String(entry.choices?.[String(rank)] ?? ''),
                });
            }
        }
    });

    const setChoice = (idx: number, rank: number, value: string) =>
        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const e = cv[idx];
            if (!e) return prev;
            cv[idx] = { ...e, choices: { ...(e.choices || {}), [String(rank)]: value } };
            return { ...prev, characterVoies: cv };
        });

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] border-b border-white/5 pb-2">Capacités à choix</h3>
            {rows.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucune capacité à choix.</p>}
            {rows.map(row => (
                <div key={`${row.idx}-${row.rank}`} className="space-y-1">
                    <label className="text-[11px] text-stone-300 font-bold">
                        {row.capName}
                        <span className="text-stone-600 font-normal"> — {row.voieName}</span>
                    </label>
                    {row.help && <p className="text-[10px] text-stone-500 italic leading-snug">{row.help}</p>}
                    <input
                        type="text"
                        className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                        placeholder="Votre choix…"
                        value={row.value}
                        onChange={e => setChoice(row.idx, row.rank, e.target.value)}
                    />
                </div>
            ))}
        </div>
    );
};
```

- [ ] **Step 3 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { ChoicesPanel } from '../components/character/ChoicesPanel';`

`races`, `profiles`, `allVoies` sont déjà déstructurés de `useCharacterData()` dans ce fichier. Rendre `<ChoicesPanel character={character} setCharacter={setCharacter} races={races} profiles={profiles} allVoies={allVoies} />` après `<RestPanel … />` (colonne équipement).

- [ ] **Step 4 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133) ; aucun `any` explicite dans `ChoicesPanel.tsx`.

- [ ] **Step 5 : Commit**

```bash
git add app/src/components/character/types.ts app/src/components/character/ChoicesPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): panneau des capacités à choix (enregistrement du choix)"
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

- `capabilityChoiceKey` testé (détecte options_*/choix_*, undefined sinon).
- `ChoicesPanel` affiche un champ de choix par capacité acquise à option (aide = prose des options) et écrit `characterVoies[].choices[<rang>]` ; recharge à la réouverture.
- Aucune valeur dérivée persistée ; aucun nouveau `any` ; aucune régression.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

**Phase 5 close** (mécaniques data-free livrées). Le vrai #6 (résolution add/remplacement contre le compendium) et la structuration des `effect.*` par capacité restent des chantiers structurés à part.
