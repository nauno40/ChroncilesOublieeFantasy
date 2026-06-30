# CharacterSheet Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the ~2109-line `CharacterSheet.tsx` god component into pure COF2 rules functions (unit-tested), data/state hooks, and focused presentational components, with behavior preserved.

**Architecture:** Orchestrator + prop-drilling. `CharacterSheet` owns all state via custom hooks and passes data to presentational section components via props. The COF2 math moves to React-free pure functions in `utils/cofRules.ts` covered by Vitest. API loading and form/derived state move to `hooks/`.

**Tech Stack:** React 19, TypeScript, Vite 7, Vitest (new), Tailwind v4.

## Global Constraints

- No behavior change — this is a structural refactor only.
- Do NOT replace `any` types with real interfaces (out of scope).
- No new global state library or context; Context stays reserved for auth.
- Follow existing conventions: pure helpers in `src/utils/`, hooks in `src/hooks/`, components under `src/components/`.
- After every task: `npm run build` (runs `tsc -b && vite build`) and `npm run lint` must pass. Run all commands from `app/`.
- Commit after every task.

---

## File structure

```
app/src/utils/cofRules.ts          NEW  pure COF2 math (no React imports)
app/src/utils/cofRules.test.ts     NEW  Vitest unit tests
app/src/hooks/useCharacterData.ts  NEW  API loads (races/profiles/weapons/armors/voies/prestige)
app/src/hooks/useCharacterSheet.ts NEW  form state + derived values + sync effects
app/src/components/character/
  CharacterToolbar.tsx             NEW
  AttributesPanel.tsx              NEW
  MainStatsPanel.tsx               NEW
  IdentityBlock.tsx                NEW
  RoleplaySection.tsx              NEW
  ProtectionSection.tsx            NEW
  WeaponsSection.tsx               NEW
  InventorySection.tsx             NEW
  VoiesTree.tsx                    NEW
app/src/pages/CharacterSheet.tsx   MODIFY  becomes ~200-300 line orchestrator
app/vitest.config.ts               NEW
app/package.json                   MODIFY  add vitest devDeps + scripts
```

---

## Task 1: Add Vitest infrastructure

**Files:**
- Modify: `app/package.json`
- Create: `app/vitest.config.ts`
- Create: `app/src/utils/cofRules.test.ts` (temporary smoke test, replaced in Task 2)

**Interfaces:**
- Produces: `npm run test` (watch) and `npm run test:run` (single run) scripts.

- [ ] **Step 1: Install Vitest**

Run (from `app/`):
```bash
npm install -D vitest@^3
```

- [ ] **Step 2: Create `app/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Add scripts to `app/package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Create a temporary smoke test `app/src/utils/cofRules.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('vitest wiring', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test to verify the runner works**

Run: `npm run test:run`
Expected: 1 passed.

- [ ] **Step 6: Verify build + lint still pass**

Run: `npm run build && npm run lint`
Expected: both succeed (Vitest config and test file must not break `tsc -b`).

- [ ] **Step 7: Commit**

```bash
git add app/package.json app/package-lock.json app/vitest.config.ts app/src/utils/cofRules.test.ts
git commit -m "test: add Vitest infrastructure for frontend unit tests"
```

---

## Task 2: Extract core modifier/HP/armor helpers into cofRules.ts

These move verbatim from the top of `CharacterSheet.tsx` (`calculateMod` line 12, `PROFILE_FAMILIES` lines 46-61, `getMaxArmorDef` lines 63-75) plus the modifier-object and HP formulas (lines 214-222, 257).

**Files:**
- Create: `app/src/utils/cofRules.ts`
- Modify: `app/src/utils/cofRules.test.ts` (replace smoke test)

**Interfaces:**
- Produces:
  - `type Stats = { FOR: number; AGI: number; CON: number; INT: number; PER: number; CHA: number; VOL: number }`
  - `calculateMod(value: number): number`
  - `PROFILE_FAMILIES: Record<string, { id: string; die: string; base: number }>`
  - `getMaxArmorDef(profileName: string): number`
  - `computeModifiers(stats: Stats): Stats`
  - `computeMaxHp(baseHp: number, conMod: number): number`

- [ ] **Step 1: Write failing tests in `app/src/utils/cofRules.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import {
  calculateMod,
  getMaxArmorDef,
  computeModifiers,
  computeMaxHp,
} from './cofRules';

describe('calculateMod', () => {
  it('is 0 at 10 and 11', () => {
    expect(calculateMod(10)).toBe(0);
    expect(calculateMod(11)).toBe(0);
  });
  it('handles positive and negative', () => {
    expect(calculateMod(14)).toBe(2);
    expect(calculateMod(13)).toBe(1);
    expect(calculateMod(8)).toBe(-1);
    expect(calculateMod(7)).toBe(-2);
  });
});

