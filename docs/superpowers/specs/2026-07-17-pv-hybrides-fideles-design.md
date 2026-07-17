# Design — PV hybrides fidèles (COF2, profils hybrides chap. 9)

- **Date :** 2026-07-17
- **Statut :** design validé, prêt pour le plan d'implémentation
- **Auteur :** nauno + Claude
- **Règles de référence :** `doc/getRulesFullToMD/partie1-personnage/09-profils-hybrides.md` (font foi)

## 1. Contexte & objectif

La refonte du modèle (Phases 1-3, mergées) dérive désormais les PV par niveau
(`computeMaxHp(baseHp, CON, niveau)`) et réservait un chemin hybride simplifié
(`playState.hpFamilyByLevel` + `computeMaxHpByLevel`) — **latent et incomplet** : il
sommait une base par niveau sans gérer la **moyenne de deux familles** ni l'**arrondi
alterné** exigés par les règles. Ce sous-projet livre le calcul **fidèle** des PV pour
un personnage à profil hybride.

**Règle COF2 (chap. 9) :**
- Le **profil principal** (choisi au niveau 1) est fixe et « ne peut pas être renié ».
  Il détermine le dé de récupération (DR), les points de chance (PC) et les avantages de
  famille — **déjà implémenté** (Phase 3, `computeRecoveryDie`/`computeLuckPoints` sur le
  profil principal). **Hors périmètre de ce sous-projet.**
- Les **PV gagnés à un niveau dépendent de la famille des capacités achetées à ce
  niveau** (aventuriers 4, combattants 5, mages 3, mystiques 4) :
  - toutes de la même famille → PV de cette famille ;
  - de deux familles différentes → **moyenne** des deux ;
  - une capacité prise dans la **voie de peuple** compte comme la famille du **profil
    principal**.
- **Arrondi alterné** des demi-PV : « arrondissez à l'inférieur la première fois, au
  supérieur la fois suivante », de sorte que deux demi-PV consécutifs somment à un entier.

*Exemples du livre à reproduire :*
- combattant rang 2 + mage rang 1 au même niveau → (5 + 3) / 2 = **4 PV**.
- deux niveaux à 3,5 PV (mage+aventurier) → **3 puis 4** (total 7, soit 3,5 × 2).
- profil principal guerrier : peuple rang 2 + mage rang 1 → 2,5 (peuple = guerrier) + 1,5
  (mage) = **4 PV**.

## 2. Périmètre & non-objectifs

**Dans le périmètre :** modèle `playState` par niveau, dérivation fidèle des PV max
(moyenne + arrondi alterné + exception voie de peuple), UI d'annotation par niveau, tests
unitaires contre les exemples du livre. **Frontend uniquement** (`playState` est du JSON
opaque côté backend — aucune migration).

**Hors périmètre :** DR/PC/bonus de famille (déjà sur le profil principal, Phase 3) ; la
règle de validation « tant qu'il reste une voie de profil sans point, on peut être
hybride » (→ sous-projet UI light / phase ultérieure) ; l'auto-dérivation depuis un
journal d'acquisition complet (approche B écartée) ; les briques UI légères (langues, RP
étendu, physique, monnaie, affichage enrichi) — **second sous-projet dédié**.

## 3. Décisions actées

| Décision | Choix | Raison |
|---|---|---|
| Capture de l'info par niveau | **Annotation manuelle par niveau** (approche A) | Colle au workflow des règles (« notez-le sur votre fiche ») ; pas de journal d'acquisition à modéliser. Le modèle ne stocke qu'un rang cumulé, sans niveau d'acquisition. |
| Forme du champ | `playState.hpByLevel: Record<string, string[]>` (remplace `hpFamilyByLevel`) | Une liste de familles par niveau porte le cas « deux familles » que `Record<string,string>` ne pouvait pas. |
| Arrondi alterné | **`floor` de la somme des bases** | Deux demi-PV consécutifs s'annulent ; tenir la valeur basse jusqu'à complétion de la paire reproduit exactement la règle sans état supplémentaire. |
| Localisation | **Frontend seul** | `playState` = JSONB opaque ; pas de schéma backend à migrer. |

## 4. Modèle (`playState`)

Remplacer, dans `app/src/types/character.ts` :

```ts
hpFamilyByLevel?: Record<string, string>; // supprimé
```

par :

```ts
// PV hybrides (COF2 chap. 9) : familles finançant chaque niveau (2..N). Une entrée par
// capacité achetée ce niveau-là (1 ou 2) ; voie de peuple ⇒ famille du profil principal.
// Absent ou vide ⇒ défaut = famille du profil principal. Le niveau 1 n'est jamais stocké
// (jamais hybride au niveau 1).
hpByLevel?: Record<string, string[]>;
```

Les identifiants de famille sont ceux de `FAMILY_BASE_HP` / `PROFILE_FAMILIES` :
`'aventuriers' | 'combattants' | 'mages' | 'mystiques'`.

## 5. Dérivation (`cofRules.ts`)

`FAMILY_BASE_HP` (déjà correct depuis P3 : `aventuriers 4, combattants 5, mages 3,
mystiques 4`) reste la table famille → PV de base. `computeMaxHpByLevel` (P3, simpliste)
est **remplacé** par une fonction fidèle :

```ts
// PV max d'un personnage (hybride ou non), COF2 chap. 9.
//   mainFamily   : famille du profil principal (pilote le niveau 1 et les défauts)
//   hpByLevel    : familles finançant chaque niveau 2..N (annotation joueur)
//   conMod, level: CON et niveau courant
export const computeHybridMaxHp = (
  mainFamily: string,
  hpByLevel: Record<string, string[]> | undefined,
  conMod: number,
  level: number,
): number => { … }
```

