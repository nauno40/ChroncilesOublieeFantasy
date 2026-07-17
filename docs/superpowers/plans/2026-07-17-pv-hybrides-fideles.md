# PV hybrides fidèles — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculer fidèlement les PV max d'un personnage à profil hybride (COF2 chap. 9) : PV par niveau selon la famille des capacités acquises, moyenne des deux familles si mixte, arrondi alterné, exception voie de peuple — avec annotation par niveau dans `playState`.

**Architecture :** Frontend seul (`playState` est du JSON opaque côté backend, aucune migration). Nouvelle fonction pure `computeHybridMaxHp` dans `cofRules.ts` remplaçant le `computeMaxHpByLevel` simpliste de la Phase 3 ; câblage du `maxHp` du hook ; nouveau composant `HpByLevelEditor` d'annotation par niveau. Aucune valeur dérivée n'est persistée — seule l'annotation joueur `playState.hpByLevel` l'est.

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-17-pv-hybrides-fideles-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration backend (`playState` = JSONB opaque).
- **Aucune valeur dérivée persistée** : `maxHp` reste calculé/retourné, jamais écrit. Seule l'annotation joueur `playState.hpByLevel` est stockée.
- **Parité mono-famille** : pour un personnage non hybride, `computeHybridMaxHp(mainFamily, {}, CON, N)` doit égaler `computeMaxHp(FAMILY_BASE_HP[mainFamily], CON, N)`.
- **Baseline lint** : ~133 erreurs `no-explicit-any` pré-existantes ; gate = **0 nouvelle** (cf. mémoire `frontend-lint-baseline`). Ne pas introduire de `any`.
- `FAMILY_BASE_HP` (déjà correct depuis P3 : `aventuriers 4, combattants 5, mages 3, mystiques 4`) est la table famille → PV de base. Identifiants de famille : `'aventuriers' | 'combattants' | 'mages' | 'mystiques'` (issus de `PROFILE_FAMILIES[*].id`).
- **Fidélité chiffrée** : reproduire les 3 exemples du livre (spec §1) — combattant+mage = 4 ; arrondi alterné 3 puis 4 ; peuple(profil principal)+mage.

## File Structure

- **`app/src/utils/cofRules.ts`** — ajoute `computeHybridMaxHp` (Task 1) ; retire `computeMaxHpByLevel` (Task 2).
- **`app/src/utils/cofRules.test.ts`** — tests de `computeHybridMaxHp` (Task 1) ; retire les tests `computeMaxHpByLevel` (Task 2).
- **`app/src/types/character.ts`** — `hpFamilyByLevel` → `hpByLevel: Record<string, string[]>` (Task 2).
- **`app/src/hooks/useCharacterSheet.ts`** — `maxHp` via `computeHybridMaxHp` ; expose `mainFamily` (Task 2).
- **`app/src/components/character/HpByLevelEditor.tsx`** — nouveau composant d'annotation par niveau (Task 3).
- **`app/src/pages/CharacterSheet.tsx`** — intègre `HpByLevelEditor` (Task 3).

---

### Task 1 : `computeHybridMaxHp` (fonction pure, TDD)

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `FAMILY_BASE_HP` (existant), `computeMaxHp` (existant).
- Produces: `computeHybridMaxHp(mainFamily: string, hpByLevel: Record<string, string[]> | undefined, conMod: number, level: number): number`.

Additif : `computeMaxHpByLevel` reste en place pour l'instant (retiré en Task 2), le build reste vert.

- [ ] **Step 1 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (après le bloc `computeMaxHpByLevel` existant ; importer `computeHybridMaxHp` depuis `./cofRules`) :

