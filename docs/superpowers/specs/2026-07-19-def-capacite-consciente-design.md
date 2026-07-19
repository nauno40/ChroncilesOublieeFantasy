# Plafond d'armure piloté par les données & conscient des capacités — Design

**Date :** 2026-07-19
**Branche :** `feat/armor-cap`
**Contexte parent :** Refonte du modèle de données — chantiers de fidélité (§8 corrections compendium, écart d'audit `getMaxArmorDef`). Voir `2026-07-12-fidelite-modele-donnees-design.md` (§6 effets structurés, §8).

## Problème

Le plafond de DEF d'armure autorisée par profil est aujourd'hui codé **en dur** côté front dans `ARMOR_CAP_BY_PROFILE` / `getMaxArmorDef(profileName)` (`app/src/utils/cofRules.ts`), utilisé uniquement pour **filtrer le menu déroulant d'armures** dans `ProtectionSection.tsx`. Deux défauts :

1. **Doublon de la donnée.** La Phase 1 a introduit et peuplé `Profile.armorMaxDef` (backend, exposé en `profile:read`, `-1` = aucune armure). Les valeurs front et backend coïncident désormais, mais le front ignore la donnée et maintient un `Record` parallèle — source de dérive future.
2. **Pas de conscience des capacités.** Certaines capacités relèvent le plafond. Le code l'admet en commentaire (« plaque complète (+7) via la capacité rang 3 du chevalier ») mais plafonne à 6 en dur, donc un Chevalier ne peut jamais équiper la Plaque complète (def 7), pourtant présente dans `armors.json`.

## Décision de périmètre

**Dans cette tranche :** base depuis la donnée + relevé par les capacités **inconditionnelles**.

- **Chevalier rang 3 « Autorité naturelle »** → ouvre la plaque complète (DEF +7). Inconditionnel.

**Hors périmètre (différé au chantier #6 « résolution des capacités à choix ») :**
- **Guerrier rang 3 « Armure lourde »** : *au choix* +1 DEF **ou** armure de plaque (DEF +6). Le plafond ET le bonus +1 DEF dépendent du choix joueur (`CharacterVoie.choices`), non encore résolu. Décision utilisateur : différer plutôt que demi-implémenter la résolution de choix.
- Le **clamp de la contribution d'armure dans le calcul de DEF** (`computeCombatStats`) reste inchangé : le filtre du menu déroulant empêche déjà de sélectionner une armure au-dessus du plafond ; pas de double enforcement.

## Architecture

### 1. Donnée backend — `effect.armorCap` (fixtures)

`Capability.effect` est dérivé dans `AppFixtures.php` (déjà : `evolutiveDie`, `bonuses` via `COMBAT_BONUSES`). Ajouter une table statique `ARMOR_CAP_BY_CAPABILITY` (constante de classe, clé = nom de capacité → DEF max ouverte) et la fusionner dans `effect` au même endroit que `bonuses` :

```php
private const ARMOR_CAP_BY_CAPABILITY = [
    'Autorité naturelle' => 7, // Chevalier rang 3 : plaque complète
];
```

Dans `applyCapabilityEffect` : `if (isset(self::ARMOR_CAP_BY_CAPABILITY[$c->getName()])) { $effect['armorCap'] = self::ARMOR_CAP_BY_CAPABILITY[$c->getName()]; }`. Toujours `setEffect` seulement si `$effect !== []`.

### 2. Type front — `effect.armorCap`

Étendre `CapabilityEffect` (`app/src/utils/cofRules.ts`) :

```ts
export interface CapabilityEffect {
  evolutiveDie?: { count: number };
  bonuses?: CapabilityBonus[];
  armorCap?: number;   // DEF max d'armure que cette capacité autorise (plafond relevé)
}
```

Ajouter `armorMaxDef?: number | null;` au type `Profile` (`app/src/types/normalized.ts`).

### 3. Fonction pure — `resolveArmorCap`

Dans `cofRules.ts`, sur le modèle de `computeDamageReduction` (même construction `byIri` races+profils+allVoies, même parcours des capacités acquises `rank 1..entry.rank`) :

```ts
export const resolveArmorCap = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
  baseArmorMaxDef: number,
): number => {
  // byIri identique à computeDamageReduction
  let cap = baseArmorMaxDef;
  // pour chaque capacité acquise avec effect?.armorCap : cap = Math.max(cap, effect.armorCap)
  return cap;
};
```

Renvoie le plafond effectif. `-1` (aucune armure) reste `-1` tant qu'aucune capacité acquise ne le relève.

Supprimer `ARMOR_CAP_BY_PROFILE` et `getMaxArmorDef`.

### 4. Câblage — hook + `ProtectionSection`

Le hook `useCharacterSheet` (qui a `characterVoies`, `races`, `profiles`, `allVoies`, `selectedProfile`) calcule et expose :

```ts
const armorCap = useMemo(
  () => resolveArmorCap(characterVoies, races, profiles, allVoies, selectedProfile?.armorMaxDef ?? 3),
  [characterVoies, races, profiles, allVoies, selectedProfile],
);
```

Défaut `3` si `armorMaxDef` absent (défensif ; les 14 profils l'ont). `ProtectionSection` reçoit `armorCap` en prop et remplace `getMaxArmorDef(profileName)` par cette valeur pour filtrer le menu (`armorDef <= armorCap`). Il n'a plus besoin de recalculer `profileName` pour ça.

## Flux de données

`AppFixtures` → `Capability.effect.armorCap` (JSONB) → API voies → front `resolveArmorCap` (au rang de voie) → `armorCap` (hook) → filtre du menu `ProtectionSection`.

## Définition de « fini » (DoD)

- `resolveArmorCap` testée : base seule ; base relevée par capacité acquise ; capacité non encore acquise (rang de voie insuffisant) ne relève pas ; `-1` préservé.
- Front lit `Profile.armorMaxDef` ; `ARMOR_CAP_BY_PROFILE` / `getMaxArmorDef` supprimés ; aucune référence résiduelle.
- **Parité** : pour tout profil sans capacité de relèvement, les armures sélectionnables sont identiques à aujourd'hui.
- **Chevalier** : au rang 3 de la voie contenant « Autorité naturelle », la Plaque complète (+7) devient sélectionnable ; pas avant.
- `tsc -b` = 0, `vitest run` vert, `npm run lint` = 0 nouvelle erreur, e2e existants verts.
- Fixtures rechargeables ; `effect.armorCap` = 7 sur « Autorité naturelle ».

## Découpage prévu

- **(a)** Type `effect.armorCap` + `Profile.armorMaxDef` (front) + `resolveArmorCap` (TDD, cofRules) + suppression `getMaxArmorDef`.
- **(b)** Câblage hook `armorCap` + `ProtectionSection` (prop).
- **(c)** Données backend `ARMOR_CAP_BY_CAPABILITY` (fixtures).

Le plan détaillera ces tranches en tâches TDD.
