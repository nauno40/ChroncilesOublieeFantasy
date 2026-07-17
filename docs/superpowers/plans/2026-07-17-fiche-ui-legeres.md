# Fiche : UI légères — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exposer sur la fiche les champs et dérivations que le modèle supporte déjà mais qui n'ont pas d'UI : langues & talents secondaires (compteur d'emplacements dérivé de l'INT), RP étendu (secret/notes), caractéristiques physiques, monnaie po/pc.

**Architecture :** Frontend seul (`playState` = JSON opaque backend, aucune migration). Un helper pur `computeLanguageUsage` (testable) ; deux petits composants nouveaux (`LanguagesTalentsPanel`, `PhysicalBlock`) ; des ajouts de champs aux composants existants (`RoleplaySection`, `ProtectionSection`). Aucune valeur dérivée persistée — seules les saisies joueur le sont. Enforcement du budget d'emplacements **souple** (indicatif, jamais bloquant).

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-17-fiche-ui-legeres-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration backend (`playState` = JSONB opaque).
- **Aucune valeur dérivée persistée** : `computeLanguageUsage` est calculé/affiché, jamais écrit. Seules les saisies `playState.languages` / `talents` / `rp` / `physical` / `money` sont stockées.
- **Enforcement souple** du budget d'emplacements : dépassement (`used > available`) **signalé** (couleur), jamais bloqué. « Commun » gratuit (base 1). Illettré si INT < 0.
- **Baseline lint** ~133 `no-explicit-any` ; gate = **0 nouvelle**, aucun nouveau `any`.
- Talents et langues **partagent** le budget d'emplacements (COF2 §Talent secondaire).

## File Structure

- **`app/src/utils/cofRules.ts`** — ajoute `computeLanguageUsage` (Task 1).
- **`app/src/utils/cofRules.test.ts`** — tests de `computeLanguageUsage` (Task 1).
- **`app/src/types/character.ts`** — ajoute `talents?` et `physical?` à `PlayState` (Task 2).
- **`app/src/components/character/LanguagesTalentsPanel.tsx`** — nouveau (Task 2).
- **`app/src/components/character/PhysicalBlock.tsx`** — nouveau (Task 3).
- **`app/src/components/character/RoleplaySection.tsx`** — ajoute secret + notes (Task 3).
- **`app/src/components/character/ProtectionSection.tsx`** — ajoute po/pc (Task 3).
- **`app/src/pages/CharacterSheet.tsx`** — intègre les nouveaux panneaux (Tasks 2-3).

---

### Task 1 : `computeLanguageUsage` (fonction pure, TDD)

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `computeLanguageSlots` (existant).
- Produces: `computeLanguageUsage(languages: string[] | undefined, talents: string[] | undefined, intMod: number): { used: number; available: number; illiterate: boolean }`.

- [ ] **Step 1 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `computeLanguageUsage` depuis `./cofRules`) :

```ts
describe('computeLanguageUsage (budget partagé langues/talents)', () => {
  it('« Commun » est gratuit : une seule langue ⇒ 0 emplacement utilisé', () => {
    expect(computeLanguageUsage(['Commun'], [], 2)).toEqual({ used: 0, available: 2, illiterate: false });
  });
  it('langues au-delà de la base + talents consomment le budget', () => {
    // 3 langues (2 au-delà de Commun) + 1 talent = 3 emplacements ; INT +2 ⇒ 2 dispo
    expect(computeLanguageUsage(['Commun', 'Elfique', 'Nain'], ['Cuisine'], 2))
      .toEqual({ used: 3, available: 2, illiterate: false });
  });
  it('available suit computeLanguageSlots ; illettré si INT < 0', () => {
    expect(computeLanguageUsage([], [], -1)).toEqual({ used: 0, available: 0, illiterate: true });
    expect(computeLanguageUsage(['Commun', 'Orc'], [], 3)).toEqual({ used: 1, available: 3, illiterate: false });
  });
  it('listes absentes ⇒ 0 utilisé', () => {
    expect(computeLanguageUsage(undefined, undefined, 0)).toEqual({ used: 0, available: 0, illiterate: false });
  });
});
```