```ts
describe('computeHybridMaxHp (PV hybrides fidèles, COF2 chap. 9)', () => {
  it('mono-famille : identique à la formule non-hybride (parité)', () => {
    // combattants base 5, CON +2, niveau 3
    expect(computeHybridMaxHp('combattants', {}, 2, 3)).toBe(computeMaxHp(5, 2, 3)); // 26
    expect(computeHybridMaxHp('mages', undefined, 0, 5)).toBe(computeMaxHp(3, 0, 5)); // 18
  });
  it('deux familles au même niveau : moyenne (livre : combattant+mage = 4)', () => {
    // niveau 2 financé par combattant (5) + mage (3) → moyenne 4 ; niveau 1 = 2×5
    expect(computeHybridMaxHp('combattants', { '2': ['combattants', 'mages'] }, 0, 2)).toBe(14); // floor(10 + 4)
  });
  it('arrondi alterné : 3,5 puis 3,5 → 3 puis 4', () => {
    // profil principal mage (3) ; niveaux 2 et 3 = mage(3) + aventurier(4) → moyenne 3,5 chacun
    const hp = (lvl: number, byLevel: Record<string, string[]>) => computeHybridMaxHp('mages', byLevel, 0, lvl);
    // niveau 2 : floor(2×3 + 3,5) = floor(9,5) = 9  (gain niveau 2 = 3)
    expect(hp(2, { '2': ['mages', 'aventuriers'] })).toBe(9);
    // niveau 3 : floor(6 + 3,5 + 3,5) = floor(13) = 13  (gain niveau 3 = 4)
    expect(hp(3, { '2': ['mages', 'aventuriers'], '3': ['mages', 'aventuriers'] })).toBe(13);
  });
  it('exception voie de peuple : la famille du profil principal dans la liste', () => {
    // guerrier (combattants 5) : peuple (→ combattants) + mage (3) → moyenne 4
    expect(computeHybridMaxHp('combattants', { '2': ['combattants', 'mages'] }, 0, 2)).toBe(14);
  });
  it('CON rétroactif sur tous les niveaux', () => {
    expect(computeHybridMaxHp('combattants', {}, -1, 4)).toBe(computeMaxHp(5, -1, 4)); // floor(2×5+5+5+5) - 4 = 25-4=21
  });
});
```

- [ ] **Step 2 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (`computeHybridMaxHp is not a function`).

- [ ] **Step 3 : Implémenter**

Ajouter à `cofRules.ts` (juste après `computeMaxHpByLevel`) :

```ts
// PV max d'un personnage, hybride ou non (COF2 chap. 9). Le niveau 1 compte double et
// suit toujours le profil principal. Chaque niveau ≥ 2 rapporte la MOYENNE des PV de base
// des familles ayant financé ses capacités (annotation `hpByLevel` ; défaut = profil
// principal ; une capacité de voie de peuple compte comme la famille du profil principal).
// `Math.floor` reproduit l'arrondi alterné des demi-PV (deux demis consécutifs se soldent).
export const computeHybridMaxHp = (
  mainFamily: string,
  hpByLevel: Record<string, string[]> | undefined,
  conMod: number,
  level: number,
): number => {
  const lvl = Math.max(1, level);
  const basePV = (f: string): number => FAMILY_BASE_HP[f] ?? FAMILY_BASE_HP[mainFamily] ?? 0;
  let pvBase = 2 * basePV(mainFamily); // niveau 1 compte double
  for (let L = 2; L <= lvl; L++) {
    const fams = hpByLevel?.[String(L)];
    const list = fams && fams.length > 0 ? fams : [mainFamily];
    pvBase += list.reduce((s, f) => s + basePV(f), 0) / list.length;
  }
  return Math.floor(pvBase) + conMod * lvl;
};
```

- [ ] **Step 4 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS (existants + nouveaux).

- [ ] **Step 5 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): computeHybridMaxHp — PV hybrides fidèles (moyenne + arrondi alterné)"
```

---

### Task 2 : Migrer le modèle et le hook, retirer `computeMaxHpByLevel`

**Files:**
- Modify: `app/src/types/character.ts`, `app/src/hooks/useCharacterSheet.ts`, `app/src/utils/cofRules.ts`, `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `computeHybridMaxHp` (Task 1), `PROFILE_FAMILIES` (existant).
- Produces: `playState.hpByLevel: Record<string, string[]>` ; le hook expose `mainFamily: string | undefined` en plus de `maxHp`.

Changement coordonné : renommer le champ, recâbler `maxHp`, retirer la fonction morte. Le build n'est vert qu'une fois les 4 fichiers cohérents.

- [ ] **Step 1 : Type `character.ts`**

Remplacer la ligne 33 :

```ts
    hpFamilyByLevel?: Record<string, string>; // hybride (spec §5) — réservé Phase 3
```

par :

```ts
    // PV hybrides (COF2 chap. 9) : familles finançant chaque niveau 2..N (1 ou 2 par
    // niveau ; voie de peuple ⇒ famille du profil principal). Absent/vide ⇒ profil principal.
    hpByLevel?: Record<string, string[]>;
```

- [ ] **Step 2 : Hook `useCharacterSheet.ts`**

Dans les imports depuis `../utils/cofRules`, retirer `computeMaxHpByLevel` et `FAMILY_BASE_HP` (devenus inutiles dans le hook), ajouter `computeHybridMaxHp` et `PROFILE_FAMILIES`.

Remplacer le `useMemo` de `maxHp` (lignes ~166-184) par :

