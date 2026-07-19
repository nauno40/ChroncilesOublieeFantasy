# Plafond d'armure piloté par les données & conscient des capacités — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le plafond de DEF d'armure devient piloté par `Profile.armorMaxDef` (donnée) et relevé par les capacités acquises (`effect.armorCap`), au lieu d'un `Record` codé en dur.

**Architecture:** (1) type `effect.armorCap` + `Profile.armorMaxDef` (front) + fonction pure `resolveArmorCap` (TDD) ; (2) câblage hook `armorCap` → `ProtectionSection`, suppression de `getMaxArmorDef` ; (3) données backend `ARMOR_CAP_BY_CAPABILITY` (fixtures).

**Tech Stack:** React 19 + TypeScript (Vitest), Symfony 7.4 / PHP 8.3, Docker Compose.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-07-19-def-capacite-consciente-design.md`.
- `resolveArmorCap` calque `computeDamageReduction` (`app/src/utils/cofRules.ts`) : même construction `byIri` (races + profiles + allVoies), même garde d'acquisition `c.rank >= 1 && c.rank <= entry.rank`, évaluation au rang courant de la voie.
- `-1` = aucune armure : préservé tant qu'aucune capacité acquise ne relève le plafond.
- Périmètre : seule la capacité **inconditionnelle** « Autorité naturelle » (Chevalier, → 7) est peuplée. Guerrier « Armure lourde » (conditionnel au choix) est **hors périmètre** (chantier #6). Ne pas l'ajouter.
- Le calcul de DEF (`computeCombatStats`) n'est **pas** modifié (pas de clamp d'armure ; le filtre du menu suffit).
- Commentaires en français.
- Gates (tous verts) : `docker compose exec -T frontend npx tsc -b` (0) ; `docker compose exec -T frontend npx vitest run` ; `docker compose exec -T frontend npm run lint` (0 **nouvelle** erreur, aucun nouveau `any` ; baseline pré-existante ~131 `no-explicit-any` tolérée).

---

### Task 1 : Types `effect.armorCap` / `Profile.armorMaxDef` + `resolveArmorCap` (TDD)

**Files:**
- Modify: `app/src/utils/cofRules.ts` (interface `CapabilityEffect` ~243-246 ; nouvelle fonction `resolveArmorCap`)
- Modify: `app/src/types/normalized.ts` (interface `Profile`)
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `CharacterVoieRef`, `CompendiumRace/Profile/Voie` (déjà internes à cofRules), `CapabilityEffect`.
- Produces: `resolveArmorCap(voies, races, profiles, allVoies, baseArmorMaxDef): number` ; `CapabilityEffect.armorCap?: number` ; `Profile.armorMaxDef?: number | null`.

Note : cette tâche **n'enlève pas encore** `getMaxArmorDef` (encore utilisé par `ProtectionSection`) — la suppression est en Task 2 pour garder le build vert.

- [ ] **Step 1 : Écrire les tests qui échouent**

Ajouter dans `app/src/utils/cofRules.test.ts` :

```ts
describe('resolveArmorCap', () => {
  const voie = {
    '@id': '/api/voies/chv', name: 'Voie du chevalier',
    capabilities: [{ rank: 3, name: 'Autorité naturelle', effect: { armorCap: 7 } }],
  };
  const profiles = [{ voies: [voie] }] as unknown as Parameters<typeof resolveArmorCap>[2];

  it('renvoie la base sans capacité de relèvement', () => {
    expect(resolveArmorCap([], [], [], [], 5)).toBe(5);
  });
  it('relève le plafond quand la capacité est acquise (rang de voie ≥ rang capacité)', () => {
    expect(resolveArmorCap([{ voie: '/api/voies/chv', rank: 3, source: 'profil' }], [], profiles, [], 6)).toBe(7);
  });
  it('ne relève pas si le rang de voie est insuffisant', () => {
    expect(resolveArmorCap([{ voie: '/api/voies/chv', rank: 2, source: 'profil' }], [], profiles, [], 6)).toBe(6);
  });
  it('préserve -1 (aucune armure)', () => {
    expect(resolveArmorCap([], [], [], [], -1)).toBe(-1);
  });
});
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts -t "resolveArmorCap"`
Expected: FAIL (`resolveArmorCap` n'existe pas).

- [ ] **Step 3 : Étendre les types**

Dans `app/src/utils/cofRules.ts`, ajouter le champ à `CapabilityEffect` :

```ts
export interface CapabilityEffect {
  evolutiveDie?: { count: number };
  bonuses?: CapabilityBonus[];
  armorCap?: number;   // DEF max d'armure que cette capacité autorise (plafond relevé)
}
```

Dans `app/src/types/normalized.ts`, ajouter dans l'interface `Profile` (près de `magicStat`) :

```ts
    armorMaxDef?: number | null; // seuil de DEF max d'armure autorisée (spec §8 ; -1 = aucune armure)
