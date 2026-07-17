# Système de repos COF2 — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter les deux actions de repos COF2 (récupération rapide / complète) qui restaurent PV/PM/DR et réinitialisent les usages, comme aide de table.

**Architecture :** Frontend seul (aucun changement de modèle — `hp`/`mana`/`recovery`/`usages` existent). Helpers purs (`recoveryDice`, `shortRestHeal`, `applyShortRest`, `applyLongRest`) qui portent la logique testable ; le jet de DR (aléatoire) reste dans l'UI ; `RestPanel` applique les transitions et mute `playState`. Réutilise `resetUsages`.

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-18-systeme-repos-design.md`.

## Global Constraints

- **Frontend uniquement** — aucune migration ; aucun nouveau champ (réutilise `hp`/`mana`/`recovery`/`usages`).
- **Les PC ne sont pas touchés** par le repos.
- Repos court **bloqué** si aucun DR disponible ; soin plafonné aux PV max.
- **Transitions d'état pures et testées** ; le jet aléatoire reste dans l'UI.
- **Aucune valeur dérivée persistée** (les repos écrivent des `current`/`used`, qui sont de l'état de jeu).
- **Baseline lint** ~133 ; gate = **0 nouvelle**, aucun nouveau `any`.

## File Structure

- **`app/src/utils/cofRules.ts`** + **`.test.ts`** — 4 helpers de repos (Task 1).
- **`app/src/hooks/useCharacterSheet.ts`** — expose `recoveryInfo` (Task 2).
- **`app/src/components/character/RestPanel.tsx`** — nouveau (Task 2).
- **`app/src/pages/CharacterSheet.tsx`** — intègre le panneau (Task 2).

---

### Task 1 : Helpers de repos (TDD)

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `recoveryDice(profileName, conMod): { total; sides }` ; `shortRestHeal(dieRoll, level): number` ; `applyShortRest(ps, { heal, maxHp, drTotal }): PlayState` ; `applyLongRest(ps, { maxHp, maxMana }): PlayState`.

- [ ] **Step 1 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` (importer `recoveryDice, shortRestHeal, applyShortRest, applyLongRest` depuis `./cofRules`) :

```ts
describe('recoveryDice', () => {
  it('total = base de famille + CON ; sides du dé', () => {
    expect(recoveryDice('Guerrier', 2)).toEqual({ total: 4, sides: 10 }); // combattants base 2, d10
    expect(recoveryDice('Magicien', 0)).toEqual({ total: 2, sides: 6 });  // mages base 2, d6
    expect(recoveryDice('Druide', 1)).toEqual({ total: 4, sides: 8 });    // mystiques base 3, d8
  });
  it('borne le total à 0 ; profil inconnu → 0/0', () => {
    expect(recoveryDice('Magicien', -5)).toEqual({ total: 0, sides: 6 });
    expect(recoveryDice('Inconnu', 2)).toEqual({ total: 0, sides: 0 });
    expect(recoveryDice(undefined, 2)).toEqual({ total: 0, sides: 0 });
  });
});

describe('shortRestHeal', () => {
  it('dé de récup. + ½ niveau (arrondi inférieur)', () => {
    expect(shortRestHeal(6, 4)).toBe(8);   // 6 + 2
    expect(shortRestHeal(3, 1)).toBe(3);   // 3 + 0
    expect(shortRestHeal(5, 7)).toBe(8);   // 5 + 3
  });
});

describe('applyShortRest', () => {
  const ps = {
    hp: { current: 5 }, mana: { current: 1 }, luck: { current: 2 }, recovery: { used: 0 },
    money: { pa: 0 }, equipment: [], rp: { ideal: '', flaw: '' }, languages: [],
    protection: { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } }, weapons: [],
    usages: [
      { name: 'A', max: 1, used: 1, per: 'combat' as const },
      { name: 'B', max: 1, used: 1, per: 'jour' as const },
    ],
  };
  it('soigne plafonné, dépense 1 DR plafonné, reset usages combat/round', () => {
    const r = applyShortRest(ps, { heal: 100, maxHp: 12, drTotal: 4 });
    expect(r.hp.current).toBe(12);        // plafonné à maxHp
    expect(r.recovery.used).toBe(1);      // +1
    expect(r.usages![0].used).toBe(0);    // combat remis à 0
    expect(r.usages![1].used).toBe(1);    // jour intact
    expect(r.mana.current).toBe(1);       // PM inchangés
    expect(r.luck.current).toBe(2);       // PC inchangés
  });
  it('ne dépasse pas le total de DR', () => {
    const r = applyShortRest({ ...ps, recovery: { used: 4 } }, { heal: 1, maxHp: 12, drTotal: 4 });
    expect(r.recovery.used).toBe(4);
  });
});

describe('applyLongRest', () => {
  const ps = {
    hp: { current: 3 }, mana: { current: 0 }, luck: { current: 1 }, recovery: { used: 3 },
    money: { pa: 0 }, equipment: [], rp: { ideal: '', flaw: '' }, languages: [],
    protection: { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } }, weapons: [],
    usages: [{ name: 'B', max: 1, used: 1, per: 'jour' as const }],
  };
  it('PV/PM au max, DR régénérés, usages jour/combat/round reset, PC intacts', () => {
    const r = applyLongRest(ps, { maxHp: 14, maxMana: 5 });
    expect(r.hp.current).toBe(14);
    expect(r.mana.current).toBe(5);
    expect(r.recovery.used).toBe(0);
    expect(r.usages![0].used).toBe(0);
    expect(r.luck.current).toBe(1);       // PC inchangés
  });
});
```