```ts
    // Famille du profil principal (COF2 : fixe, pilote PV niveau 1, DR, PC, défauts hybrides).
    const mainFamily = PROFILE_FAMILIES[profileName ?? '']?.id;

    // PV max (dérivé, COF2 chap. 9 — cas hybride géré par computeHybridMaxHp).
    const maxHp = useMemo(() => {
        const baseHp = (selectedProfile as any)?.stats?.hpPerLevel
            || (selectedProfile as any)?.hpPerLevel
            || (selectedProfile as any)?.class?.stats?.hpPerLevel;
        if (!baseHp) return playState.hp?.current || 0;
        const level = character.level || 1;
        if (!mainFamily) return computeMaxHp(baseHp, mods.CON, level);
        return computeHybridMaxHp(mainFamily, playState.hpByLevel, mods.CON, level);
    }, [selectedProfile, mainFamily, mods.CON, character.level, playState.hp?.current, playState.hpByLevel]);
```

Dans l'objet retourné par le hook, ajouter `mainFamily` à côté de `maxHp` (ex. `maxHp, mainFamily,`).

- [ ] **Step 3 : Retirer `computeMaxHpByLevel` de `cofRules.ts`**

Supprimer la fonction `computeMaxHpByLevel` (lignes ~116-122, le bloc `export const computeMaxHpByLevel = …`) et son commentaire.

- [ ] **Step 4 : Retirer ses tests de `cofRules.test.ts`**

Supprimer l'import `computeMaxHpByLevel` (ligne 7) et tout le bloc `describe('computeMaxHpByLevel (hybride)', …)` (lignes ~134-147).

- [ ] **Step 5 : Vérifier build + tests**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend grep -rn "hpFamilyByLevel\|computeMaxHpByLevel" src` → **vide**.

- [ ] **Step 6 : Commit**

```bash
git add app/src/types/character.ts app/src/hooks/useCharacterSheet.ts app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "refactor(character): playState.hpByLevel + maxHp via computeHybridMaxHp (retire computeMaxHpByLevel)"
```

---

### Task 3 : Composant `HpByLevelEditor` + intégration fiche

**Files:**
- Create: `app/src/components/character/HpByLevelEditor.tsx`
- Modify: `app/src/pages/CharacterSheet.tsx`

**Interfaces:**
- Consumes: `Character` type, `FAMILY_BASE_HP` (cofRules), `mainFamily` (hook, Task 2).
- Produces: composant `HpByLevelEditor` rendu sous les stats de combat.

Comportement : replié par défaut (cas mono-famille propre) ; déplié, une ligne par niveau 2..N avec sélecteur(s) de famille (défaut = profil principal). Écrit `playState.hpByLevel`, en retirant l'entrée si elle retombe sur `[mainFamily]` (playState minimal).

- [ ] **Step 1 : Créer le composant**

Créer `app/src/components/character/HpByLevelEditor.tsx` :

```tsx
import React from 'react';
import type { Character } from '../../types/character';
import { FAMILY_BASE_HP } from '../../utils/cofRules';

const FAMILY_LABELS: Record<string, string> = {
    aventuriers: 'Aventuriers', combattants: 'Combattants', mages: 'Mages', mystiques: 'Mystiques',
};
const FAMILIES = ['aventuriers', 'combattants', 'mages', 'mystiques'];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    /** Famille du profil principal (défaut de chaque niveau). */
    mainFamily?: string;
}

/**
 * Annotation par niveau des familles finançant les PV (profils hybrides, COF2 chap. 9).
 * Discret par défaut : pour un personnage mono-famille toutes les lignes valent le profil
 * principal et rien n'est écrit dans playState.
 */