```

- [ ] **Step 4 : Implémenter `resolveArmorCap`**

Dans `app/src/utils/cofRules.ts`, ajouter (juste après `computeDamageReduction`, dont elle calque la structure) :

```ts
// Plafond de DEF d'armure effectif : base du profil, relevée par les capacités acquises
// portant effect.armorCap (ex. Chevalier « Autorité naturelle » → 7). Évalué au rang de voie.
export const resolveArmorCap = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
  baseArmorMaxDef: number,
): number => {
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  let cap = baseArmorMaxDef;
  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank && typeof c.effect?.armorCap === 'number') {
        cap = Math.max(cap, c.effect.armorCap);
      }
    });
  });
  return cap;
};
```

Si le compilateur bute sur les types `CompendiumRace/Profile/Voie`, reprendre exactement la signature et la construction `byIri` de `computeDamageReduction` (même fichier) — elle compile déjà.

- [ ] **Step 5 : Lancer les tests + type-check**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts && docker compose exec -T frontend npx tsc -b`
Expected: tous verts ; tsc 0.

- [ ] **Step 6 : Commit**

```bash
git add app/src/utils/cofRules.ts app/src/types/normalized.ts app/src/utils/cofRules.test.ts
git commit -m "feat(rules): resolveArmorCap + champs effect.armorCap / Profile.armorMaxDef"
```

---

### Task 2 : Câblage hook `armorCap` + `ProtectionSection`, suppression de `getMaxArmorDef`

**Files:**
- Modify: `app/src/hooks/useCharacterSheet.ts` (après `selectedProfile` ~162 ; objet de retour)
- Modify: `app/src/pages/CharacterSheet.tsx` (destructuration du hook ; rendu `<ProtectionSection>` ~155-160)
- Modify: `app/src/components/character/ProtectionSection.tsx` (props ; filtre du menu)
- Modify: `app/src/utils/cofRules.ts` (supprimer `ARMOR_CAP_BY_PROFILE` ~78-91 et `getMaxArmorDef` ~93-94)

