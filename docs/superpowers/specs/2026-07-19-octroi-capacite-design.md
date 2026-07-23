# Octroi de capacité de peuple — résolution (entrée de voie `trait`) — Design

**Date :** 2026-07-19
**Branche :** `feat/octroi-capacite-trait`
**Contexte parent :** Résolution des capacités à choix (#6). La tranche « guide » (PR #55) a transformé le choix racial `choix_capacite` en menu déroulant contraint (labels de profils). Cette tranche **résout réellement** l'octroi : la capacité choisie est octroyée au personnage et ses effets dérivent.

## Problème

Le trait racial (`choix_capacite`) permet de choisir **une capacité de rang 1 d'une voie d'un profil autorisé**, **gratuitement** (hors budget de points). Aujourd'hui le choix n'est qu'un label enregistré (« Barbare (Rang 1) ») — la capacité n'est pas réellement octroyée ni dérivée.

## Décisions (actées avec l'utilisateur)

- **Modèle** : entrée `characterVoie { voie, rank: 1, source: 'trait' }`. Nouveau `VoieSource = 'trait'`. Réutilise toute la dérivation existante (qui itère `characterVoies`) → bonus/sorts/mana dérivent gratuitement.
- **Gratuite + hors plafond** : `'trait'` exclue de `computeSpentPoints` (ne coûte pas de point) et de `countCappedVoies` (ne compte pas dans les 6, comme `peuple`).
- **Périmètre : rang 1 uniquement** pour les 5 peuples (couvre l'option rang 1 de tous). Le « rang 2 à la place » (Elfe haut / Humain, avec contrainte « sans armure ») est **différé** : une voie rang 2 donnerait 2 capacités, ce qui casse le modèle → traitement séparé ultérieur.
- **UI** : panneau dédié `RacialGrantPanel` (pattern des autres mécaniques). Pas de chirurgie dans `VoiesTree` : une entrée `'trait'` ne matche aucun de ses filtres de source, il l'ignore.

## Architecture

### 1. Le source `'trait'` accepté partout

- Front : `VoieSource = 'profil' | 'peuple' | 'prestige' | 'hybride' | 'trait'` (`app/src/types/character.ts`).
- Backend : ajouter `'trait'` à `#[Assert\Choice(choices: [...])]` sur `CharacterVoie.source` (`backend/src/Entity/CharacterVoie.php`) — sinon l'API rejette l'écriture (400). Pas de migration (colonne string(20) inchangée).

Vérifier qu'aucun `switch`/ternaire exhaustif sur `VoieSource` ne casse : `voieKindOf('trait')` → `'profile'` (branche par défaut, sans effet car exclue du budget) ; `isProfil('trait')` → `false`. OK.

### 2. Budget & plafond (front, `cofRules.ts`)

- `computeSpentPoints` : **ignorer** les entrées `source === 'trait'` (boucle `forEach` : `if (v.source === 'trait') return;`).
- `countCappedVoies` : exclure `'trait'` en plus de `'peuple'` (`v.source !== 'peuple' && v.source !== 'trait'`).

### 3. Éligibilité & profils autorisés (front, `cofRules.ts`, pur, TDD)

```ts
export interface RacialGrant {
  capabilityRank: number;      // rang de la capacité choix_capacite dans la voie de peuple
  allowedProfiles: string[];   // noms de profils autorisés ; ['*'] = tous
}
// null si le peuple n'a pas de trait choix_capacite OU si la voie de peuple n'a pas atteint son rang.
export const racialGrantInfo = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
): RacialGrant | null => { … };
```

Logique : trouver l'entrée `source === 'peuple'` et sa voie de compendium ; y trouver la capacité portant `effect.choiceOptions` (le trait `choix_capacite`) et son `rank` ; si le rang de l'entrée peuple `>=` ce rang → éligible. `allowedProfiles` = parse des labels de `choiceOptions` : `label.split(' (')[0].trim()` ; si un label commence par `N'importe` → `['*']` (tous profils).

### 4. `RacialGrantPanel` (front, nouveau composant)

Affiché seulement si `racialGrantInfo(...) != null`. Contenu :
- Un `<select>` des **voies des profils autorisés** (depuis `profiles`, filtrés par `allowedProfiles` ; `['*']` = tous). Options = nom de voie, valeur = IRI.
- À la sélection : écrit/replace l'entrée `characterVoies` `{ voie: <iri>, rank: 1, source: 'trait' }` (une seule entrée `'trait'` ; la re-sélection remplace).
- Affiche la capacité octroyée : le nom de la capacité rang 1 de la voie choisie (résolue dans le compendium).
- Option « — aucune — » pour retirer l'entrée `'trait'`.

Le hook `useCharacterSheet` expose `racialGrant = racialGrantInfo(...)` ; `CharacterSheet` rend `<RacialGrantPanel>` (dans la section « Voies & Progression » ou « Rôleplay »).

### 5. Dérivation

**Aucun changement.** `computeCombatStats`, `resolveArmorCap`, `resolveCaracTestBonuses`, `computeDamageReduction`, mana, etc. itèrent déjà `characterVoies` ; l'entrée `'trait'` à rang 1 y résout sa capacité rang 1 (garde `c.rank <= entry.rank` → seulement le rang 1). La capacité octroyée dérive donc ses effets automatiquement.

## Flux de données

Voie de peuple (rang atteint) → `racialGrantInfo` calcule éligibilité + profils autorisés → `RacialGrantPanel` propose les voies autorisées → le joueur choisit → entrée `characterVoies {rank:1, source:'trait'}` → dérivation (auto) + round-trip API (source `'trait'` accepté).

## Définition de « fini » (DoD)

- `computeSpentPoints` ignore `'trait'` (test : une entrée trait ne consomme aucun point) ; `countCappedVoies` l'exclut (test : n'entre pas dans les 6).
- `racialGrantInfo` testé : peuple sans trait → null ; peuple avec trait mais rang insuffisant → null ; rang atteint → `{capabilityRank, allowedProfiles}` corrects ; label « N'importe quel profil » → `['*']`.
- `RacialGrantPanel` : n'apparaît que si éligible ; choisir une voie autorisée crée l'entrée `'trait'` rang 1 ; la capacité octroyée s'affiche ; ses effets (si bonus/RD/mana) apparaissent sur la fiche.
- Le source `'trait'` round-trip (POST/PUT 2xx, relecture OK).
- `tsc -b` = 0, `vitest run` vert, `npm run lint` = 0 nouvelle erreur, e2e existants verts.

## Hors périmètre

- **Octroi rang 2** (Elfe haut / Humain « rang 1 ou 2 ») et sa contrainte « sans armure » pour la magie.
- Contrainte fine « une capacité précise de la voie » : on octroie la voie à rang 1 (= sa capacité rang 1, unique) ; pas de sélection intra-voie (rang 1 = 1 capacité, donc équivalent).
- Interdits d'armure/bouclier liés à certains sorts octroyés (Gnome : « en armure, 1×/jour » — reste en prose).

## Découpage prévu

- **(a)** Source `'trait'` accepté : type front + `Assert\Choice` backend.
- **(b)** Budget/plafond (exclusions) + `racialGrantInfo` (cofRules, TDD).
- **(c)** `RacialGrantPanel` + câblage hook/`CharacterSheet`.