export const HpByLevelEditor: React.FC<Props> = ({ character, setCharacter, mainFamily }) => {
    const level = character.level ?? 0;
    if (!mainFamily || level < 2) return null;

    const byLevel = character.playState?.hpByLevel ?? {};

    const familiesOf = (L: number): string[] => byLevel[String(L)] ?? [mainFamily];

    const writeLevel = (L: number, fams: string[]) => {
        setCharacter(prev => {
            const next = { ...(prev.playState?.hpByLevel ?? {}) };
            // Retomber sur [profil principal] ⇒ retirer l'entrée (playState minimal).
            if (fams.length === 1 && fams[0] === mainFamily) delete next[String(L)];
            else next[String(L)] = fams;
            return { ...prev, playState: { ...prev.playState!, hpByLevel: next } };
        });
    };

    const setFamily = (L: number, idx: number, fam: string) => {
        const cur = [...familiesOf(L)];
        cur[idx] = fam;
        writeLevel(L, cur);
    };
    const addSecond = (L: number) => writeLevel(L, [...familiesOf(L), mainFamily]);
    const removeSecond = (L: number) => writeLevel(L, [familiesOf(L)[0]]);

    const levelPv = (fams: string[]): number =>
        fams.reduce((s, f) => s + (FAMILY_BASE_HP[f] ?? 0), 0) / fams.length;

    const rows = Array.from({ length: level - 1 }, (_, i) => i + 2); // niveaux 2..level

    return (
        <details className="glass-panel p-3 rounded-xl border-white/5 bg-stone-900/10">
            <summary className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] cursor-pointer">
                PV par niveau (hybride)
            </summary>
            <div className="mt-3 space-y-1.5">
                {rows.map(L => {
                    const fams = familiesOf(L);
                    const pv = levelPv(fams);
                    const isDefault = fams.length === 1 && fams[0] === mainFamily;
                    return (
                        <div key={L} className="flex items-center gap-2 text-xs">
                            <span className="w-12 text-stone-500 font-mono">Niv {L}</span>
                            {fams.map((f, idx) => (
                                <select key={idx}
                                    className={`bg-stone-950/40 border border-stone-800 rounded px-1.5 py-0.5 text-xs ${isDefault ? 'text-stone-500' : 'text-stone-200'}`}
                                    value={f}
                                    onChange={e => setFamily(L, idx, e.target.value)}>
                                    {FAMILIES.map(fam => <option key={fam} value={fam}>{FAMILY_LABELS[fam]}</option>)}
                                </select>
                            ))}
                            {fams.length === 1 ? (
                                <button onClick={() => addSecond(L)} className="text-stone-500 hover:text-primary-400" title="Deuxième famille (niveau mixte)">+</button>
                            ) : (
                                <button onClick={() => removeSecond(L)} className="text-stone-500 hover:text-red-400" title="Retirer la deuxième famille">−</button>
                            )}
                            <span className="ml-auto text-stone-400 font-mono">{Number.isInteger(pv) ? pv : `${pv}`} PV{Number.isInteger(pv) ? '' : ' (½)'}</span>
                        </div>
                    );
                })}
            </div>
        </details>
    );
};
```

- [ ] **Step 2 : Intégrer dans `CharacterSheet.tsx`**

Importer le composant : `import { HpByLevelEditor } from '../components/character/HpByLevelEditor';`

Récupérer `mainFamily` dans la déstructuration du hook (`… maxHp, mainFamily, …`).

Rendre le composant juste après `<MainStatsPanel … />` (colonne de gauche) :

```tsx
                    <HpByLevelEditor character={character} setCharacter={setCharacter} mainFamily={mainFamily} />
```

- [ ] **Step 3 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 4 : Commit**

```bash
git add app/src/components/character/HpByLevelEditor.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): éditeur de familles de PV par niveau (profils hybrides)"
```

---

### Task 4 : Gate d'intégration

**Files:** aucun (vérification).

- [ ] **Step 1 : Type-check + tests unitaires**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.

- [ ] **Step 2 : Lint (pas de nouvelle erreur)**

Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3`
Expected: ≤ baseline (~133), 0 nouvelle.

- [ ] **Step 3 : E2E de non-régression fiche**

Run: `bash scripts/e2e.sh e2e/character-sheet.spec.ts` puis `bash scripts/e2e.sh e2e/character-voies.spec.ts`
Expected: PASS (la fiche rend, l'éditeur PV par niveau n'introduit pas de régression). Réessayer une fois en cas de flake réseau.

- [ ] **Step 4 : Vérification fidélité (manuelle, facultative)**

Les exemples chiffrés du livre sont couverts par les tests unitaires de la Task 1 ; aucun test e2e chiffré supplémentaire requis.

## Definition of Done

- `computeHybridMaxHp` reproduit les 3 exemples du livre (combattant+mage = 4 ; arrondi alterné 3 puis 4 ; peuple+mage) et est à parité avec `computeMaxHp` en mono-famille.
- `playState.hpByLevel: Record<string, string[]>` remplace `hpFamilyByLevel` ; `computeMaxHpByLevel` retiré.
- Le hook dérive `maxHp` via `computeHybridMaxHp` et expose `mainFamily`.
- `HpByLevelEditor` permet d'annoter la/les famille(s) par niveau, replié par défaut, sans persister de valeur dérivée.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

Second sous-projet (**UI légères**, cadrage dédié) : langues (éditeur + emplacements/illettrisme), RP étendu (`rp.secret`/`rp.notes`), talent secondaire, âge/taille/poids bornés par le peuple, monnaie po/pc, affichage enrichi des dérivés. Puis Phase 5 (mécaniques spéciales).