- [ ] **Step 2 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (fonctions absentes).

- [ ] **Step 3 : Implémenter**

Dans `app/src/utils/cofRules.ts`, étendre l'import existant depuis `../types/character` pour ajouter `PlayState`. Puis ajouter (`resetUsages` et `PROFILE_FAMILIES` existent déjà dans ce fichier) :

```ts
// Nombre de dés de récupération (DR) et faces du dé, dérivés du profil (COF2).
export const recoveryDice = (
  profileName: string | undefined,
  conMod: number,
): { total: number; sides: number } => {
  const family = profileName ? PROFILE_FAMILIES[profileName] : undefined;
  if (!family) return { total: 0, sides: 0 };
  return { total: Math.max(0, family.base + conMod), sides: parseInt(family.die.slice(1), 10) || 0 };
};

// Soin d'un repos court : dé de récup. lancé + ½ niveau (arrondi inférieur).
export const shortRestHeal = (dieRoll: number, level: number): number =>
  dieRoll + Math.floor((level || 0) / 2);

// Applique un repos court : soigne (plafonné maxHp), dépense 1 DR (plafonné total),
// réinitialise les usages combat/round. Pur.
export const applyShortRest = (
  ps: PlayState,
  opts: { heal: number; maxHp: number; drTotal: number },
): PlayState => ({
  ...ps,
  hp: { ...ps.hp, current: Math.min(opts.maxHp, ps.hp.current + opts.heal) },
  recovery: { ...ps.recovery, used: Math.min(opts.drTotal, (ps.recovery.used || 0) + 1) },
  usages: resetUsages(ps.usages, ['combat', 'round']),
});

// Applique un repos long : PV & PM au max, DR régénérés, usages jour/combat/round reset. Pur.
export const applyLongRest = (
  ps: PlayState,
  opts: { maxHp: number; maxMana: number },
): PlayState => ({
  ...ps,
  hp: { ...ps.hp, current: opts.maxHp },
  mana: { ...ps.mana, current: opts.maxMana },
  recovery: { ...ps.recovery, used: 0 },
  usages: resetUsages(ps.usages, ['jour', 'combat', 'round']),
});
```

- [ ] **Step 4 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS. Puis `docker compose exec -T frontend npx tsc -b` → 0 erreur.

- [ ] **Step 5 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): helpers de repos (recoveryDice, shortRestHeal, apply*Rest)"
```

---

### Task 2 : Hook `recoveryInfo` + `RestPanel`

**Files:**
- Modify: `app/src/hooks/useCharacterSheet.ts`, `app/src/pages/CharacterSheet.tsx`
- Create: `app/src/components/character/RestPanel.tsx`

**Interfaces:**
- Consumes: `recoveryDice`, `shortRestHeal`, `applyShortRest`, `applyLongRest` (Task 1).
- Produces: le hook expose `recoveryInfo: { total; sides }`.

- [ ] **Step 1 : Hook — exposer `recoveryInfo`**

Dans `useCharacterSheet.ts`, ajouter `recoveryDice` à l'import depuis `../utils/cofRules`. Près des autres dérivations (après `recoveryDieString`), ajouter :

```ts
    const recoveryInfo = recoveryDice(profileName, mods.CON);
