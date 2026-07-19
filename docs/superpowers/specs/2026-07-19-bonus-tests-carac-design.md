# Bonus aux tests de caractéristique (résolution de choix, tranche #6a) — Design

**Date :** 2026-07-19
**Branche :** `feat/carac-test-bonus`
**Contexte parent :** Refonte du modèle de données — résolution des capacités à choix (#6, cf. design maître §7). Première tranche d'un chantier décomposé en 5 types de choix (bonus de carac, effet de combat, octroi de capacité, maîtrise d'arme, saveur/langues). Cette tranche = **bonus de carac**, réinterprété correctement comme **bonus aux tests** (cf. règle).

## Problème & point de règles

Le #6 actuel (PR #44) enregistre le choix d'une capacité en **texte libre** dans `characterVoies[].choices[<rang>]` et n'applique **aucun** effet. On veut commencer à **résoudre** les choix.

Point de règles décisif (`doc/getRulesFullToMD/partie1-personnage/05-famille-combattants.md:52`) — Barbare rang 3 « Tatouages » :
> Au choix : Taureau (**+3 aux tests de FOR**), ours (+3 aux tests de CON)… serpent (+3 aux tests de VOL).

Le tatouage donne **+3 aux _tests_** d'une caractéristique — **pas** +3 à la caractéristique. Donc **aucune cascade** sur les valeurs dérivées (DEF, PV, attaque). C'est un **bonus conditionnel aux tests**, à afficher en rappel.

Analyse des données : sur 12 capacités mentionnant un bonus aux tests de carac, **le tatouage est le seul inconditionnel** (s'applique à tous les tests de la carac choisie). Tous les autres sont **contextuels** (« tests d'intimidation », « dans les tavernes », « pour se souvenir ») et souvent liés au rang → ils **restent en prose** (modéliser les conditions est hors périmètre). On livre donc un **mécanisme général réutilisable**, démontré sur le tatouage.

## Périmètre

**Dans cette tranche :**
- Mécanisme data-driven « bonus aux tests de carac » (`effect.caracTestBonus` fixe + résolution de choix via `effect.choiceOptions`).
- Peuplement du **tatouage** (Barbare « Tatouages ») : 7 options, +3 aux tests de la carac choisie.
- Le choix devient un **menu déroulant** (options structurées) au lieu du texte libre, quand la capacité porte `effect.choiceOptions`.
- Affichage en **rappel** à côté de la carac concernée (badge « tests +N »).

**Hors périmètre (restent en prose / chantiers ultérieurs) :**
- Bonus aux tests **conditionnels/contextuels** (sociaux, esquive, « pour se souvenir ») et à **échelle de rang** → nécessitent une modélisation des conditions.
- Les 4 autres types de choix du #6 (effet de combat, octroi de capacité, maîtrise d'arme, saveur).
- Aucune propagation sur les valeurs dérivées (c'est un bonus aux tests, pas à la carac).

## Architecture

### 1. Type & résolution (front, `cofRules.ts`)

Étendre `CapabilityEffect` :

```ts
export interface CapabilityEffect {
  evolutiveDie?: { count: number };
  bonuses?: CapabilityBonus[];
  armorCap?: number;
  caracTestBonus?: { carac: CaracKey; value: number };            // bonus fixe aux tests d'une carac
  choiceOptions?: { label: string; caracTestBonus?: { carac: CaracKey; value: number } }[]; // choix structuré
}
```

Fonction pure, sur le modèle de `computeDamageReduction` (même `byIri`, même garde d'acquisition au rang de voie) :

```ts
export const resolveCaracTestBonuses = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
): Partial<Record<CaracKey, number>> => { … }
```

Pour chaque capacité acquise (`c.rank` entre 1 et `entry.rank`) :
- `effect.caracTestBonus` présent → cumuler `value` sur `caracTestBonus.carac`.
- `effect.choiceOptions` présent → chercher l'option dont `label === entry.choices?.[String(c.rank)]` ; si trouvée et qu'elle porte `caracTestBonus`, cumuler.

Renvoie l'agrégat par carac (somme ; capacités distinctes, pas de non-cumul spécial).

### 2. Données (backend, `AppFixtures.php`)

`effect` est dérivé dans `applyCapabilityEffect`. Ajouter une table statique `CHOICE_OPTIONS_BY_CAPABILITY` (clé = nom → tableau d'options structurées) et la fusionner dans `effect['choiceOptions']` (comme `bonuses`/`armorCap`). Peupler le tatouage :

```php
private const CHOICE_OPTIONS_BY_CAPABILITY = [
    'Tatouages' => [
        ['label' => 'Taureau (+3 FOR)',  'caracTestBonus' => ['carac' => 'FOR', 'value' => 3]],
        ['label' => 'Ours (+3 CON)',     'caracTestBonus' => ['carac' => 'CON', 'value' => 3]],
        ['label' => 'Panthère (+3 AGI)', 'caracTestBonus' => ['carac' => 'AGI', 'value' => 3]],
        ['label' => 'Chouette (+3 PER)', 'caracTestBonus' => ['carac' => 'PER', 'value' => 3]],
        ['label' => 'Loup (+3 CHA)',     'caracTestBonus' => ['carac' => 'CHA', 'value' => 3]],
        ['label' => 'Renard (+3 INT)',   'caracTestBonus' => ['carac' => 'INT', 'value' => 3]],
        ['label' => 'Serpent (+3 VOL)',  'caracTestBonus' => ['carac' => 'VOL', 'value' => 3]],
    ],
];
```

Les `label` reprennent les chaînes d'affichage (proches de `details.options_tatouages`) afin de rester lisibles et matchables.

### 3. Câblage (front)

- **`ChoicesPanel`** : si la capacité porte `effect.choiceOptions`, rendre un `<select>` de ses `label` (enregistre le `label` dans `choices[<rang>]`). Sinon, comportement actuel (texte libre via `capabilityChoiceKey`) inchangé.
- **Hook `useCharacterSheet`** : exposer `caracTestBonuses = resolveCaracTestBonuses(characterVoies, races, profiles, allVoies)`.
- **`AttributesPanel`** : nouvelle prop `caracTestBonuses?: Partial<Record<keyof Stats, number>>` ; afficher un petit badge « tests +N » à côté de chaque carac concernée.

## Flux de données

`AppFixtures` → `Capability.effect.choiceOptions` → API voies → front ; le joueur choisit une option (`ChoicesPanel` → `characterVoies[].choices`) → `resolveCaracTestBonuses` (au rang de voie, selon le choix) → `caracTestBonuses` (hook) → badge dans `AttributesPanel`.

## Définition de « fini » (DoD)

- `resolveCaracTestBonuses` testée : bonus fixe ; choix résolu vers la bonne carac ; choix non renseigné → aucun bonus ; capacité non acquise (rang de voie insuffisant) → aucun bonus.
- Tatouage : sélectionner « Ours (+3 CON) » → badge « tests +3 » sur CON ; aucun impact sur DEF/PV/attaque.
- `ChoicesPanel` affiche un menu déroulant pour le tatouage ; texte libre conservé pour les capacités non structurées.
- `tsc -b` = 0, `vitest run` vert, `npm run lint` = 0 nouvelle erreur, e2e existants verts.
- Fixtures rechargeables ; `effect.choiceOptions` présent sur « Tatouages ».

## Découpage prévu

- **(a)** Type `effect.caracTestBonus`/`choiceOptions` + `resolveCaracTestBonuses` (TDD, cofRules).
- **(b)** Câblage : hook `caracTestBonuses`, `ChoicesPanel` (dropdown), `AttributesPanel` (badge).
- **(c)** Données backend `CHOICE_OPTIONS_BY_CAPABILITY` (tatouage).

Le plan détaillera ces tranches en tâches TDD.