- [ ] **Step 2 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (`computeLanguageUsage is not a function`).

- [ ] **Step 3 : Implémenter**

Ajouter à `cofRules.ts` (après `computeLanguageSlots`) :

```ts
// Compteur d'emplacements langues/talents (COF2 §Talent secondaire) : « Commun » est
// gratuit (base 1) ; chaque langue supplémentaire et chaque talent secondaire consomme
// un emplacement du budget partagé dérivé de l'INT. Indicatif — jamais bloquant.
export const computeLanguageUsage = (
  languages: string[] | undefined,
  talents: string[] | undefined,
  intMod: number,
): { used: number; available: number; illiterate: boolean } => {
  const { slots, illiterate } = computeLanguageSlots(intMod);
  return {
    used: Math.max(0, (languages?.length ?? 0) - 1) + (talents?.length ?? 0),
    available: slots,
    illiterate,
  };
};
```

- [ ] **Step 4 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): computeLanguageUsage — compteur emplacements langues/talents"
```

---

### Task 2 : Types + `LanguagesTalentsPanel` + intégration

**Files:**
- Modify: `app/src/types/character.ts`, `app/src/pages/CharacterSheet.tsx`
- Create: `app/src/components/character/LanguagesTalentsPanel.tsx`

**Interfaces:**
- Consumes: `computeLanguageUsage` (Task 1), `mods.INT` (hook, existant).
- Produces: le composant `LanguagesTalentsPanel`.

- [ ] **Step 1 : Ajouter les champs à `PlayState`**

Dans `app/src/types/character.ts`, dans `interface PlayState`, après `languages: string[];` :

```ts
    talents?: string[];                                             // talents secondaires (partagent le budget des langues)
    physical?: { age?: string; height?: string; weight?: string }; // saisie libre (physique)
```

- [ ] **Step 2 : Créer `LanguagesTalentsPanel.tsx`**

Créer `app/src/components/character/LanguagesTalentsPanel.tsx` :

```tsx
import React from 'react';
import type { Character } from '../../types/character';
import { computeLanguageUsage } from '../../utils/cofRules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    /** Modificateur d'INT effectif (pilote le nombre d'emplacements). */
    intMod: number;
}

type ListKey = 'languages' | 'talents';

/**
 * Édition des langues et talents secondaires (COF2 §Talent secondaire — budget partagé).
 * Compteur d'emplacements dérivé de l'INT, indicatif (jamais bloquant) ; « Commun » gratuit.
 */
export const LanguagesTalentsPanel: React.FC<Props> = ({ character, setCharacter, intMod }) => {
    const languages = character.playState?.languages ?? [];
    const talents = character.playState?.talents ?? [];
    const usage = computeLanguageUsage(languages, talents, intMod);
    const over = usage.used > usage.available;

    const setList = (key: ListKey, list: string[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, [key]: list } }));
    const updateItem = (key: ListKey, list: string[], idx: number, val: string) => {
        const next = [...list]; next[idx] = val; setList(key, next);
    };
    const addItem = (key: ListKey, list: string[]) => setList(key, [...list, '']);
    const removeItem = (key: ListKey, list: string[], idx: number) => setList(key, list.filter((_, i) => i !== idx));

    const column = (title: string, key: ListKey, list: string[], placeholder: string) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-black text-stone-500 tracking-[0.2em]">{title}</label>
                <button onClick={() => addItem(key, list)} className="text-stone-500 hover:text-primary-400 text-sm" title={`Ajouter ${title.toLowerCase()}`}>+</button>
            </div>
            {list.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                    <input
                        type="text"
                        className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                        placeholder={placeholder}
                        value={item}
                        onChange={e => updateItem(key, list, idx, e.target.value)}
                    />
                    <button onClick={() => removeItem(key, list, idx)} className="text-stone-600 hover:text-red-400 text-xs" title="Retirer">✕</button>
                </div>
            ))}
        </div>
    );

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Langues & Talents</h3>
                <div className="flex items-center gap-2">
                    {usage.illiterate && (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-900/30 border border-red-500/40 text-red-300">Illettré</span>
                    )}
                    <span className={`text-[10px] font-mono font-bold ${over ? 'text-red-400' : 'text-stone-400'}`}>
                        {usage.used} / {usage.available} empl.
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {column('Langues', 'languages', languages, 'ex. Commun, Elfique…')}
                {column('Talents secondaires', 'talents', talents, 'ex. Cuisine, Échecs…')}
            </div>
        </div>
    );
};
```

- [ ] **Step 3 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { LanguagesTalentsPanel } from '../components/character/LanguagesTalentsPanel';`