Algorithme :

1. `pvBase = 2 × FAMILY_BASE_HP[mainFamily]` (niveau 1 compte double).
2. Pour chaque niveau `L` de 2 à `level` :
   - `fams = hpByLevel?.[String(L)]` ; si absent/vide → `[mainFamily]`.
   - `pvNiveau = moyenne( fams.map(f => FAMILY_BASE_HP[f] ?? FAMILY_BASE_HP[mainFamily]) )`.
   - `pvBase += pvNiveau`.
3. `maxHp = Math.floor(pvBase) + conMod × level`.

**Propriétés vérifiables (tests) :**
- Mono-famille : `computeHybridMaxHp('combattants', {}, CON, N)` = `computeMaxHp(5, CON, N)`
  (rétrocompatibilité avec la formule non-hybride).
- Livre : `computeHybridMaxHp('combattants', {'2': ['combattants','mages']}, 0, 2)` →
  `floor(2×5 + (5+3)/2) = floor(14) = 14`.
- Arrondi alterné : deux niveaux mixtes à 3,5 → le `floor` de la somme donne l'entier
  attendu à chaque étape (3 puis 4).
- Exception peuple : une famille `= mainFamily` dans la liste contribue la valeur du
  profil principal.

`computeMaxHpByLevel` est retiré (aucun consommateur hors le hook, migré ici) ; son test
est remplacé par ceux de `computeHybridMaxHp`.

## 6. Câblage hook (`useCharacterSheet.ts`)

Le `maxHp` mémoïsé (aujourd'hui : `computeMaxHp` normal, `computeMaxHpByLevel` si
`hpFamilyByLevel`) devient :

```ts
const maxHp = useMemo(() => {
  const baseHp = /* hpPerLevel du profil, inchangé */;
  if (!baseHp) return playState.hp?.current || 0;
  const mainFamily = PROFILE_FAMILIES[profileName ?? '']?.id;
  if (!mainFamily) return computeMaxHp(baseHp, mods.CON, character.level || 1);
  return computeHybridMaxHp(mainFamily, playState.hpByLevel, mods.CON, character.level || 1);
}, [selectedProfile, profileName, mods.CON, character.level, playState.hp?.current, playState.hpByLevel]);
```

Note : `computeHybridMaxHp` s'appuie sur `FAMILY_BASE_HP[mainFamily]`, cohérent avec le
`baseHp` `hpPerLevel` du profil (mêmes valeurs 4/5/3/4 par famille). Aucune valeur dérivée
n'est persistée (invariant des phases précédentes).

## 7. UI (fiche de personnage)

Nouveau composant `HpByLevelEditor` (dans `components/character/`), rendu sous le panneau
PV (`MainStatsPanel` ou juste après, dans `CharacterSheet`).

- Une ligne par niveau de **2 à `character.level`** (rien si niveau ≤ 1).
- Chaque ligne : libellé « Niv L », un sélecteur de famille (défaut = profil principal,
  affiché en gris/discret tant qu'il vaut le défaut) et, optionnellement, un **second**
  sélecteur pour le cas « deux familles » (bouton « + famille » qui ajoute la 2ᵉ entrée).
- Affiche le PV du niveau calculé (`moyenne`), et un indicateur « ½ en attente » quand le
  cumul a un demi-point non soldé (info, cohérent avec le `floor`).
- Écrit `playState.hpByLevel[String(L)]` = liste des familles choisies (retire l'entrée si
  elle retombe sur `[mainFamily]`, pour garder `playState` minimal).
- Discret par défaut : un personnage mono-famille voit des lignes toutes au profil
  principal, sans action requise. Envisager un repli « avancé » si l'encombrement gêne
  (décision d'implémentation, non bloquante).

## 8. Tests

- **Unitaires (`cofRules.test.ts`)** : `computeHybridMaxHp` contre les 3 exemples du livre
  (§1) + rétrocompatibilité mono-famille (== `computeMaxHp`) + un cas multi-niveaux mixte
  vérifiant l'arrondi alterné cumulatif.
- **Type-check / lint** : `tsc -b` 0 erreur ; lint sans nouvelle erreur (baseline ~133).
- **E2E** : non-régression de la fiche (`character-sheet`, `character-voies`) ; la nouvelle
  UI rend sans casser la fiche.

## 9. Migration & compatibilité

- `hpFamilyByLevel` → `hpByLevel` : rupture de nom d'un champ `playState` **jamais écrit
  par aucun code existant** (chemin hybride resté latent en P3) → aucune fiche réelle à
  convertir. Aucune migration backend (JSONB opaque).

## 10. Critères de succès

- Les 3 exemples chiffrés du livre (§1) sont reproduits exactement par `computeHybridMaxHp`.
- Un personnage mono-famille a des PV identiques à la formule non-hybride (parité).
- Le joueur peut annoter la/les famille(s) de chaque niveau ; les PV se recalculent à
  l'affichage, avec arrondi alterné correct, sans valeur persistée.
- `tsc`, `vitest` et les e2e de non-régression passent.

## 11. Suite

Second sous-projet (**UI légères**, cadrage dédié) : édition des langues (+ emplacements
dérivés/illettrisme, `computeLanguageSlots` déjà fait), RP étendu (`rp.secret`/`rp.notes`),
talent secondaire, âge/taille/poids bornés par le peuple, monnaie po/pc, affichage enrichi
des dérivés (RD, langues). Puis Phase 5 (mécaniques spéciales : companions, états, usages…).
