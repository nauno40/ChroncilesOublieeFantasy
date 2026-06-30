# CharacterSheet refactor — design

**Date:** 2026-06-30
**Component:** `app/src/pages/CharacterSheet.tsx` (~2109 lines)

## Context

`CharacterSheet.tsx` is the largest file in the codebase and a classic "god
component": it mixes API data-fetching, the COF2 rules engine (stat modifiers,
HP/mana/luck, recovery die, combat stats, voie/capability point-spending), and a
~1240-line JSX view, with `any` types throughout. It is flagged for refactoring
in `doc/etat_des_lieux/roadmap.md`. The size makes it hard to read, hard to
modify safely, and impossible to unit-test.

The frontend currently has **no tests** (Playwright is configured but unused),
so the rules math is unverified.

## Goals

- Split the god component into focused, single-purpose units (components, hooks,
  pure functions) following existing project conventions.
- Extract the COF2 rules math into pure, React-free functions and **unit-test
  them** (introduce Vitest).
- Preserve behavior exactly — this is a structural refactor, not a feature or
  behavior change.

## Non-goals

- No replacement of `any` types with real interfaces (deferred — would enlarge
  the diff and risk behavior drift).
- No visual/UX changes.
- No state-management library or new global context (the app uses Context only
  for auth; this refactor keeps that convention).

## Approach

**Orchestrator + prop-drilling.** `CharacterSheet` retains ownership of all
state through custom hooks and passes data down to presentational section
components via props. This matches the codebase (local state + props elsewhere;
Context reserved for auth). A `CharacterSheetContext` was considered and rejected
as inconsistent indirection.

## Target structure

Follows existing conventions: pure helpers in `src/utils/`, hooks in
`src/hooks/`, components grouped under `src/components/`.

```
src/utils/cofRules.ts            pure COF2 math (no React) — UNIT TESTED
src/utils/cofRules.test.ts       Vitest, co-located

src/hooks/useCharacterData.ts    API loads (races/profiles/weapons/armors/voies/prestige)
src/hooks/useCharacterSheet.ts   form state + derived values + the voie-sync effect

src/components/character/
  CharacterToolbar.tsx           header: back / save / delete
  AttributesPanel.tsx            stats inputs + profile selection + racial choice
  MainStatsPanel.tsx             HP / DEF / Init / Luck / Mana / Recovery / Attacks
  IdentityBlock.tsx
  RoleplaySection.tsx
  ProtectionSection.tsx
  WeaponsSection.tsx
  InventorySection.tsx
  VoiesTree.tsx                  racial + profile + prestige (may split a CapabilityNode)

src/pages/CharacterSheet.tsx     orchestrator (~200–300 lines)
```

## What moves where

**To `cofRules.ts` (pure, unit-tested):** the module-level `getMaxArmorDef`, and
the logic currently inside the `useMemo`s — `mods` (ability modifiers),
`finalStats` (base stats + racial bonuses), `recoveryDieString`, `luckPoints`,
`manaPoints`, `combatStats` (attack/defense/initiative), `spentPoints` (voie
points), and `getCapabilityName`. Each becomes a pure function taking explicit
inputs and returning a value. The hook's `useMemo`s become one-line wrappers
that call these functions (preserving memoization).

**To `useCharacterData.ts`:** the API-loading effects that populate `races`,
`profiles`, `allWeapons`, `allArmors`, `allVoies`, `prestigePaths`.

**To `useCharacterSheet.ts`:** the `character` form state and related selection
state (`selectedVoies`, `selectedProfileType`, `racialBonusChoices`,
`mageReplacedRaceVoie`, etc.), the memo wrappers over `cofRules`, and the
~200-line voie/capability sync effect (lines ~389–596). This imperative effect
is the riskiest part and is kept as one cohesive unit so its behavior is
preserved rather than scattered.

**To `components/character/*`:** each JSX block becomes its matching
presentational component, receiving everything it needs via props (no data
fetching, no domain math inside views).

## Testing

Introduce **Vitest** (natural fit with Vite 7): add as a devDependency, add
config, and add `test` / `test:run` npm scripts. Unit tests in
`cofRules.test.ts` cover: ability modifiers, final stats with racial bonuses,
recovery die string, luck points, mana points, combat stats, spent-points, and
armor caps — using a few representative race/profile combinations.

## Verification

The component/JSX extraction is not covered by the unit tests, so after **each
extraction step**: `npm run build` (runs `tsc -b` then `vite build`) and
`npm run lint` must pass. At the **end**: run the app, log in, create a new
character (pick race/profile, set stats, add voies, equip), save, reload, and
confirm the rendered sheet matches pre-refactor behavior.

## Sequencing (each step compiles & lints green)

1. Add Vitest infra (devDependency, config, scripts).
2. Extract pure functions into `cofRules.ts` + write tests; rewire the existing
   `useMemo`s to call them.
3. Extract `useCharacterData`, then `useCharacterSheet`.
4. Extract presentational components one section at a time: toolbar → attributes
   → main stats → identity → roleplay → protection → weapons → inventory →
   voies.
5. Final manual smoke test.

## Risks

- **The voie-sync effect** (~200 lines, imperative, mutates `character.data`
  based on selected voies) is where behavior drift is most likely. Mitigation:
  move it wholesale into one hook without restructuring its internals.
- **No component-level tests:** UI parity relies on `tsc`/lint + manual smoke.
  Accepted per scope; a Playwright smoke test was considered and deferred.
- **`any` types remain**, so the compiler offers limited protection during
  extraction. Mitigation: small steps, build+lint after each.