`mods` est déjà déstructuré du hook. Rendre le panneau après `<RoleplaySection … />` (colonne identité/RP) :

```tsx
                    <LanguagesTalentsPanel character={character} setCharacter={setCharacter} intMod={mods.INT} />
```

- [ ] **Step 4 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 5 : Commit**

```bash
git add app/src/types/character.ts app/src/components/character/LanguagesTalentsPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): panneau Langues & Talents (compteur d'emplacements INT)"
```

---

### Task 3 : RP étendu + monnaie po/pc + bloc Physique

**Files:**
- Modify: `app/src/components/character/RoleplaySection.tsx`, `app/src/components/character/ProtectionSection.tsx`, `app/src/pages/CharacterSheet.tsx`
- Create: `app/src/components/character/PhysicalBlock.tsx`

**Interfaces:**
- Consumes: `playState.rp.secret/notes`, `playState.money.po/pc`, `playState.physical` (Task 2).

- [ ] **Step 1 : `RoleplaySection` — ajouter secret + notes**

Dans `app/src/components/character/RoleplaySection.tsx`, ajouter après le bloc « Travers / Défaut » (à l'intérieur du `<div className="grid …">`), deux nouveaux blocs :

```tsx
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <label className="text-xs uppercase font-black text-purple-500/60 tracking-[0.2em] ml-1">Secret</label>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-purple-500/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Ce que votre héros cache..."
                    value={character.playState?.rp?.secret || ''}
                    onChange={e => setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, secret: e.target.value } } }))}
                />
            </div>
            <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
                <label className="text-xs uppercase font-black text-stone-500/60 tracking-[0.2em] ml-1">Notes</label>
                <textarea
                    className="w-full bg-stone-950/40 border border-stone-800/50 rounded-xl p-4 text-stone-300 focus:border-stone-500/30 focus:bg-stone-900/40 outline-none h-32 resize-none transition-all font-body leading-relaxed placeholder:text-stone-800"
                    placeholder="Notes libres..."
                    value={character.playState?.rp?.notes || ''}
                    onChange={e => setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, rp: { ...prev.playState!.rp, notes: e.target.value } } }))}
                />
            </div>
```

- [ ] **Step 2 : `ProtectionSection` — ajouter po et pc**

Dans `app/src/components/character/ProtectionSection.tsx`, dans le conteneur « Argent » (le `<div className="flex items-center gap-1.5 …">`), ajouter **avant** l'input `pa` un input `po`, et **après** le `<span>pa</span>` un input `pc`, sur le même modèle. Chaque input lit `character.playState?.money?.<X> ?? 0` et écrit via `setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, money: { ...prev.playState!.money, <X>: val } } }))` (val = `Math.max(0, parseInt(e.target.value) || 0)`), avec un `<span>` d'unité (`po` / `pc`). Exemple pour `po` (répliquer pour `pc`) :

```tsx
                    <input
                        type="number"
                        min="0"
                        className="w-14 bg-transparent text-right text-sm font-mono font-bold text-yellow-500 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                        value={character.playState?.money?.po ?? 0}
                        onChange={e => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, money: { ...prev.playState!.money, po: val } } }));
                        }}
                    />
                    <span className="text-[10px] font-bold text-yellow-500/60">po</span>
```

(Le champ `pa` existant reste inchangé ; ajouter `po` avant lui et `pc` après son `<span>pa</span>`.)

- [ ] **Step 3 : Créer `PhysicalBlock.tsx`**

Créer `app/src/components/character/PhysicalBlock.tsx` :

```tsx
import React from 'react';
import type { Character } from '../../types/character';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

type Field = 'age' | 'height' | 'weight';
const FIELDS: { key: Field; label: string; placeholder: string }[] = [
    { key: 'age', label: 'Âge', placeholder: 'ex. 27 ans' },
    { key: 'height', label: 'Taille', placeholder: 'ex. 1,75 m' },
    { key: 'weight', label: 'Poids', placeholder: 'ex. 70 kg' },
];

/** Caractéristiques physiques (saisie libre — les bornes par peuple ne sont pas modélisées). */
export const PhysicalBlock: React.FC<Props> = ({ character, setCharacter }) => {
    const physical = character.playState?.physical ?? {};
    const set = (key: Field, val: string) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, physical: { ...prev.playState?.physical, [key]: val } } }));

    return (
        <div className="glass-panel p-4 rounded-2xl border-white/5 bg-stone-900/10">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] mb-3">Physique</h3>
            <div className="grid grid-cols-3 gap-3">
                {FIELDS.map(f => (
                    <div key={f.key} className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">{f.label}</label>
                        <input
                            type="text"
                            className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                            placeholder={f.placeholder}
                            value={physical[f.key] || ''}
                            onChange={e => set(f.key, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
```

- [ ] **Step 4 : Intégrer `PhysicalBlock` dans `CharacterSheet.tsx`**

Importer : `import { PhysicalBlock } from '../components/character/PhysicalBlock';`

Rendre le bloc juste après `<IdentityBlock … />` (colonne identité) :

```tsx
                    <PhysicalBlock character={character} setCharacter={setCharacter} />
```

- [ ] **Step 5 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 6 : Commit**

```bash
git add app/src/components/character/RoleplaySection.tsx app/src/components/character/ProtectionSection.tsx app/src/components/character/PhysicalBlock.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): RP étendu (secret/notes), monnaie po/pc, bloc physique"
```

---

### Task 4 : Gate d'intégration

**Files:** aucun (vérification).

- [ ] **Step 1 : Type-check + tests unitaires**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.

- [ ] **Step 2 : Lint**

Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3`
Expected: ≤ baseline (~133), 0 nouvelle.

- [ ] **Step 3 : E2E de non-régression fiche**

Run: `bash scripts/e2e.sh e2e/character-sheet.spec.ts` puis `bash scripts/e2e.sh e2e/character-voies.spec.ts`
Expected: PASS (les nouveaux panneaux n'introduisent pas de régression). Réessayer une fois en cas de flake réseau.

## Definition of Done

- `computeLanguageUsage` testé (Commun gratuit, budget partagé langues+talents, `available` = `computeLanguageSlots`, illettré).
- `PlayState` porte `talents?` et `physical?` ; UI : Langues & Talents (compteur/illettré, souple), RP secret+notes, monnaie po/pa/pc, physique libre.
- Aucune valeur dérivée persistée ; tout persiste dans `playState`.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

**Phase 5** — mécaniques spéciales (companions, transformations, états activables, usages limités, substitutions de carac, capacités à choix), schéma déjà réservé. Suivis incrémentaux : `effect.bonuses` par capacité, coût sort PM, plafond 6 voies, DEF capacité-consciente, langues de peuple + bornes physiques structurées, `magicStat`/`manaStat`, `weaponsAuth`.
