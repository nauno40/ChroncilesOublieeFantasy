# Substitution de caractéristique — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au joueur de choisir la caractéristique qui alimente ses valeurs d'attaque contact / distance (substitution COF2, ex. moine → VOL au contact), sans dépendance compendium.

**Architecture :** Frontend seul (`playState` = JSON opaque, aucune migration). `playState.caracSubstitutions` (contact/distance) ; helper pur `attackCarac` ; résolution dans `MainStatsPanel` (les fonctions pures restent inchangées) ; UI `CaracSubstitutionsPanel`. Aucune valeur dérivée persistée ; défauts FOR/AGI ⇒ zéro régression sans substitution.

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-17-substitution-carac-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration backend.
- **Défauts FOR/AGI** : sans substitution, les attaques sont identiques à aujourd'hui.
- **Aucune valeur dérivée persistée** ; fonctions pures `cofRules` (`attackValue`) inchangées.
- `playState.caracSubstitutions` minimal : une valeur = défaut ⇒ entrée retirée.
- **Baseline lint** ~133 ; gate = **0 nouvelle**, aucun nouveau `any`.

## File Structure

- **`app/src/types/character.ts`** — champ `caracSubstitutions?` (Task 1).
- **`app/src/utils/cofRules.ts`** + **`.test.ts`** — `attackCarac` (Task 1).
- **`app/src/components/character/MainStatsPanel.tsx`** — résout la carac d'attaque (Task 2).
- **`app/src/components/character/CaracSubstitutionsPanel.tsx`** — nouveau (Task 2).
- **`app/src/pages/CharacterSheet.tsx`** — intègre le panneau (Task 2).

---

### Task 1 : Type + `attackCarac` (TDD)

**Files:**
- Modify: `app/src/types/character.ts`, `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `PlayState.caracSubstitutions?: { contact?: CaracKey; distance?: CaracKey }` ; `attackCarac(target: 'contact' | 'distance', subs, defaultCarac: CaracKey): CaracKey`.

- [ ] **Step 1 : Champ dans `character.ts`**

Dans `app/src/types/character.ts`, dans `interface PlayState`, après `companions?: Companion[];` :

```ts
    // Substitution de caractéristique par attaque (COF2 §7 #5). Absent ⇒ défauts FOR/AGI.
    caracSubstitutions?: { contact?: CaracKey; distance?: CaracKey };
```

(`CaracKey` est déjà exporté dans ce fichier.)

- [ ] **Step 2 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `attackCarac` depuis `./cofRules`) :

```ts
describe('attackCarac (substitution de caractéristique)', () => {
  it('renvoie le défaut quand aucune substitution', () => {
    expect(attackCarac('contact', undefined, 'FOR')).toBe('FOR');
    expect(attackCarac('distance', {}, 'AGI')).toBe('AGI');
    expect(attackCarac('contact', { distance: 'PER' }, 'FOR')).toBe('FOR'); // autre cible
  });
  it('renvoie la substitution du joueur quand présente', () => {
    expect(attackCarac('contact', { contact: 'VOL' }, 'FOR')).toBe('VOL'); // moine
    expect(attackCarac('distance', { distance: 'PER' }, 'AGI')).toBe('PER');
  });
});
```

- [ ] **Step 3 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (`attackCarac is not a function`).

- [ ] **Step 4 : Implémenter**

Dans `app/src/utils/cofRules.ts`, étendre l'import existant depuis `../types/character` (qui importe déjà `CharacterVoieRef, VoieSource, MagicItem, ItemBonusTarget, Usage, UsagePeriod, Companion`) pour ajouter `CaracKey`. Puis ajouter la fonction :

```ts
// Résout la caractéristique d'une attaque : substitution du joueur, sinon défaut COF2.
export const attackCarac = (
  target: 'contact' | 'distance',
  subs: { contact?: CaracKey; distance?: CaracKey } | undefined,
  defaultCarac: CaracKey,
): CaracKey => subs?.[target] ?? defaultCarac;
```

- [ ] **Step 5 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS. Puis `docker compose exec -T frontend npx tsc -b` → 0 erreur.

- [ ] **Step 6 : Commit**

```bash
git add app/src/types/character.ts app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): attackCarac + caracSubstitutions (substitution de carac)"
```

---

### Task 2 : Résolution `MainStatsPanel` + `CaracSubstitutionsPanel`

**Files:**
- Modify: `app/src/components/character/MainStatsPanel.tsx`, `app/src/pages/CharacterSheet.tsx`
- Create: `app/src/components/character/CaracSubstitutionsPanel.tsx`

**Interfaces:**
- Consumes: `attackCarac`, `CaracKey` (Task 1).

- [ ] **Step 1 : Résoudre la carac dans `MainStatsPanel`**

Dans `MainStatsPanel.tsx`, ajouter `attackCarac` à l'import depuis `../../utils/cofRules`. Au début du composant (avant le `return`), résoudre les caracs :

```ts
    const subs = character.playState?.caracSubstitutions;
    const contactCarac = attackCarac('contact', subs, 'FOR');
    const distanceCarac = attackCarac('distance', subs, 'AGI');