**Interfaces:**
- Consumes: `resolveArmorCap` (Task 1).
- Produces: le hook expose `armorCap: number`. `ProtectionSection` prend une prop `armorCap: number` (et n'utilise plus `profiles`).

- [ ] **Step 1 : Exposer `armorCap` depuis le hook**

Dans `app/src/hooks/useCharacterSheet.ts`, après le `useMemo` `selectedProfile` (~162-166), ajouter :

```ts
    // Plafond de DEF d'armure (base profil relevée par capacités) — pour le filtre d'équipement.
    const armorCap = useMemo(
        () => resolveArmorCap(characterVoies, races, profiles, allVoies, selectedProfile?.armorMaxDef ?? 3),
        [characterVoies, races, profiles, allVoies, selectedProfile],
    );
```

Ajouter `resolveArmorCap` à l'import depuis `../utils/cofRules`. Ajouter `armorCap` à l'objet retourné par le hook.

- [ ] **Step 2 : Passer la prop dans `CharacterSheet`**

Dans `app/src/pages/CharacterSheet.tsx` : destructurer `armorCap` depuis `useCharacterSheet(...)` (là où les autres valeurs dérivées sont destructurées), puis modifier le rendu :

```tsx
                        <ProtectionSection
                            character={character}
                            setCharacter={setCharacter}
                            allArmors={allArmors}
                            armorCap={armorCap}
                        />
```

(retirer `profiles={profiles}`).

- [ ] **Step 3 : Utiliser la prop dans `ProtectionSection`**

Dans `app/src/components/character/ProtectionSection.tsx` :
- retirer l'import `getMaxArmorDef` et le type `ProfileList` s'il n'est plus utilisé ;
- remplacer l'interface `Props` : retirer `profiles: ProfileList;`, ajouter `armorCap: number;` ;
- dans la destructuration du composant, remplacer `profiles` par `armorCap` ;
- dans le filtre du menu armures, remplacer le bloc qui calcule `profileName` + `getMaxArmorDef` par l'usage direct de `armorCap` :

```tsx
                        {allArmors.filter(a => {
                            if (a.type.includes('Bouclier')) return false;
                            const armorDef = a.defense || 0;
                            return armorDef <= armorCap;
                        }).map((a: any) => (
```

- [ ] **Step 4 : Supprimer le code mort dans `cofRules.ts`**

Supprimer la constante `ARMOR_CAP_BY_PROFILE` (~78-91) et la fonction `getMaxArmorDef` (~93-94).

Vérifier qu'il ne reste aucune référence :
Run: `grep -rn "getMaxArmorDef\|ARMOR_CAP_BY_PROFILE" app/src`
Expected: aucune sortie.

- [ ] **Step 5 : Type-check + tests + lint**

Run: `docker compose exec -T frontend npx tsc -b && docker compose exec -T frontend npx vitest run && docker compose exec -T frontend npm run lint`
Expected: tsc 0 ; vitest vert ; lint 0 nouvelle erreur.

- [ ] **Step 6 : Commit**

```bash
git add -A
git commit -m "feat(character): plafond d'armure dérivé (hook armorCap), supprime getMaxArmorDef"
```

---

### Task 3 : Peupler `effect.armorCap` (fixtures)

**Files:**
- Modify: `backend/src/DataFixtures/AppFixtures.php` (constante `COMBAT_BONUSES` voisine + `applyCapabilityEffect`)

**Interfaces:**
- Consumes: entité `Capability` (`getName()`, `setEffect(array)`).
- Produces: `Capability.effect.armorCap = 7` sur « Autorité naturelle ».

- [ ] **Step 1 : Ajouter la table et la fusion dans l'effet**

Dans `backend/src/DataFixtures/AppFixtures.php`, ajouter une constante de classe près de `COMBAT_BONUSES` :

```php
    /** DEF max d'armure ouverte par une capacité (spec : plafond relevé). */
    private const ARMOR_CAP_BY_CAPABILITY = [
        'Autorité naturelle' => 7, // Chevalier rang 3 : formation à la plaque complète
    ];
```

Dans `applyCapabilityEffect`, après le bloc `bonuses`, ajouter :

```php
        if (isset(self::ARMOR_CAP_BY_CAPABILITY[$c->getName()])) {
            $effect['armorCap'] = self::ARMOR_CAP_BY_CAPABILITY[$c->getName()];
        }
```

(le `setEffect($effect)` conditionné par `$effect !== []` reste inchangé.)

- [ ] **Step 2 : Recharger les fixtures**

Run: `docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction`
Expected: chargement sans erreur (destructif, attendu en dev).

- [ ] **Step 3 : Vérifier la donnée**

Run:
```bash
docker compose exec -T backend bin/console doctrine:query:sql \
  "SELECT name, effect FROM capability WHERE name = 'Autorité naturelle'"
```
Expected: `effect` JSON contient `\"armorCap\": 7`.

- [ ] **Step 4 : Commit**

```bash
git add backend/src/DataFixtures/AppFixtures.php
git commit -m "feat(fixtures): effect.armorCap 7 sur Autorité naturelle (Chevalier plaque complète)"
```

---

## Self-Review

**Couverture spec :**
- `effect.armorCap` (type + donnée) → Tasks 1 & 3. ✓
- `Profile.armorMaxDef` lu côté front → Tasks 1 & 2. ✓
- `resolveArmorCap` au rang de voie (calque `computeDamageReduction`) → Task 1. ✓
- Suppression du `Record` codé en dur → Task 2. ✓
- Chevalier plaque complète (+7) au rang 3, pas avant → couvert par le test Task 1 + la donnée Task 3. ✓
- Guerrier hors périmètre → non peuplé (contrainte globale). ✓
- Parité (profils sans capacité) → `resolveArmorCap` renvoie la base ; valeurs `armorMaxDef` == ancien `Record`. ✓

**Placeholders :** aucun.

**Cohérence des types :** `resolveArmorCap(voies, races, profiles, allVoies, baseArmorMaxDef)` identique entre Task 1 (impl + tests) et Task 2 (appel hook). `effect.armorCap: number` identique entre type (Task 1), donnée PHP (Task 3) et lecture (`resolveArmorCap`). Ordre du filtre `armorDef <= armorCap` cohérent avec l'ancien `<= maxDef`.

## Handoff exécution

Exécution en **subagent-driven** : un implémenteur par tâche, revue spec+qualité après chacune, revue finale de branche, puis PR.