describe('getMaxArmorDef', () => {
  it('returns the documented caps by profile', () => {
    expect(getMaxArmorDef('Magicien')).toBe(0);
    expect(getMaxArmorDef('Voleur')).toBe(3);
    expect(getMaxArmorDef('Chevalier')).toBe(8);
    expect(getMaxArmorDef('Guerrier')).toBe(4);
    expect(getMaxArmorDef('Druide')).toBe(3); // default
  });
});

describe('computeModifiers', () => {
  it('maps each stat through calculateMod', () => {
    const mods = computeModifiers({ FOR: 14, AGI: 10, CON: 12, INT: 8, PER: 11, CHA: 7, VOL: 16 });
    expect(mods).toEqual({ FOR: 2, AGI: 0, CON: 1, INT: -1, PER: 0, CHA: -2, VOL: 3 });
  });
});

describe('computeMaxHp', () => {
  it('is baseHp*2 + conMod', () => {
    expect(computeMaxHp(6, 2)).toBe(14);
    expect(computeMaxHp(3, -1)).toBe(5);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run`
Expected: FAIL — cannot resolve `./cofRules`.

- [ ] **Step 3: Create `app/src/utils/cofRules.ts`**

```ts
export type Stats = {
  FOR: number; AGI: number; CON: number; INT: number; PER: number; CHA: number; VOL: number;
};

export const calculateMod = (value: number): number => Math.floor((value - 10) / 2);

export const PROFILE_FAMILIES: Record<string, { id: string; die: string; base: number }> = {
  Arquebusier: { id: 'aventuriers', die: 'd8', base: 2 },
  Barde: { id: 'aventuriers', die: 'd8', base: 2 },
  Rôdeur: { id: 'aventuriers', die: 'd8', base: 2 },
  Voleur: { id: 'aventuriers', die: 'd8', base: 2 },
  Barbare: { id: 'combattants', die: 'd10', base: 2 },
  Chevalier: { id: 'combattants', die: 'd10', base: 2 },
  Guerrier: { id: 'combattants', die: 'd10', base: 2 },
  Ensorceleur: { id: 'mages', die: 'd6', base: 2 },
  Forgesort: { id: 'mages', die: 'd6', base: 2 },
  Magicien: { id: 'mages', die: 'd6', base: 2 },
  Sorcier: { id: 'mages', die: 'd6', base: 2 },
  Druide: { id: 'mystiques', die: 'd8', base: 3 },
  Moine: { id: 'mystiques', die: 'd8', base: 3 },
  Prêtre: { id: 'mystiques', die: 'd8', base: 3 },
};

export const getMaxArmorDef = (profileName: string): number => {
  if (['Magicien', 'Ensorceleur', 'Forgesort', 'Sorcier'].includes(profileName)) return 0;
  if (['Voleur', 'Rôdeur', 'Barde', 'Barbare'].includes(profileName)) return 3;
  if (profileName === 'Chevalier') return 8;
  if (['Guerrier', 'Prêtre'].includes(profileName)) return 4;
  return 3;
};

export const computeModifiers = (stats: Stats): Stats => ({
  FOR: calculateMod(stats.FOR),
  AGI: calculateMod(stats.AGI),
  CON: calculateMod(stats.CON),
  INT: calculateMod(stats.INT),
  PER: calculateMod(stats.PER),
  CHA: calculateMod(stats.CHA),
  VOL: calculateMod(stats.VOL),
});

export const computeMaxHp = (baseHp: number, conMod: number): number => baseHp * 2 + conMod;
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:run`
Expected: all pass.

- [ ] **Step 5: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed (cofRules.ts is not yet imported by the component — that happens in Task 6).

- [ ] **Step 6: Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): extract modifier/armor/HP helpers with tests"
```

---

## Task 3: Add recovery-die and luck-points functions

Logic from `recoveryDieString` (lines 641-652) and `luckPoints` (lines 655-673).

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Modify: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `PROFILE_FAMILIES` (Task 2).
- Produces:
  - `computeRecoveryDie(profileName: string | undefined, conMod: number): string`
  - `computeLuckPoints(profileName: string | undefined, chaMod: number, racialVoie?: { name?: string; ranks?: boolean[] }): number`

- [ ] **Step 1: Add failing tests**

```ts
import { computeRecoveryDie, computeLuckPoints } from './cofRules';

describe('computeRecoveryDie', () => {
  it('is "(base + conMod) die" for a known profile', () => {
    expect(computeRecoveryDie('Guerrier', 2)).toBe('4 d10'); // combattants base 2
    expect(computeRecoveryDie('Magicien', 0)).toBe('2 d6');  // mages base 2
  });
  it('clamps quantity at 0', () => {
    expect(computeRecoveryDie('Magicien', -3)).toBe('0 d6');
  });
  it('returns "—" for unknown/empty profile', () => {
    expect(computeRecoveryDie(undefined, 2)).toBe('—');
    expect(computeRecoveryDie('Inconnu', 2)).toBe('—');
  });
});

describe('computeLuckPoints', () => {
  it('is 2 + chaMod', () => {
    expect(computeLuckPoints('Magicien', 0)).toBe(2);
    expect(computeLuckPoints('Magicien', 1)).toBe(3);
  });
  it('adds +1 for the aventuriers family', () => {
    expect(computeLuckPoints('Barde', 1)).toBe(4); // 2 + 1 + 1
  });
  it('adds +1 for Voie de l\'humain rank 1', () => {
    expect(computeLuckPoints('Magicien', 0, { name: "Voie de l'humain", ranks: [true] })).toBe(3);
  });
  it('clamps below 1 to 0', () => {
    expect(computeLuckPoints('Magicien', -2)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement in `cofRules.ts`**

```ts
export const computeRecoveryDie = (profileName: string | undefined, conMod: number): string => {
  if (!profileName) return '—';
  const family = PROFILE_FAMILIES[profileName];
  if (!family) return '—';
  let qty = family.base + conMod;
  if (qty < 0) qty = 0;
  return `${qty} ${family.die}`;
};

export const computeLuckPoints = (
  profileName: string | undefined,
  chaMod: number,
  racialVoie?: { name?: string; ranks?: boolean[] },
): number => {
  let pc = 2 + chaMod;
  if (pc < 1) pc = 0;
  if (profileName && PROFILE_FAMILIES[profileName]?.id === 'aventuriers') pc += 1;
  if (racialVoie && racialVoie.name === "Voie de l'humain" && racialVoie.ranks?.[0]) pc += 1;
  return pc;
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:run`
Expected: all pass.

- [ ] **Step 5: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): add recovery-die and luck-points functions with tests"
```

---

## Task 4: Add final-stats and spent-points functions

Logic from `finalStats` (lines 596-637) and `spentPoints` (lines 346-386).

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Modify: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `Stats` (Task 2).
- Produces:
  - `computeFinalStats(baseStats: Stats, raceModifiers: any[] | undefined, racialBonusChoices: Record<string, string>): Stats`
  - `computeSpentPoints(voies: any, level: number | undefined, isMageFamily: boolean): number`

- [ ] **Step 1: Add failing tests**

```ts
import { computeFinalStats, computeSpentPoints } from './cofRules';

const base = { FOR: 10, AGI: 10, CON: 10, INT: 10, PER: 10, CHA: 10, VOL: 10 };

describe('computeFinalStats', () => {
  it('returns base unchanged when there are no modifiers', () => {
    expect(computeFinalStats(base, undefined, {})).toEqual(base);
  });
  it('applies a fixed racial modifier', () => {
    const r = computeFinalStats(base, [{ type: 'fixed', stat: 'FOR', value: 2 }], {});
    expect(r.FOR).toBe(12);
  });
  it('applies a chosen modifier when the choice matches an option', () => {
    const mods = [{ type: 'choice', stat: null, value: 1, options: ['AGI', 'PER'] }];
    const r = computeFinalStats(base, mods, { bonus_0: 'AGI' });
    expect(r.AGI).toBe(11);
  });
  it('applies add_to_lowest choices by index', () => {
    const mods = [{ type: 'logic', logic: 'add_to_lowest', value: 1, count: 1 }];
    const r = computeFinalStats(base, mods, { bonus_0_0: 'INT' });
    expect(r.INT).toBe(11);
  });
});

describe('computeSpentPoints', () => {
  it('is 0 when level is not 0', () => {
    expect(computeSpentPoints({}, 1, false)).toBe(0);
  });
  it('gives a free rank 1 on the racial voie', () => {
    const voies = { racial: { name: 'X', ranks: [true, false, false, false, false] }, profile: [] };
    expect(computeSpentPoints(voies, 0, false)).toBe(0); // rank 1 is free
  });
  it('counts a second racial rank for a non-mage', () => {
    const voies = { racial: { name: 'X', ranks: [true, true, false, false, false] }, profile: [] };
    expect(computeSpentPoints(voies, 0, false)).toBe(1);
  });
  it('gives a mage a free rank 2 (once)', () => {
    const voies = { racial: { name: 'X', ranks: [true, true, false, false, false] }, profile: [] };
    expect(computeSpentPoints(voies, 0, true)).toBe(0);
  });
  it('counts profile ranks', () => {
    const voies = {
      racial: { name: 'X', ranks: [false, false, false, false, false] },
      profile: [{ name: 'P', ranks: [true, true, false, false, false] }],
    };
    expect(computeSpentPoints(voies, 0, false)).toBe(2);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement in `cofRules.ts`** (ported verbatim from the source useMemos)

```ts
export const computeFinalStats = (
  baseStats: Stats,
  raceModifiers: any[] | undefined,
  racialBonusChoices: Record<string, string>,
): Stats => {
  const base = { ...baseStats };
  if (!raceModifiers) return base;

  raceModifiers.forEach((mod: any, idx: number) => {
    if (mod.type === 'fixed' && mod.stat) {
      base[mod.stat as keyof Stats] = (base[mod.stat as keyof Stats] || 0) + mod.value;
    } else if (mod.type === 'choice' && mod.options) {
      const choice = racialBonusChoices[`bonus_${idx}`];
      if (choice && mod.options.includes(choice)) {
        base[choice as keyof Stats] = (base[choice as keyof Stats] || 0) + mod.value;
      }
    } else if ((mod.type === 'special' && mod.stat === 'Lowest') || (mod.type === 'logic' && mod.logic === 'add_to_lowest')) {
      const count = mod.count || 1;
      for (let i = 0; i < count; i++) {
        let choiceKey = `bonus_${idx}_${i}`;
        let choice = racialBonusChoices[choiceKey];
        if (!choice && i === 0) {
          choiceKey = `bonus_${idx}`;
          choice = racialBonusChoices[choiceKey];
        }
        if (choice) {
          base[choice as keyof Stats] = (base[choice as keyof Stats] || 0) + mod.value;
        }
      }
    }
  });
  return base;
};

export const computeSpentPoints = (voies: any, level: number | undefined, isMageFamily: boolean): number => {
  if (level !== 0) return 0;
  let count = 0;
  let mageRank2Found = false;

  if (voies?.racial?.ranks) {
    let racialRanks = voies.racial.ranks.filter(Boolean).length;
    if (voies.racial.ranks[0]) racialRanks = Math.max(0, racialRanks - 1);
    if (voies.racial.ranks[1] && isMageFamily && !mageRank2Found) {
      racialRanks = Math.max(0, racialRanks - 1);
      mageRank2Found = true;
    }
    count += racialRanks;
  }

  if (voies?.profile) {
    voies.profile.forEach((p: any) => {
      if (p.ranks) {
        let profileRanks = p.ranks.filter(Boolean).length;
        if (p.ranks[1] && isMageFamily && !mageRank2Found) {
          profileRanks = Math.max(0, profileRanks - 1);
          mageRank2Found = true;
        }
        count += profileRanks;
      }
    });
  }
  return count;
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:run`
Expected: all pass.

- [ ] **Step 5: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): add final-stats and spent-points functions with tests"
```

---

## Task 5: Add mana-points and combat-stats functions

Logic from `manaPoints` (lines 676-730) and `combatStats` (lines 804-854). These take the loaded `races`/`profiles` arrays so they stay pure (no fetching). `computeCombatStats` keeps its dependency on `CAPABILITY_MODIFIERS` by receiving it as a parameter, so `cofRules.ts` imports no React and no data module.

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Modify: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces:
  - `computeManaPoints(voies: any, races: any[], profiles: any[], volMod: number): number`
  - `computeCombatStats(args: { voies: any; protection: any; races: any[]; profiles: any[]; perMod: number; agiMod: number; capabilityModifiers: Record<string, (rank: number) => { init?: number; def?: number }> }): { init: number; def: number }`

- [ ] **Step 1: Add failing tests**

```ts
import { computeManaPoints, computeCombatStats } from './cofRules';

const spellRace = [{
  availableVoies: [{ name: 'Voie magique', capabilities: [{ rank: 1, isSpell: true }] }],
}];

describe('computeManaPoints', () => {
  it('is 0 when no spells are learned', () => {
    const voies = { racial: { name: 'Voie magique', ranks: [false] }, profile: [] };
    expect(computeManaPoints(voies, spellRace, [], 3)).toBe(0);
  });
  it('is volMod + spellCount when spells are learned', () => {
    const voies = { racial: { name: 'Voie magique', ranks: [true] }, profile: [] };
    expect(computeManaPoints(voies, spellRace, [], 3)).toBe(4); // 3 + 1
  });
});

describe('computeCombatStats', () => {
  it('is base 10 + mods + protection with no capability bonuses', () => {
    const r = computeCombatStats({
      voies: { racial: { name: '', ranks: [] }, profile: [] },
      protection: { armor: { def: 3 }, shield: { def: 1 } },
      races: [], profiles: [], perMod: 2, agiMod: 1, capabilityModifiers: {},
    });
    expect(r.init).toBe(12); // 10 + 2
    expect(r.def).toBe(15);  // 10 + 1 + 3 + 1
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:run`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement in `cofRules.ts`** (ported verbatim, `isSpell`/`applyBonus` inlined; `CAPABILITY_MODIFIERS` passed in)

```ts
export const computeManaPoints = (voies: any, races: any[], profiles: any[], volMod: number): number => {
  const isSpell = (voieName: string, rank: number): boolean => {
    for (const race of races) {
      const v = race.availableVoies?.find((x: any) => x.name === voieName);
      const cap = v?.capabilities?.find((c: any) => c.rank === rank);
      if (cap?.isSpell) return true;
    }
    for (const profile of profiles) {
      const v = profile.voies?.find((x: any) => x.name === voieName);
      const cap = v?.capabilities?.find((c: any) => c.rank === rank);
      if (cap?.isSpell) return true;
    }
    return false;
  };

  let spellCount = 0;
  if (voies?.racial) {
    voies.racial.ranks?.forEach((learned: boolean, idx: number) => {
      if (learned && isSpell(voies.racial.name || '', idx + 1)) spellCount++;
    });
  }
  voies?.profile?.forEach((v: any) => {
    v.ranks?.forEach((learned: boolean, idx: number) => {
      if (learned && isSpell(v.name, idx + 1)) spellCount++;
    });
  });

  return spellCount > 0 ? volMod + spellCount : 0;
};

export const computeCombatStats = (args: {
  voies: any;
  protection: any;
  races: any[];
  profiles: any[];
  perMod: number;
  agiMod: number;
  capabilityModifiers: Record<string, (rank: number) => { init?: number; def?: number }>;
}): { init: number; def: number } => {
  const { voies, protection, races, profiles, perMod, agiMod, capabilityModifiers } = args;
  let init = 10 + perMod;
  let def = 10 + agiMod + (protection?.armor?.def || 0) + (protection?.shield?.def || 0);

  const applyBonus = (voieName: string, subRanks: boolean[]) => {
    if (!voieName) return;
    subRanks.forEach((learned, idx) => {
      if (!learned) return;
      const rank = idx + 1;
      let capName = '';
      const race = races.find((r: any) => r.availableVoies?.some((v: any) => v.name === voieName));
      if (race) {
        const v = race.availableVoies.find((v: any) => v.name === voieName);
        const c = v?.capabilities?.find((c: any) => c.rank === rank);
        if (c) capName = c.name;
      }
      if (!capName) {
        const profile = profiles.find((p: any) => p.voies?.some((v: any) => v.name === voieName));
        if (profile) {
          const v = profile.voies.find((v: any) => v.name === voieName);
          const c = v?.capabilities?.find((c: any) => c.rank === rank);
          if (c) capName = c.name;
        }
      }
      if (capName && capabilityModifiers[capName]) {
        const bonus = capabilityModifiers[capName](rank);
        if (bonus.init) init += bonus.init;
        if (bonus.def) def += bonus.def;
      }
    });
  };

  if (voies?.racial?.name && voies.racial.ranks) applyBonus(voies.racial.name, voies.racial.ranks);
  voies?.profile?.forEach((v: any) => {
    if (v.name && v.ranks) applyBonus(v.name, v.ranks);
  });

  return { init, def };
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm run test:run`
Expected: all pass.

- [ ] **Step 5: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): add mana-points and combat-stats functions with tests"
```

---

## Task 6: Rewire CharacterSheet to use cofRules

Replace the inline logic in `CharacterSheet.tsx` with calls to the now-tested pure functions. No new behavior. The component keeps the same `useMemo` wrappers; only their bodies change.

**Files:**
- Modify: `app/src/pages/CharacterSheet.tsx`

**Interfaces:**
- Consumes: everything exported from `cofRules.ts` (Tasks 2-5).

- [ ] **Step 1: Add the import at the top of `CharacterSheet.tsx`**

```ts
import {
  calculateMod,
  getMaxArmorDef,
  PROFILE_FAMILIES,
  computeModifiers,
  computeMaxHp,
  computeRecoveryDie,
  computeLuckPoints,
  computeFinalStats,
  computeSpentPoints,
  computeManaPoints,
  computeCombatStats,
} from '../utils/cofRules';
```

- [ ] **Step 2: Delete the now-duplicated module-level declarations**

Remove from `CharacterSheet.tsx`: `calculateMod` (line 12), `PROFILE_FAMILIES` (lines 46-61), and `getMaxArmorDef` (lines 63-75). They are now imported.

- [ ] **Step 3: Replace each useMemo body with a call to the matching function**

- `mods` → `useMemo(() => computeModifiers(stats), [stats])`
- `spentPoints` → `useMemo(() => computeSpentPoints(character.data?.voies, character.level, isMageFamily), [character.data, character.level, isMageFamily])`
- `finalStats` → `useMemo(() => { const selectedRace = races.find(r => (r.name || r.nom) === character.race || r['@id'] === character.race); return computeFinalStats(stats, selectedRace?.modifiers, racialBonusChoices); }, [stats, character.race, races, racialBonusChoices])`
- `recoveryDieString` → resolve `profileName` as before, then `computeRecoveryDie(profileName, mods.CON)`
- `luckPoints` → resolve `profileName`, then `computeLuckPoints(profileName, mods.CHA, character.data?.voies?.racial)`
- `manaPoints` → `useMemo(() => computeManaPoints(character.data?.voies, races, profiles, mods.VOL), [character.data?.voies, races, profiles, mods.VOL])`
- `combatStats` → `useMemo(() => computeCombatStats({ voies: character.data?.voies, protection: character.data?.protection, races, profiles, perMod: mods.PER, agiMod: mods.AGI, capabilityModifiers: CAPABILITY_MODIFIERS }), [mods.PER, mods.AGI, character.data?.protection, character.data?.voies, races, profiles])`
- In the HP effect (lines 255-257), replace `const maxHp = (baseHp * 2) + conMod;` with `const maxHp = computeMaxHp(baseHp, mods.CON);`
- Replace any `getMaxArmorDef(...)` call sites — they now resolve to the import (no code change needed).

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed. There should be no remaining local definitions of the extracted helpers.

- [ ] **Step 5: Run unit tests (unchanged, still green)**

Run: `npm run test:run`
Expected: all pass.

- [ ] **Step 6: Manual smoke test**

Run the app, log in, open `/characters/new`, pick a race and profile, set stats, toggle a couple of voie ranks, add an armor. Confirm HP/DEF/Init/Luck/Mana/Recovery values match what they were before (compare against current `master` behavior). Save and reload.

- [ ] **Step 7: Commit**

```bash
git add app/src/pages/CharacterSheet.tsx
git commit -m "refactor(CharacterSheet): use cofRules pure functions for all calculations"
```

---

## Task 7: Extract useCharacterData hook

Move the two data-loading effects (the equipment/voies/prestige fetch at lines 133-184 and the races/profiles fetch portion at lines 188-194) into a hook. The character-loading branch (lines 196-209, which depends on `id`/`isNew`/`navigate` and sets `character`/`loading`) stays in the component for now and moves to `useCharacterSheet` in Task 8.

**Files:**
- Create: `app/src/hooks/useCharacterData.ts`
- Modify: `app/src/pages/CharacterSheet.tsx`

**Interfaces:**
- Produces: `useCharacterData(): { races: any[]; profiles: any[]; allWeapons: any[]; allArmors: any[]; allVoies: any[]; prestigePaths: any[] }`

- [ ] **Step 1: Create `app/src/hooks/useCharacterData.ts`**

Move into it: the `races`, `profiles`, `allWeapons`, `allArmors`, `allVoies`, `prestigePaths` `useState` declarations; the equipment/voies fetch effect (current lines 133-184); and a `races`/`profiles` fetch effect containing only the two lines that call `ApiService.getAll('races')`/`('profiles')`. Return all six arrays. Header:

```ts
import { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

export const useCharacterData = () => {
  const [races, setRaces] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allWeapons, setAllWeapons] = useState<any[]>([]);
  const [allArmors, setAllArmors] = useState<any[]>([]);
  const [allVoies, setAllVoies] = useState<any[]>([]);
  const [prestigePaths, setPrestigePaths] = useState<any[]>([]);

  // (paste the equipment/voies fetch effect here, verbatim)
  // (paste a races+profiles fetch effect here)

  return { races, profiles, allWeapons, allArmors, allVoies, prestigePaths };
};
```

- [ ] **Step 2: Wire it into `CharacterSheet.tsx`**

Remove the moved `useState`s and effects from the component. Near the top of the component body add:
```ts
const { races, profiles, allWeapons, allArmors, allVoies, prestigePaths } = useCharacterData();
```
Keep the character-loading effect (lines 196-209) in the component.

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed.

- [ ] **Step 4: Manual smoke test**

Reload `/characters/new`: race/profile dropdowns populate, weapons/armors selectable, voies render.

- [ ] **Step 5: Commit**

```bash
git add app/src/hooks/useCharacterData.ts app/src/pages/CharacterSheet.tsx
git commit -m "refactor(CharacterSheet): extract useCharacterData hook"
```

---

## Task 8: Extract useCharacterSheet hook

Move the form/selection state, the derived `useMemo` wrappers (now thin, from Task 6), and all the sync effects into one hook. This is the largest and riskiest move — copy the effect bodies verbatim, do not restructure them.

**Files:**
- Create: `app/src/hooks/useCharacterSheet.ts`
- Modify: `app/src/pages/CharacterSheet.tsx`

**Interfaces:**
- Consumes: `useCharacterData` output (Task 7), `cofRules` (Tasks 2-5).
- Produces: `useCharacterSheet(data): { character, setCharacter, loading, saving, stats, mods, finalStats, combatStats, recoveryDieString, luckPoints, manaPoints, spentPoints, maxStartingPoints, selectedVoies, setSelectedVoies, selectedProfileType, setSelectedProfileType, racialBonusChoices, setRacialBonusChoices, racialVoieOptions, isMageFamily, mageReplacedRaceVoie, setMageReplacedRaceVoie, showPrestigeSelector, setShowPrestigeSelector, showEquipmentModal, setShowEquipmentModal, equipmentChoiceQueue, setEquipmentChoiceQueue, currentChoiceIndex, setCurrentChoiceIndex, handleSave, updateStat, getCapabilityName, addEquipmentItem }`
  where `data` is the object returned by `useCharacterData` plus `{ id, isNew, navigate }`.

- [ ] **Step 1: Create the hook**

Create `app/src/hooks/useCharacterSheet.ts` accepting `{ races, profiles, allVoies, id, isNew, navigate }`. Move into it, verbatim: `defaultData`, `ADVENTURER_PACK`, all the form/selection `useState`s (lines 80-109), `profileValues`, the character-loading effect, every derived `useMemo` (the Task-6 versions), every sync `useEffect` (mods→modifiers, HP, racial-voie auto-select, mage reset, the ~200-line voie sync 389-466, luck/recovery/mana/combat syncs), and the handlers `handleSave`, `updateStat`, `getCapabilityName`, `addEquipmentItem`. Return the object listed in Interfaces.

- [ ] **Step 2: Reduce `CharacterSheet.tsx` to consume the hook**

```ts
const { id } = useParams<{ id: string }>();
const navigate = useNavigate();
const isNew = !id;
const data = useCharacterData();
const sheet = useCharacterSheet({ ...data, id, isNew, navigate });
```
Update all JSX references to read from `sheet.*` and `data.*`. The JSX tree is unchanged otherwise.

- [ ] **Step 3: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: both succeed. Watch for `react-hooks/exhaustive-deps` lint: preserve the exact dependency arrays from the original effects.

- [ ] **Step 4: Run unit tests**

Run: `npm run test:run`
Expected: all pass.

- [ ] **Step 5: Manual smoke test (thorough)**

Create a character end-to-end: race/profile, stats, voie ranks (including a mage to exercise the free-rank-2 path), equipment, save, reload, edit, save again. Confirm every derived value and the voie sync behave as before.

- [ ] **Step 6: Commit**

```bash
git add app/src/hooks/useCharacterSheet.ts app/src/pages/CharacterSheet.tsx
git commit -m "refactor(CharacterSheet): extract useCharacterSheet state/effects hook"
```

---

## Tasks 9-17: Extract presentational components (one per section)

Each task follows the **same pattern** (shown in full for Task 9; later tasks reuse it exactly):

1. Create `app/src/components/character/<Name>.tsx` exporting a typed function component.
2. Define its `Props` as the exact set of `sheet.*`/`data.*` values and callbacks the JSX block reads.
3. Cut the JSX block from `CharacterSheet.tsx` (exact source line range below) and paste it as the component's return value, replacing local identifiers with `props.*`.
4. In `CharacterSheet.tsx`, render `<Name ...props />` in place of the cut block.
5. `npm run build && npm run lint` (both pass), then manual smoke of that section.
6. Commit: `refactor(CharacterSheet): extract <Name> component`.

Section → source line range (from current `master`):

| Task | Component | Source lines |
|------|-----------|--------------|
| 9  | `CharacterToolbar.tsx`  | 876-919 (header/toolbar) |
| 10 | `AttributesPanel.tsx`   | 925-1132 (Caractéristiques + profile + racial choice) |
| 11 | `MainStatsPanel.tsx`    | 1133-1238 (HP/DEF/Init/Luck/Mana/Recovery/Attacks) |
| 12 | `IdentityBlock.tsx`     | 1242-1368 |
| 13 | `RoleplaySection.tsx`   | 1369-1391 |
| 14 | `ProtectionSection.tsx` | 1392-1469 |
| 15 | `WeaponsSection.tsx`    | 1470-1566 |
| 16 | `InventorySection.tsx`  | 1567-1580 |
| 17 | `VoiesTree.tsx`         | 1581-2079 (racial + profile + prestige trees) |

### Task 9 (worked example): CharacterToolbar

**Files:**
- Create: `app/src/components/character/CharacterToolbar.tsx`
- Modify: `app/src/pages/CharacterSheet.tsx`

**Interfaces:**
- Produces: `CharacterToolbar(props: { name: string; saving: boolean; isNew: boolean; onSave: () => void; onBack: () => void; onDelete: () => void })`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { Save, ChevronLeft, Trash2 } from 'lucide-react';

interface Props {
  name: string;
  saving: boolean;
  isNew: boolean;
  onSave: () => void;
  onBack: () => void;
  onDelete: () => void;
}

export const CharacterToolbar: React.FC<Props> = ({ name, saving, isNew, onSave, onBack, onDelete }) => {
  // Paste the toolbar JSX (source lines 876-919) here, replacing:
  //   character.name -> name, saving -> saving, handleSave -> onSave,
  //   navigation/delete handlers -> onBack / onDelete.
  return (/* toolbar JSX */);
};
```

- [ ] **Step 2: Render it in `CharacterSheet.tsx`** in place of lines 876-919:

```tsx
<CharacterToolbar
  name={sheet.character.name || ''}
  saving={sheet.saving}
  isNew={isNew}
  onSave={sheet.handleSave}
  onBack={() => navigate('/characters')}
  onDelete={/* existing delete handler */}
/>
```

- [ ] **Step 3: Verify build + lint** — `npm run build && npm run lint` (both pass).
- [ ] **Step 4: Manual smoke** — toolbar renders; Save/Back/Delete work.
- [ ] **Step 5: Commit** — `git commit -m "refactor(CharacterSheet): extract CharacterToolbar component"`.

> Tasks 10-17 repeat Steps 1-5 with the component name, source line range, and prop set for that section. Derive each `Props` set by listing the `sheet.*`/`data.*` identifiers the cut JSX references; pass them down explicitly. For `VoiesTree` (Task 17), if the file exceeds ~300 lines, additionally extract a `CapabilityNode` subcomponent for the repeated rank-node markup before committing.

---

## Task 18: Final verification and cleanup

**Files:**
- Modify: `app/src/pages/CharacterSheet.tsx` (cleanup only)

- [ ] **Step 1: Confirm the orchestrator is lean**

`CharacterSheet.tsx` should now be ~200-300 lines: hooks wiring + the section components in layout. Remove any leftover unused imports.

- [ ] **Step 2: Full check**

Run: `npm run build && npm run lint && npm run test:run`
Expected: all succeed.

- [ ] **Step 3: End-to-end manual smoke**

Log in → create a character (non-mage and mage) → set stats, voies, equipment → save → reload → edit → save. Confirm full parity with pre-refactor behavior.

- [ ] **Step 4: Commit any cleanup**

```bash
git add app/src/pages/CharacterSheet.tsx
git commit -m "refactor(CharacterSheet): clean up orchestrator imports"
```

- [ ] **Step 5: Update docs**

In `doc/etat_des_lieux/frontend.md`, update the §9 / §10 notes that describe `CharacterSheet.tsx` as a 2109-line monolith to reflect the new structure (orchestrator + `cofRules` + hooks + `components/character/`). Commit: `docs: update frontend état des lieux after CharacterSheet refactor`.

---

## Self-review notes

- **Spec coverage:** Vitest infra (T1); pure-function extraction + tests (T2-5); rewire (T6); `useCharacterData` (T7); `useCharacterSheet` incl. the risky voie-sync effect kept whole (T8); per-section components (T9-17); verification gates after every task and a final end-to-end smoke (T18). All spec sections map to tasks.
- **Behavior preservation:** effects and the voie-sync block are moved verbatim with unchanged dependency arrays; pure functions are ported line-for-line and locked by tests before the component is rewired.
- **`any` types:** retained throughout, per the spec non-goal.