```

Remplacer les deux valeurs d'attaque :
- Atk CàC : `{attackValue(mods.FOR, character.level || 1) + attackBonus}` → `{attackValue(mods[contactCarac], character.level || 1) + attackBonus}`
- Atk Tir : `{attackValue(mods.AGI, character.level || 1) + attackBonus}` → `{attackValue(mods[distanceCarac], character.level || 1) + attackBonus}`

(Optionnel, si aisé : afficher la carac substituée en légende quand ≠ défaut. Non requis.)

- [ ] **Step 2 : Créer `CaracSubstitutionsPanel.tsx`**

Créer `app/src/components/character/CaracSubstitutionsPanel.tsx` :

```tsx
import React from 'react';
import type { Character, CaracKey } from '../../types/character';

const CARACS: CaracKey[] = ['FOR', 'AGI', 'CON', 'PER', 'CHA', 'INT', 'VOL'];
type SubTarget = 'contact' | 'distance';
const ROWS: { target: SubTarget; label: string; def: CaracKey }[] = [
    { target: 'contact', label: 'Attaque contact', def: 'FOR' },
    { target: 'distance', label: 'Attaque distance', def: 'AGI' },
];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Substitution de la caractéristique d'attaque (COF2 §7 #5, ex. moine → VOL au contact).
 * Piloté joueur ; défaut = FOR (contact) / AGI (distance). Une valeur au défaut retire
 * l'entrée (playState minimal). Aucun autre effet dérivé.
 */
export const CaracSubstitutionsPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const subs = character.playState?.caracSubstitutions ?? {};

    const setCarac = (target: SubTarget, carac: CaracKey, def: CaracKey) => {
        setCharacter(prev => {
            const next = { ...(prev.playState?.caracSubstitutions ?? {}) };
            if (carac === def) delete next[target];
            else next[target] = carac;
            return { ...prev, playState: { ...prev.playState!, caracSubstitutions: next } };
        });
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] border-b border-white/5 pb-2">Substitution de caractéristique</h3>
            {ROWS.map(row => {
                const current = subs[row.target] ?? row.def;
                const isDefault = current === row.def;
                return (
                    <div key={row.target} className="flex items-center justify-between text-xs">
                        <span className="text-stone-500 uppercase font-bold tracking-wider">{row.label}</span>
                        <select
                            className={`bg-stone-950/40 border border-stone-800 rounded px-2 py-1 outline-none focus:border-primary-500/40 ${isDefault ? 'text-stone-500' : 'text-primary-300'}`}
                            value={current}
                            onChange={e => setCarac(row.target, e.target.value as CaracKey, row.def)}
                        >
                            {CARACS.map(c => <option key={c} value={c}>{c}{c === row.def ? ' (défaut)' : ''}</option>)}
                        </select>
                    </div>
                );
            })}
        </div>
    );
};
```

- [ ] **Step 3 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { CaracSubstitutionsPanel } from '../components/character/CaracSubstitutionsPanel';`

Rendre `<CaracSubstitutionsPanel character={character} setCharacter={setCharacter} />` après `<CompanionsPanel … />` (colonne équipement).

- [ ] **Step 4 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 5 : Commit**

```bash
git add app/src/components/character/MainStatsPanel.tsx app/src/components/character/CaracSubstitutionsPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): substitution de carac d'attaque (contact/distance)"
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

- `attackCarac` testé (défaut vs substitution, cible non substituée).
- `PlayState.caracSubstitutions` ; `MainStatsPanel` résout la carac d'attaque contact/distance ; `CaracSubstitutionsPanel` édite les substitutions (défaut retire l'entrée).
- Sans substitution : attaques identiques (FOR/AGI). Aucune valeur dérivée persistée ; fonctions pures inchangées.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

Autres mécaniques Phase 5 : états activables (#3), capacités à choix (#6), transformations (#2). Incrémental : substitution magie/DM (quand ces attaques seront affichées), auto-dérivation depuis `effect.caracSubstitution`.