```

et l'ajouter à l'objet retourné (à côté de `recoveryDieString`) : `recoveryInfo,`.

- [ ] **Step 2 : Créer `RestPanel.tsx`**

Créer `app/src/components/character/RestPanel.tsx` :

```tsx
import React, { useState } from 'react';
import type { Character } from '../../types/character';
import { shortRestHeal, applyShortRest, applyLongRest } from '../../utils/cofRules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    maxHp: number;
    maxMana: number;
    recovery: { total: number; sides: number };
}

/**
 * Actions de repos COF2 (§4.3) — aide de table. Repos court : dépense 1 DR, soigne
 * (dé + ½ niveau) plafonné ; repos long : PV/PM au max, DR régénérés. Réinitialise les
 * usages (via applyShortRest/applyLongRest). Ne touche pas les PC.
 */
export const RestPanel: React.FC<Props> = ({ character, setCharacter, maxHp, maxMana, recovery }) => {
    const [last, setLast] = useState<string | null>(null);
    const used = character.playState?.recovery?.used ?? 0;
    const drLeft = Math.max(0, recovery.total - used);
    const level = character.level ?? 0;

    const shortRest = () => {
        if (!character.playState) return;
        if (drLeft <= 0 || recovery.sides <= 0) { setLast('Aucun dé de récupération disponible.'); return; }
        const roll = Math.floor(Math.random() * recovery.sides) + 1;
        const heal = shortRestHeal(roll, level);
        setCharacter(prev => ({ ...prev, playState: applyShortRest(prev.playState!, { heal, maxHp, drTotal: recovery.total }) }));
        setLast(`Repos court : +${heal} PV (d${recovery.sides} : ${roll}), 1 DR dépensé.`);
    };
    const longRest = () => {
        if (!character.playState) return;
        setCharacter(prev => ({ ...prev, playState: applyLongRest(prev.playState!, { maxHp, maxMana }) }));
        setLast('Repos long : PV & PM au max, DR régénérés, usages réinitialisés.');
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Repos</h3>
                <span className="text-[10px] font-mono text-stone-400">DR : {drLeft} / {recovery.total}</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={shortRest}
                    disabled={drLeft <= 0}
                    className="flex-1 text-[10px] uppercase font-bold px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-green-500/50 hover:text-green-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >Repos court</button>
                <button
                    onClick={longRest}
                    className="flex-1 text-[10px] uppercase font-bold px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-primary-500/50 hover:text-primary-300 transition-all"
                >Repos long</button>
            </div>
            {last && <div className="text-[11px] text-stone-400 italic">{last}</div>}
        </div>
    );
};
```

- [ ] **Step 3 : Intégrer dans `CharacterSheet.tsx`**

Importer : `import { RestPanel } from '../components/character/RestPanel';`

Récupérer `recoveryInfo` dans la déstructuration du hook (à côté de `maxHp`, `manaPoints`). Rendre `<RestPanel character={character} setCharacter={setCharacter} maxHp={maxHp} maxMana={manaPoints} recovery={recoveryInfo} />` après `<TransformationPanel … />` (colonne équipement).

- [ ] **Step 4 : Vérifier**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas de nouvelle erreur vs baseline (~133).

- [ ] **Step 5 : Commit**

```bash
git add app/src/hooks/useCharacterSheet.ts app/src/components/character/RestPanel.tsx app/src/pages/CharacterSheet.tsx
git commit -m "feat(character): panneau de repos (récup rapide/complète)"
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

- `recoveryDice`, `shortRestHeal`, `applyShortRest`, `applyLongRest` testés (soin plafonné, DR plafonné, usages combat/round vs jour, PC intacts).
- Le hook expose `recoveryInfo` ; `RestPanel` : repos court (bloqué sans DR, jet + soin) et repos long (PV/PM max, DR régénérés).
- Aucune valeur dérivée persistée ; PC non touchés.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

Dernière mécanique Phase 5 : capacités à choix (#6, compendium-driven). Incrémental : indicateur « 0 PV / inconscient », « 1/jour » du repos long, structuration des `effect.*`.
