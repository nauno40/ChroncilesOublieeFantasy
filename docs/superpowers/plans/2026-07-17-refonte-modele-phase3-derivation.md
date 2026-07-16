# Refonte du modèle — Phase 3 (dérivation `cofRules`) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter le moteur de dérivation `cofRules.ts` pour couvrir le contrat §5 de la spec (PV cumulés par niveau + hybride, attaques plafonnées, langues, réduction de dommages) et poser l'interpréteur d'effets `resolveCapabilityEffect` (§6), avec pour cible la reproduction exacte des PJ prétirés du livre (Lhagva, Ionas).

**Architecture :** La fiche ne stocke que des entrées (`caracs`/`playState`/`characterVoies`) ; toutes les valeurs de jeu sont **calculées** dans `cofRules.ts` (fonctions pures, testées unitairement) et affichées via le hook. Phase 3 ajoute les dérivations manquantes et l'interpréteur d'effets structurés (`Capability.effect`), en peuplant le **seul cas universel** — le dé évolutif `Nd4°` (déjà auto-détecté en Phase 1). La structuration numérique des `bonuses` capacité par capacité reste incrémentale (post-Phase 3). Prérequis backend : exposer `Capability.effect` dans les groupes de lecture.

**Tech Stack :** Backend Symfony 7.4 + API Platform 4.2 (PHP 8.3) ; Frontend React 19 + TypeScript + Vite. Validation front : `docker compose exec -T frontend npx tsc -b` (0 erreur), `docker compose exec -T frontend npx vitest run`, `docker compose exec -T frontend npm run lint`. Backend : `docker compose exec -T backend bin/phpunit`. E2E : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` — §5 (contrat de dérivation), §6 (capacités évolutives & effets), §8 (corrections compendium). Phase 2 mergée (PR #33) : `caracs`/`playState`/`characterVoies`, dérivés non stockés, voies par IRI.

## Global Constraints

- **Aucune valeur dérivée persistée** : les nouvelles valeurs (PV par niveau, RD, langues, dé résolu) sont calculées et retournées, jamais écrites dans `playState`/BDD.
- **Fonctions pures + TDD** : chaque dérivation est une fonction pure de `cofRules.ts` avec test unitaire écrit d'abord (RED → GREEN).
- **Rétrocompatibilité des signatures existantes** : `computeMaxHp(baseHp, conMod)` doit continuer de passer ses tests actuels (nouveau paramètre `level` optionnel, défaut 1).
- **Baseline lint** : ~133 erreurs `no-explicit-any` pré-existantes (après Phase 2) ; gate = **0 nouvelle** (cf. mémoire `frontend-lint-baseline`).
- **Parité + fidélité** : les valeurs déjà justes au niveau 1 (Phase 2) le restent ; Phase 3 ajoute la justesse **multi-niveaux** et les valeurs manquantes. Cible chiffrée : PJ prétirés du livre exacts (§12 spec).
- **Non-objectif Phase 3** : structurer les `effect.bonuses` de toutes les capacités (incrémental, post-P3), l'UI dédiée (Phase 4), les mécaniques spéciales companions/états/usages (Phase 5). Ce qui n'est pas structuré reste affiché en prose.
- **`evolutiveDie(level)`** (seuils 6/9/12/15) existe déjà et est réutilisé tel quel.

## File Structure

- **`backend/src/Entity/Capability.php`** — ajoute `Capability.effect` aux groupes `race:read`/`profile:read`/`voie:read` (aujourd'hui non exposé → le front ne reçoit pas `evolutiveDie`).
- **`backend/src/DataFixtures/AppFixtures.php`** + **`backend/data/Profils/*.json`** — correction des 14 valeurs `armorMaxDef` vs règles (suivi post-P1) si l'audit révèle des écarts.
- **`app/src/utils/cofRules.ts`** — cœur : ajoute `computeMaxHp(…, level)`, `computeMaxHpByLevel`, `attackValue`, `computeLanguageSlots`, `resolveCapabilityEffect`, `aggregateResolvedBonuses`, `computeDamageReduction`. Types `CapabilityEffect`, `ResolvedEffect`, `BonusTarget`.
- **`app/src/utils/cofRules.test.ts`** — tests unitaires de chaque dérivation + cas chiffrés du livre multi-niveaux.
- **`app/src/types/character.ts`** — étend `CompendiumCapability` (côté cofRules) et, si besoin, le type des capacités pour porter `effect`.
- **`app/src/hooks/useCharacterSheet.ts`** — câble `maxHp` sur la formule par niveau (+ `hpFamilyByLevel`), expose `languageSlots`, `damageReduction`, et un résolveur d'effet pour l'affichage.
- **`app/src/components/character/MainStatsPanel.tsx`** — attaques plafonnées niveau 10 ; affiche RD si > 0.
- **`app/src/components/character/CapabilityNode.tsx`** (et/ou `DynamicDetailsRenderer.tsx`) — affiche le dé évolutif **résolu au niveau courant** (ex. « 2d8 ») au lieu de « 2d4° ».

---

### Task 1 : Backend — exposer `Capability.effect` en lecture

**Files:**
- Modify: `backend/src/Entity/Capability.php` (attribut `#[Groups]` sur `$effect`)
- Test: `backend/tests/Api/` (test API léger, ou vérification manuelle si aucun test capacité n'existe)

**Interfaces:**
- Produces: le champ `effect` (JSON) apparaît dans les capacités sérialisées via `voie:read`/`profile:read`/`race:read`, consommé côté front (Tasks 6-8).

Contexte : `Capability.effect` porte la structure `{ evolutiveDie: { count } }` (peuplée en Phase 1, 199 capacités) mais **n'est pas dans les groupes de lecture** — le front ne le reçoit pas. Sans ce champ, `resolveCapabilityEffect` n'a aucune donnée.

- [ ] **Step 1 : Ajouter le groupe de lecture**

Dans `backend/src/Entity/Capability.php`, sur la propriété `$effect` :

```php
    #[ORM\Column(nullable: true)]
    #[Groups(['race:read', 'profile:read', 'voie:read'])]
    private ?array $effect = null;
```

- [ ] **Step 2 : Vérifier l'exposition**

Run: `docker compose exec -T backend bin/console cache:clear` puis
`curl -s "http://localhost:8000/api/voies/2191" -H "Accept: application/ld+json" | python3 -c "import json,sys;c=json.load(sys.stdin)['capabilities'];print('effect' in c[0], [x.get('effect') for x in c if x.get('effect')][:2])"`
Expected: `True` et au moins un `{'evolutiveDie': {'count': N}}` visible sur une voie qui en contient (ex. essayer `/api/voies` d'un profil combattant).

- [ ] **Step 3 : Lancer la suite backend (non-régression sérialisation)**

Run: `docker compose exec -T backend bin/phpunit`
Expected: PASS (aucune régression ; `effect` en lecture seule n'affecte pas les tests d'autorisation).

- [ ] **Step 4 : Commit**

```bash
git add backend/src/Entity/Capability.php
git commit -m "feat(compendium): expose Capability.effect en lecture (dérivation front P3)"
```

---

### Task 2 : Backend — revérifier les 14 `armorMaxDef` vs règles (suivi post-P1)

**Files:**
- Modify (si écarts): `backend/src/DataFixtures/AppFixtures.php` (table `armorMaxDef` par profil)
- Test: `app/src/utils/cofRules.test.ts` (le test `getMaxArmorDef` existant fait déjà foi côté front — aligner si correction)

**Interfaces:**
- Produces: `Profile.armorMaxDef` correct pour les 14 profils (seuil de DEF d'armure la plus lourde autorisée), prérequis d'un calcul de DEF fidèle.

Contexte : la mémoire `audit-fidelite-regles-app` note `getMaxArmorDef` historiquement faux sur ~6 profils. Phase 1 a introduit `Profile.armorMaxDef` via une table par nom. Cette task **vérifie** ces 14 valeurs contre les règles avant que la DEF ne s'appuie dessus en Phase 3+.

- [ ] **Step 1 : Auditer les 14 valeurs contre les règles**

Consulter `doc/getRulesFullToMD/` (chapitres Profils + table « Armure »). Invoquer le skill `cof2-rules` si disponible. Dresser le tableau attendu (armure la plus lourde autorisée → DEF max) pour : Magicien, Ensorceleur, Sorcier, Moine, Forgesort, Voleur, Druide, Barde, Rôdeur, Barbare, Arquebusier, Prêtre, Guerrier, Chevalier. Comparer à la table `ARMOR_CAP_BY_PROFILE` de `app/src/utils/cofRules.ts` et à `AppFixtures.php`.

- [ ] **Step 2 : Corriger les écarts (si présents)**

Si un écart est confirmé par les règles : corriger la table dans `AppFixtures.php` **et** `ARMOR_CAP_BY_PROFILE`/le test `getMaxArmorDef` dans `cofRules.test.ts` (garder les deux sources cohérentes). Recharger : `docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction`.

- [ ] **Step 3 : Vérifier**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS (le test `getMaxArmorDef` reflète les valeurs validées).

- [ ] **Step 4 : Commit (seulement si correction)**

```bash
git add backend/src/DataFixtures/AppFixtures.php app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "fix(compendium): corrige les valeurs armorMaxDef vs règles COF2"
```

> Si l'audit ne révèle **aucun** écart : documenter la vérification dans le message de reprise / la mémoire et passer à la Task 3 sans commit.

---

### Task 3 : PV max cumulés par niveau (+ cas hybride)

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces:
  - `computeMaxHp(baseHp: number, conMod: number, level?: number): number` (level défaut 1)
  - `computeMaxHpByLevel(baseHpPerLevel: number[], conMod: number): number`

Formule (spec §5) : `PV = baseHp × (niveau + 1) + CON × niveau`. Cas hybride : chaque niveau peut être financé par une famille différente (`playState.hpFamilyByLevel`) → somme des `baseHp` choisis par niveau, la part CON restant dérivée/rétroactive.

- [ ] **Step 1 : Écrire les tests (RED)**

Ajouter à `cofRules.test.ts` :

```ts
describe('computeMaxHp par niveau', () => {
  it('niveau 1 = 2×base + CON (rétrocompat)', () => {
    expect(computeMaxHp(5, 2)).toBe(12);      // Lhagva niv.1 : combattants base 5, CON +2
    expect(computeMaxHp(6, 2)).toBe(14);
    expect(computeMaxHp(3, -1)).toBe(5);
  });
  it('cumule par niveau : base×(niveau+1) + CON×niveau', () => {
    expect(computeMaxHp(5, 2, 3)).toBe(5 * 4 + 2 * 3); // 26
    expect(computeMaxHp(3, 1, 5)).toBe(3 * 6 + 1 * 5); // 23
  });
  it('CON négatif reste rétroactif sur tous les niveaux', () => {
    expect(computeMaxHp(5, -1, 4)).toBe(5 * 5 - 1 * 4); // 21
  });
});

describe('computeMaxHpByLevel (hybride)', () => {
  it('somme les base par niveau + CON×niveau (famille uniforme = computeMaxHp)', () => {
    expect(computeMaxHpByLevel([5, 5, 5], 2)).toBe(computeMaxHp(5, 2, 3)); // 26
  });
  it('mélange de familles : niveaux 1-2 combattant (5), niveau 3 mage (3)', () => {
    // base initial (niv.1) = 5 ; puis (5+2) + (5+2) + (3+2) = 24 ; total 5 + ... -> voir formule
    // PV = baseHpPerLevel[0] + Σ(baseHpPerLevel[L] + CON) = 5 + (5+2)+(5+2)+(3+2) = 5+7+7+5 = 24
    expect(computeMaxHpByLevel([5, 5, 3], 2)).toBe(24);
  });
});
```

- [ ] **Step 2 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (signature `computeMaxHp` sans `level`, `computeMaxHpByLevel` absente).

- [ ] **Step 3 : Implémenter**

Remplacer `computeMaxHp` et ajouter `computeMaxHpByLevel` dans `cofRules.ts` :

```ts
// PV max cumulés par niveau (COF2, Progression) : baseHp × (niveau+1) + CON × niveau.
// (Au niveau 1 : 2×baseHp + CON — la base est comptée une fois « en plus ».)
export const computeMaxHp = (baseHp: number, conMod: number, level = 1): number =>
  baseHp * (Math.max(1, level) + 1) + conMod * Math.max(1, level);

// Cas hybride (spec §5) : baseHp financé par une famille différente par niveau.
// PV = baseHpPerLevel[0] + Σ(baseHpPerLevel[L] + CON), L de 0 à niveau-1.
export const computeMaxHpByLevel = (baseHpPerLevel: number[], conMod: number): number => {
  if (baseHpPerLevel.length === 0) return 0;
  const initial = baseHpPerLevel[0];
  return baseHpPerLevel.reduce((sum, base) => sum + base + conMod, initial);
};
```

- [ ] **Step 4 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS (existants inchangés + nouveaux).

- [ ] **Step 5 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): PV max cumulés par niveau + cas hybride (spec §5)"
```

---

### Task 4 : Valeur d'attaque plafonnée au niveau 10

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `attackValue(caracMod: number, level: number): number` — `min(level, 10) + caracMod`.

Spec §5 : « valeur de niveau **plafonnée à 10** ». Aujourd'hui `MainStatsPanel` calcule `mods.FOR + (character.level || 1)` sans plafond (Task 5 câble le helper).

- [ ] **Step 1 : Test (RED)**

```ts
describe('attackValue (niveau plafonné à 10)', () => {
  it('niveau + carac sous le plafond', () => {
    expect(attackValue(3, 1)).toBe(4);   // Lhagva : niv.1 + FOR 3
    expect(attackValue(-2, 1)).toBe(-1); // Ionas contact
    expect(attackValue(2, 10)).toBe(12);
  });
  it('plafonne la part de niveau à 10', () => {
    expect(attackValue(2, 12)).toBe(12); // min(12,10)=10 + 2
    expect(attackValue(0, 20)).toBe(10);
  });
});
```

- [ ] **Step 2 : Lancer — échoue** — `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts` → FAIL.

- [ ] **Step 3 : Implémenter**

```ts
// Valeur d'attaque COF2 : niveau (plafonné à 10) + caractéristique d'attaque
// (FOR au contact, AGI à distance, VOL/carac de magie en magie).
export const attackValue = (caracMod: number, level: number): number =>
  Math.min(Math.max(0, level), 10) + caracMod;
```

- [ ] **Step 4 : Lancer — passe** — même commande → PASS.

- [ ] **Step 5 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): valeur d'attaque plafonnée au niveau 10 (spec §5)"
```

---

### Task 5 : Langues dérivées de l'INT

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Produces: `computeLanguageSlots(intMod: number): { slots: number; illiterate: boolean }` — `slots = max(0, INT)`, `illiterate = INT < 0`.

Spec §5 : « +1 langue / point positif d'INT, illettré si INT < 0 ». Les noms des langues restent choisis par le joueur (`playState.languages`, UI Phase 4) ; Phase 3 dérive le **nombre d'emplacements** et l'illettrisme.

- [ ] **Step 1 : Test (RED)**

```ts
describe('computeLanguageSlots', () => {
  it('un emplacement de langue par point positif d\'INT', () => {
    expect(computeLanguageSlots(0)).toEqual({ slots: 0, illiterate: false });
    expect(computeLanguageSlots(2)).toEqual({ slots: 2, illiterate: false });
  });
  it('INT négatif : illettré, aucun emplacement', () => {
    expect(computeLanguageSlots(-1)).toEqual({ slots: 0, illiterate: true });
  });
});
```

- [ ] **Step 2 : Lancer — échoue** — `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts` → FAIL.

- [ ] **Step 3 : Implémenter**

```ts
// Langues (COF2, création) : +1 emplacement de langue par point positif d'INT ;
// personnage illettré si INT < 0. Les langues elles-mêmes sont choisies (playState).
export const computeLanguageSlots = (intMod: number): { slots: number; illiterate: boolean } => ({
  slots: Math.max(0, intMod),
  illiterate: intMod < 0,
});
```

- [ ] **Step 4 : Lancer — passe** — même commande → PASS.

- [ ] **Step 5 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): emplacements de langues dérivés de l'INT (spec §5)"
```

---

### Task 6 : Interpréteur d'effets `resolveCapabilityEffect` + agrégation (non-cumul)

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `evolutiveDie(level)` (existant), `Stats` (existant).
- Produces:
  - Types `BonusTarget = 'DM' | 'init' | 'def' | 'PVmax' | 'RD'`, `CapabilityBonus`, `CapabilityEffect`, `ResolvedEffect`.
  - `resolveCapabilityEffect(effect: CapabilityEffect | undefined, ctx: { level: number; rank: number; caracs: Stats }): ResolvedEffect`
  - `aggregateResolvedBonuses(resolved: ResolvedEffect[]): Partial<Record<BonusTarget, number>>`

Spec §6.1/§6.2 : structure `effect` taguée (`evolutiveDie`, `bonuses[]`) ; fonction pure résolvant le dé au niveau courant et les bonus (`fixed`/`rank`/`carac`). Règle de non-cumul (§6.2) appliquée à l'agrégation : un même couple (cible, caractéristique) ne compte qu'une fois.

- [ ] **Step 1 : Tests (RED)**

```ts
describe('resolveCapabilityEffect', () => {
  const caracs = { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 2 };

  it('résout le dé évolutif au niveau courant', () => {
    const r = resolveCapabilityEffect({ evolutiveDie: { count: 2 } }, { level: 9, rank: 1, caracs });
    expect(r.dice).toBe('2d8'); // d8 à partir du niveau 9
    expect(r.bonuses).toEqual({});
  });
  it('résout un bonus fixe, par rang et par caractéristique', () => {
    const effect = { bonuses: [
      { target: 'init' as const, scalesWith: 'fixed' as const, value: 3 },
      { target: 'DM' as const, scalesWith: 'rank' as const, perRank: 1 },
      { target: 'PVmax' as const, scalesWith: 'carac' as const, carac: 'FOR' as const },
    ] };
    const r = resolveCapabilityEffect(effect, { level: 1, rank: 3, caracs });
    expect(r.bonuses).toEqual({ init: 3, DM: 3, PVmax: 3 }); // rank 3 → DM 3 ; FOR 3
  });
  it('effect vide → aucun dé, aucun bonus', () => {
    expect(resolveCapabilityEffect(undefined, { level: 1, rank: 1, caracs })).toEqual({ bonuses: {} });
  });
});

describe('aggregateResolvedBonuses (non-cumul)', () => {
  it('somme les bonus fixes/rang de même cible', () => {
    const agg = aggregateResolvedBonuses([{ bonuses: { def: 1 } }, { bonuses: { def: 2 } }]);
    expect(agg.def).toBe(3);
  });
  it('ne compte pas deux fois la même caractéristique sur la même cible', () => {
    // deux capacités ajoutent +FOR aux DM : une seule application (non-cumul §6.2)
    const agg = aggregateResolvedBonuses([
      { bonuses: { DM: 3 }, caracTargets: [{ target: 'DM', carac: 'FOR', value: 3 }] },
      { bonuses: { DM: 3 }, caracTargets: [{ target: 'DM', carac: 'FOR', value: 3 }] },
    ]);
    expect(agg.DM).toBe(3);
  });
});
```

- [ ] **Step 2 : Lancer — échoue** — `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts` → FAIL (symboles absents).

- [ ] **Step 3 : Implémenter**

Ajouter à `cofRules.ts` :

```ts
export type BonusTarget = 'DM' | 'init' | 'def' | 'PVmax' | 'RD';
export interface CapabilityBonus {
  target: BonusTarget;
  scalesWith: 'fixed' | 'rank' | 'carac';
  value?: number;        // scalesWith 'fixed'
  perRank?: number;      // scalesWith 'rank'
  carac?: keyof Stats;   // scalesWith 'carac'
}
export interface CapabilityEffect {
  evolutiveDie?: { count: number };
  bonuses?: CapabilityBonus[];
}
export interface ResolvedEffect {
  dice?: string;
  bonuses: Partial<Record<BonusTarget, number>>;
  // Traçabilité des bonus liés à une carac, pour la déduplication non-cumul (§6.2).
  caracTargets?: { target: BonusTarget; carac: keyof Stats; value: number }[];
}

// Résout un effet structuré au niveau/rang courant (spec §6.2). Fonction pure.
export const resolveCapabilityEffect = (
  effect: CapabilityEffect | undefined,
  ctx: { level: number; rank: number; caracs: Stats },
): ResolvedEffect => {
  const out: ResolvedEffect = { bonuses: {} };
  if (!effect) return out;

  if (effect.evolutiveDie) {
    out.dice = `${effect.evolutiveDie.count}${evolutiveDie(ctx.level)}`;
  }
  const caracTargets: NonNullable<ResolvedEffect['caracTargets']> = [];
  (effect.bonuses ?? []).forEach((b) => {
    let val = 0;
    if (b.scalesWith === 'fixed') val = b.value ?? 0;
    else if (b.scalesWith === 'rank') val = (b.perRank ?? 0) * ctx.rank;
    else if (b.scalesWith === 'carac' && b.carac) {
      val = ctx.caracs[b.carac];
      caracTargets.push({ target: b.target, carac: b.carac, value: val });
    }
    out.bonuses[b.target] = (out.bonuses[b.target] ?? 0) + val;
  });
  if (caracTargets.length) out.caracTargets = caracTargets;
  return out;
};

// Agrège plusieurs effets résolus en appliquant le non-cumul (§6.2) : un même
// couple (cible, caractéristique) n'est compté qu'une fois (on garde la valeur).
export const aggregateResolvedBonuses = (
  resolved: ResolvedEffect[],
): Partial<Record<BonusTarget, number>> => {
  const seenCarac = new Set<string>();
  const agg: Partial<Record<BonusTarget, number>> = {};

  resolved.forEach((r) => {
    const caracByTarget = new Map<BonusTarget, number>();
    (r.caracTargets ?? []).forEach((ct) => {
      const key = `${ct.target}:${ct.carac}`;
      if (seenCarac.has(key)) {
        // déjà appliqué par une autre capacité → retirer ce doublon du total de r
        caracByTarget.set(ct.target, (caracByTarget.get(ct.target) ?? 0) + ct.value);
      } else {
        seenCarac.add(key);
      }
    });
    (Object.keys(r.bonuses) as BonusTarget[]).forEach((t) => {
      const dup = caracByTarget.get(t) ?? 0;
      agg[t] = (agg[t] ?? 0) + (r.bonuses[t] ?? 0) - dup;
    });
  });
  return agg;
};
```

- [ ] **Step 4 : Lancer — passe** — même commande → PASS.

- [ ] **Step 5 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): resolveCapabilityEffect + agrégation non-cumul (spec §6)"
```

---

### Task 7 : Réduction de dommages (RD) dérivée des capacités

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `resolveCapabilityEffect`, `aggregateResolvedBonuses` (Task 6), `CompendiumVoie`/`CompendiumCapability` (existant, étendre avec `effect`), `CharacterVoieRef` (types).
- Produces: `computeDamageReduction(voies: CharacterVoieRef[], races: CompendiumRace[], profiles: CompendiumProfile[], allVoies: CompendiumVoie[], caracs: Stats, level: number): number`.

Spec §5 : « somme des RD **fixes** issus des capacités/armure ». Les RD conditionnels restent en prose. Aujourd'hui aucune capacité ne porte de `bonus target 'RD'` structuré (peuplement incrémental) → la fonction renvoie 0 sur les données réelles ; le test valide la mécanique avec un effet synthétique.

- [ ] **Step 1 : Étendre `CompendiumCapability` avec `effect`**

Dans `cofRules.ts` :

```ts
export interface CompendiumCapability {
  name?: string; rank?: number; description?: string; isSpell?: boolean;
  effect?: CapabilityEffect;
}
```

- [ ] **Step 2 : Test (RED)**

```ts
describe('computeDamageReduction', () => {
  const caracs = { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 2 };
  it('somme les RD fixes des capacités acquises (rang atteint)', () => {
    const profiles = [{ name: 'Barbare', voies: [{
      '@id': '/api/voies/700', name: 'Voie de la Résistance',
      capabilities: [{ rank: 3, name: 'Peau d\'acier', effect: { bonuses: [{ target: 'RD', scalesWith: 'fixed', value: 3 }] } }],
    }] }];
    const voies = [{ voie: '/api/voies/700', rank: 3, source: 'profil' as const }];
    expect(computeDamageReduction(voies, [], profiles, [], caracs, 3)).toBe(3);
  });
  it('ignore les rangs non atteints', () => {
    const profiles = [{ name: 'Barbare', voies: [{
      '@id': '/api/voies/700', name: 'V',
      capabilities: [{ rank: 3, effect: { bonuses: [{ target: 'RD', scalesWith: 'fixed', value: 3 }] } }],
    }] }];
    const voies = [{ voie: '/api/voies/700', rank: 2, source: 'profil' as const }];
    expect(computeDamageReduction(voies, [], profiles, [], caracs, 3)).toBe(0);
  });
});
```

- [ ] **Step 3 : Lancer — échoue** — `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts` → FAIL.

- [ ] **Step 4 : Implémenter**

```ts
// Réduction de dommages (RD) : somme des bonus fixes target 'RD' des capacités
// acquises (rang ≤ rang de la voie). Les RD conditionnels restent en prose (§5).
export const computeDamageReduction = (
  voies: CharacterVoieRef[],
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
  caracs: Stats,
  level: number,
): number => {
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  const resolved: ResolvedEffect[] = [];
  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank && c.effect) {
        resolved.push(resolveCapabilityEffect(c.effect, { level, rank: entry.rank, caracs }));
      }
    });
  });
  return aggregateResolvedBonuses(resolved).RD ?? 0;
};
```

- [ ] **Step 5 : Lancer — passe** — même commande → PASS.

- [ ] **Step 6 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts
git commit -m "feat(cofRules): réduction de dommages (RD) fixe dérivée des capacités (spec §5)"
```

---

### Task 8 : Câblage hook + affichage (PV par niveau, attaques cap 10, RD, dé résolu)

**Files:**
- Modify: `app/src/hooks/useCharacterSheet.ts`, `app/src/components/character/MainStatsPanel.tsx`, `app/src/components/character/CapabilityNode.tsx`
- Modify: `app/src/pages/CharacterSheet.tsx` (transmettre `damageReduction` à `MainStatsPanel`)

**Interfaces:**
- Consumes: `computeMaxHp(…, level)`, `attackValue`, `computeDamageReduction`, `computeLanguageSlots`, `resolveCapabilityEffect` (Tasks 3-7).
- Produces: le hook expose `maxHp` (par niveau), `damageReduction`, `languageSlots`, et un helper `resolveCapabilityDice(voieIri, rank)` pour l'affichage du dé résolu.

- [ ] **Step 1 : Hook — PV par niveau + nouvelles dérivations**

Dans `useCharacterSheet.ts`, remplacer le calcul de `maxHp` pour passer le niveau et gérer `hpFamilyByLevel` :

```ts
const maxHp = useMemo(() => {
    const baseHp = (selectedProfile as any)?.stats?.hpPerLevel
        || (selectedProfile as any)?.hpPerLevel
        || (selectedProfile as any)?.class?.stats?.hpPerLevel;
    if (!baseHp) return playState.hp?.current || 0;
    const level = character.level || 1;
    const familyByLevel = playState.hpFamilyByLevel;
    if (familyByLevel && Object.keys(familyByLevel).length > 0) {
        // Cas hybride : baseHp par niveau selon la famille choisie (défaut = profil).
        const perLevel = Array.from({ length: Math.max(1, level) }, (_, i) => {
            const fam = familyByLevel[String(i + 1)];
            return fam ? (FAMILY_BASE_HP[fam] ?? baseHp) : baseHp;
        });
        return computeMaxHpByLevel(perLevel, mods.CON);
    }
    return computeMaxHp(baseHp, mods.CON, level);
}, [selectedProfile, mods.CON, character.level, playState.hp?.current, playState.hpFamilyByLevel]);

const damageReduction = useMemo(
    () => computeDamageReduction(characterVoies, races, profiles, allVoies, mods, character.level || 1),
    [characterVoies, races, profiles, allVoies, mods, character.level],
);
const languageSlots = useMemo(() => computeLanguageSlots(mods.INT), [mods.INT]);
```

Ajouter la table `FAMILY_BASE_HP` dans `cofRules.ts` (base de PV par famille, COF2) et l'exporter :

```ts
// Base de PV par famille (COF2) : aventuriers/combattants/mages = 2, mystiques = 3.
export const FAMILY_BASE_HP: Record<string, number> = {
  aventuriers: 2, combattants: 2, mages: 2, mystiques: 3,
};
```

Exposer `maxHp`, `damageReduction`, `languageSlots` dans le retour du hook. Ajouter un helper (nommé `getResolvedDice`) et le retourner :

```ts
const getResolvedDice = (voieIri: string, rank: number): string | undefined => {
    const cap = resolveVoieByIri(voieIri)?.capabilities?.find((c: any) => c.rank === rank);
    return resolveCapabilityEffect(cap?.effect, { level: character.level || 1, rank, caracs: mods }).dice;
};
```
Importer `computeMaxHpByLevel`, `computeDamageReduction`, `computeLanguageSlots`, `resolveCapabilityEffect`, `attackValue`, `FAMILY_BASE_HP` depuis `cofRules`.

- [ ] **Step 2 : `MainStatsPanel` — attaques plafonnées + RD**

Remplacer `mods.FOR + (character.level || 1)` par `attackValue(mods.FOR, character.level || 1)` et `mods.AGI + (character.level || 1)` par `attackValue(mods.AGI, character.level || 1)` (importer `attackValue`). Ajouter une nouvelle prop `damageReduction: number` et l'afficher (badge « RD {damageReduction} ») **uniquement si > 0**. Passer la prop depuis `CharacterSheet.tsx`.

- [ ] **Step 3 : `CapabilityNode` — dé évolutif résolu**

`CapabilityNode` reçoit déjà `cap` (nom + description). Ajouter une prop optionnelle `resolvedDice?: string` et, si présente, l'afficher à côté du nom de la capacité (ex. petit badge « 2d8 »). Dans `VoiesTree.tsx`, calculer `resolvedDice={getResolvedDice(iri, rk)}` pour chaque nœud (racial, profil, prestige) en passant le helper `getResolvedDice` du hook via props (ajouter `getResolvedDice` aux props de `VoiesTree` et au type dérivé `components/character/types.ts`, transmis depuis `CharacterSheet`). Le dé n'apparaît que pour les capacités portant `effect.evolutiveDie`.

- [ ] **Step 4 : Vérifier le build + tests + lint**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npx vitest run` → tout vert.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → pas d'augmentation vs baseline (~133).

- [ ] **Step 5 : Commit**

```bash
git add app/src/hooks/useCharacterSheet.ts app/src/components/character/MainStatsPanel.tsx app/src/components/character/CapabilityNode.tsx app/src/components/character/VoiesTree.tsx app/src/pages/CharacterSheet.tsx app/src/utils/cofRules.ts
git commit -m "feat(character): câble PV par niveau, attaques cap 10, RD et dé évolutif résolu"
```

---

### Task 9 : Gate d'intégration — reproduction des PJ prétirés + validation complète

**Files:**
- Test: `app/src/utils/cofRules.test.ts` (cas chiffrés multi-niveaux)
- Vérification: tsc / vitest / lint / e2e

**Interfaces:** aucune nouvelle — validation de bout en bout.

Spec §12 : « Une fiche de niveau 1 reproduit exactement les PJ prétirés (Lhagva, Ionas) sur toutes les valeurs dérivées (PV, DEF, Init, PC, PM, DR, attaques). »

- [ ] **Step 1 : Test d'intégration chiffré (le livre fait foi)**

Étendre le bloc « exemples du livre » de `cofRules.test.ts` pour couvrir explicitement, via les nouvelles fonctions, Lhagva (barbare niv.1) et Ionas (ensorceleur niv.1) : `computeMaxHp` (niveau 1), `computeRecoveryDie` (nb DR + dé), `computeLuckPoints`, `attackValue` (contact/distance/magie), et vérifier qu'un **niveau 3** de barbare donne le PV cumulé attendu par la formule (`5×4 + 2×3 = 26`). (Reprendre les valeurs déjà présentes et compléter avec `attackValue` et le PV multi-niveaux.)

- [ ] **Step 2 : Suite unitaire complète**

Run: `docker compose exec -T frontend npx vitest run`
Expected: tout vert.

- [ ] **Step 3 : Type-check + lint**

Run: `docker compose exec -T frontend npx tsc -b` → 0 erreur.
Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -3` → 0 nouvelle erreur vs baseline (~133).

- [ ] **Step 4 : E2E de non-régression fiche**

Run: `bash scripts/e2e.sh e2e/character-voies.spec.ts` et `bash scripts/e2e.sh e2e/character-sheet.spec.ts`
Expected: PASS (la fiche rend, les voies et les valeurs dérivées s'affichent). Réessayer une fois en cas de flake réseau.

- [ ] **Step 5 : Commit final**

```bash
git add app/src/utils/cofRules.test.ts
git commit -m "test(cofRules): reproduction chiffrée des PJ prétirés + PV multi-niveaux (spec §12)"
```

## Definition of Done (Phase 3)

- `Capability.effect` exposé en lecture ; le front reçoit `evolutiveDie`.
- PV max **cumulés par niveau** (+ cas hybride `hpFamilyByLevel`), rétroactifs sur CON.
- Attaques plafonnées au niveau 10 ; langues dérivées de l'INT ; RD fixe dérivée.
- `resolveCapabilityEffect` + agrégation non-cumul en place et testés ; dé évolutif affiché **résolu au niveau courant**.
- Cible §12 atteinte : Lhagva & Ionas reproduits exactement (PV, DEF, Init, PC, PM, DR, attaques) ; un exemple multi-niveaux validé.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.

## Suite

**Post-Phase 3 (incrémental) :** structurer les `effect.bonuses` numériques capacité par capacité (migrer progressivement `CAPABILITY_MODIFIERS` vers `effect`), réconcilier `Profile.magicStat`/`Family.manaStat` (§8), structurer `weaponsAuth` (catégoriel). **Phase 4** : UI dédiée (édition des langues, talent secondaire, âge/taille/poids, choix de famille de PV par niveau, affichage RD/valeurs évolutives enrichi). **Phase 5** : mécaniques spéciales (companions, activeStates, usage, caracSubstitution, choices) — schéma déjà réservé (§7).
