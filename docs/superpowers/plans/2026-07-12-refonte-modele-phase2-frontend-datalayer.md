# Refonte du modèle de données — Phase 2 (data-layer frontend) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le modèle de personnage côté frontend du sac `data` (stats+modifiers, voies par nom, valeurs dérivées stockées) vers la forme backend Phase 1 (`caracs` + `playState` + `characterVoies` par IRI), **à parité fonctionnelle** — la fiche crée/charge/sauve/affiche les mêmes valeurs qu'aujourd'hui.

**Architecture :** Le backend (Phase 1) sérialise désormais `Character` avec `caracs` (JSON), `playState` (JSON) et `characterVoies` (relation, voies par IRI) au niveau racine — plus de `data`. Le frontend doit consommer cette forme. Le point dur : `useCharacterSheet` (620 lignes) est bâti autour de l'ancienne forme et **stocke les valeurs dérivées** (hp.max, def, init, luck.max, mp.max) via des effets, en alimentant `computeSpentPoints`/`computeManaPoints`/`computeCombatStats` avec l'ancienne forme de voies. Changer le type force donc une migration coordonnée : types → mapping → signatures `cofRules` (voies/caracs) → `useCharacterSheet` → composants. Le changement de type est **atomique** : `tsc -b` n'est vert qu'une fois TOUS les consommateurs migrés.

**Périmètre — parité, pas de nouvelle fidélité.** Cette phase NE fait PAS : PV par niveau, nombre de DR, langues dérivées, `resolveCapabilityEffect`, compagnons (→ Phase 3). Elle préserve le comportement actuel (dont l'auto-calc PV au niveau 0/1 uniquement, la sélection de voies, le changement de classe) sur la nouvelle forme de données.

**Tech Stack :** React 19 + TypeScript + Vite. Validation : `docker compose exec -T frontend npx tsc -b` (0 erreur) et `docker compose exec -T frontend npx vitest run` (66 tests actuels + nouveaux). E2E render-safety : `bash scripts/e2e.sh e2e/<spec>`.

**Référence :** spec `docs/superpowers/specs/2026-07-12-fidelite-modele-donnees-design.md` (§4 modèle, §5 dérivation).

## Global Constraints

- **Build vert obligatoire en fin de phase** : `tsc -b` 0 erreur ; `vitest run` tout vert ; lint sans **nouvelle** erreur (baseline ~163 `no-explicit-any` pré-existantes — ne pas en ajouter, cf. mémoire `frontend-lint-baseline`).
- **Parité fonctionnelle** : création (niveau 0), chargement, sauvegarde, affichage des valeurs dérivées (PV, DEF, Init, PC, PM, DR) restent équivalents. Aucune nouvelle règle.
- **Voies par IRI** : `characterVoies[]` = `{ voie: <IRI string>, rank: number, source: 'profil'|'peuple'|'prestige'|'hybride', choices?: object }`. Plus jamais de référence de voie par nom pour l'identité (l'affichage résout le nom via le compendium).
- **Mécanisme de rattachement campagne préservé** : `handleSave` envoie `campaignId` (write-only) à la création — inchangé.
- **Suppression de `Character.data`** côté type : remplacé par `caracs`, `playState`, `characterVoies` au niveau racine (forme backend).
- Migration legacy (`migrateLegacyStats`) au chargement : conservée tant qu'elle sert de filet pour d'éventuelles fiches à l'ancien format lues avant purge — sinon retirée (voir Task 2).

## File Structure

- **`app/src/types/character.ts`** — redéfinit `Character` (racine : `caracs`/`playState`/`characterVoies`) + les sous-types (`Caracs`, `PlayState`, `CharacterVoieRef`). Contrat central.
- **`app/src/utils/cofRules.ts`** — adapte les signatures qui prennent l'ancienne forme de voies (`CharacterVoies` = `{racial,profile[],prestige}`) vers `CharacterVoieRef[]` : `computeSpentPoints`, `computeManaPoints`, `computeCombatStats`, `computeLuckPoints` (arg voie raciale). Caracs déjà traitées comme valeurs. Tests unitaires adaptés/ajoutés.
- **`app/src/hooks/useCharacterSheet.ts`** — cœur : lit/écrit `caracs`/`playState`/`characterVoies` ; l'état `selectedVoies` (noms) devient une projection IRI ; les effets qui stockaient hp.max/def/init/luck.max/mp.max cessent de persister le dérivé (valeurs retournées, `playState` ne garde que le `current`).
- **`app/src/pages/CharacterSheet.tsx`** — consomme le retour du hook (adapte les accès `data.*`).
- **`app/src/components/character/VoiesTree.tsx`** — affiche/édite les voies : passe des slots-par-nom aux `characterVoies` (IRI + rang), résolution du nom via compendium.
- **`app/src/pages/CombatTracker.tsx`** — lit `caracs`/`playState`/dérivés au lieu de `data.*`.
- **`app/src/utils/campaignService.ts`** — mapping des personnages imbriqués dans une campagne (ligne ~108 `data: c.data`) → `caracs`/`playState`/`characterVoies`.
- **`app/src/components/character/types.ts`** — suit automatiquement (types dérivés via `ReturnType`), à vérifier.

---

### Task 1 : Contrat de types (`character.ts`)

**Files:**
- Modify: `app/src/types/character.ts` (remplace `CharacterData`)

**Interfaces:**
- Produces: `Character`, `Caracs`, `CharacterVoieRef`, `PlayState`, `CharacterWeapon`.

- [ ] **Step 1 : Écrire les nouveaux types**

Remplacer le contenu de `character.ts` par :

```ts
export type CaracKey = 'AGI' | 'CON' | 'FOR' | 'PER' | 'CHA' | 'INT' | 'VOL';
export type Caracs = Record<CaracKey, number>; // valeurs de base -2..+5

export type VoieSource = 'profil' | 'peuple' | 'prestige' | 'hybride';
export interface CharacterVoieRef {
    voie: string;            // IRI compendium, ex. "/api/voies/12"
    rank: number;            // nb de rangs acquis (0..maxRank)
    source: VoieSource;
    choices?: Record<string, unknown>;
}

export interface CharacterWeapon { name: string; atkMod: number; dmg: string; special: string; }

export interface PlayState {
    hp: { current: number };
    mana: { current: number };
    luck: { current: number };
    recovery: { used: number };
    money: { po?: number; pa: number; pc?: number };
    equipment: Array<string | { ref?: string; name?: string; qty?: number; equipped?: boolean; adhoc?: boolean; bonus?: { target: string; value: number } }>;
    rp: { ideal: string; flaw: string; secret?: string; notes?: string };
    languages: string[];
    hpFamilyByLevel?: Record<string, string>; // hybride (spec §5)
    // état de jeu additionnel (protection équipée, armes) — parité Phase 2 :
    protection?: { armor: { name: string; def: number }; shield: { name: string; def: number } };
    weapons?: CharacterWeapon[];
}

export interface Character {
    id?: number;
    name: string;
    level: number;
    race?: string | { '@id': string; id: number; name: string };
    profile?: string | { '@id': string; id: number; name: string };
    caracs: Caracs;
    playState: PlayState;
    characterVoies: CharacterVoieRef[];
    campaignId?: number;
    createdAt?: string;
    updatedAt?: string;
}
```

- [ ] **Step 2 : Vérifier que le fichier compile isolément**

Run: `docker compose exec -T frontend npx tsc --noEmit app/src/types/character.ts 2>&1 | head` — pas d'erreur propre au fichier (les erreurs des consommateurs viendront après, elles sont attendues jusqu'à la fin de la phase).

> Note : `tsc -b` global sera ROUGE tant que les Tasks 2-6 ne sont pas faites — c'est le seuil atomique documenté. Ne pas committer un build cassé en isolation : cette task se committe **avec** les suivantes, ou la phase s'exécute d'un bloc puis se valide au vert. Recommandé : exécuter Tasks 1→6 puis valider/committer une fois `tsc -b` vert (voir Task 7).

---

### Task 2 : Adapter les signatures `cofRules.ts` aux voies par IRI

**Files:**
- Modify: `app/src/utils/cofRules.ts`
- Test: `app/src/utils/cofRules.test.ts`

**Interfaces:**
- Consumes: `CharacterVoieRef[]` (Task 1).
- Produces: `computeSpentPoints(voies: CharacterVoieRef[], level, isMageFamily)`, `computeManaPoints(voies: CharacterVoieRef[], compendium, volMod, perMod)`, `computeCombatStats({ voies: CharacterVoieRef[], protection, ... })`, `computeLuckPoints(profileName, chaMod, racialVoie?: CharacterVoieRef)`.

Le rang était encodé en `ranks: boolean[]` (nb de `true`). Il devient `rank: number` (nombre de rangs). L'adaptation : `spent` par voie = coût cumulé des rangs 1..rank (via `capacityCost`) ; nb de sorts = compter les capacités `isSpell` des rangs acquis en résolvant la voie dans le compendium par IRI.

- [ ] **Step 1 : Écrire les tests d'abord (RED)**

Ajouter à `cofRules.test.ts` des cas sur la nouvelle forme. Exemple :

```ts
import { computeSpentPoints } from './cofRules';

test('computeSpentPoints somme les coûts de rang (IRI)', () => {
  const voies = [
    { voie: '/api/voies/1', rank: 2, source: 'profil' as const },  // rangs 1,2 = 1+1 = 2 pts
    { voie: '/api/voies/2', rank: 3, source: 'profil' as const },  // 1+1+2 = 4 pts
  ];
  expect(computeSpentPoints(voies, 3, false)).toBe(6);
});
```

(Ajouter des cas pour la voie raciale gratuite au rang 1, et l'exception mage rang 2 — reprendre la logique de l'ancien `computeSpentPoints` que ce test remplace.)

- [ ] **Step 2 : Lancer — échoue**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: FAIL (signature/forme).

- [ ] **Step 3 : Réécrire les fonctions concernées**

Adapter `computeSpentPoints`, `computeManaPoints`, `computeCombatStats`, `computeLuckPoints` pour itérer sur `CharacterVoieRef[]` et résoudre chaque `voie` (IRI) dans les collections compendium (`allVoies`/`races`/`profiles`) pour accéder à `maxRank`/`capabilities`. Conserver EXACTEMENT les règles actuelles (coûts 1/1/2…, rang racial 1 gratuit, exception mage, +PER rang 4 druide/ensorceleur pour PM). Réutiliser `capacityCost`, `capacityBudget` existants.

- [ ] **Step 4 : Lancer — passe**

Run: `docker compose exec -T frontend npx vitest run src/utils/cofRules.test.ts`
Expected: PASS (les 39 cas cofRules existants adaptés + les nouveaux).

---

### Task 3 : Réécrire `useCharacterSheet.ts` sur la nouvelle forme

**Files:**
- Modify: `app/src/hooks/useCharacterSheet.ts`

**Interfaces:**
- Consumes: types (Task 1), fonctions `cofRules` (Task 2).
- Produces: même surface de retour (mêmes clés qu'aujourd'hui : `character, stats→caracs, mods, combatStats, luckPoints, manaPoints, spentPoints, selectedVoies, updateStat, handleSave, getCapabilityName, …`) — les consommateurs (Tasks 4-5) s'appuient dessus.

Transformation (parité) — table de correspondance à appliquer dans tout le hook :

| Ancien (`data.*`) | Nouveau |
|---|---|
| `defaultData.stats` / `character.data.stats` | `character.caracs` (mêmes 7 clés) |
| `data.modifiers` (stocké) | **non stocké** — `mods = finalStats` (dérivé, déjà le cas), supprimer l'effet qui écrit `data.modifiers` |
| `data.hp.max` (stocké via effet) | dérivé → retourné ; `playState.hp.current` seul persisté |
| `data.mp.max` / `data.luck.max` (stockés) | dérivés → retournés ; `playState.mana.current`/`luck.current` persistés |
| `data.def` / `data.init` (stockés) | `combatStats` dérivé → retourné, non persisté |
| `data.recovery.die` (stocké) | dérivé (`recoveryDieString`) → retourné |
| `data.voies.{racial,profile[5],prestige}` (par nom) | `character.characterVoies: CharacterVoieRef[]` (IRI + source + rank) |
| `data.protection` / `data.attack.weapons` / `data.equipment` / `data.money` / `data.rp` | `playState.protection` / `playState.weapons` / `playState.equipment` / `playState.money` / `playState.rp` |

Points délicats :
- **`selectedVoies` (noms)** : rester un état de création `[profil1, profil2, racial]` mais en **IRI** ; l'effet de sync construit/maj `characterVoies` (source `profil`/`peuple`) au lieu des 5 slots. Le changement de classe : filtrer/retirer les `characterVoies` `source==='profil'` de l'ancienne classe puis ré-ajouter les voies du nouveau profil (mêmes règles qu'aujourd'hui : reconstruire à la création, préserver les rangs en édition).
- **`getCapabilityName(voieIRI, rank)`** : chercher par IRI dans le compendium (au lieu du nom).
- **`updateStat`** : écrit `character.caracs[stat]` (bornes MIN/MAX inchangées).
- Les effets « sync … to Data » qui persistaient le dérivé : supprimer la persistance ; ne garder que le `current` dans `playState` là où c'est un état de jeu.

- [ ] **Step 1 : Réécrire le hook**

Appliquer la table ci-dessus dans `useCharacterSheet.ts`. Conserver la surface de retour (renommer `stats`→exposer `caracs` mais garder un alias `stats` si les composants l'utilisent — vérifier au Step 2). Mettre à jour `defaultData` vers la nouvelle forme.

- [ ] **Step 2 : Repérer les accès `data.` restants et les consommateurs**

Run: `docker compose exec -T frontend grep -rn "\.data\.\|\.data\b" src/hooks/useCharacterSheet.ts` → doit être vide.
Run: `docker compose exec -T frontend grep -rn "\.data\." src/pages/CharacterSheet.tsx src/components/character/ src/pages/CombatTracker.tsx` → liste les accès à migrer en Tasks 4-5.

*(Pas de commit isolé — build rouge attendu jusqu'à Task 6.)*

---

### Task 4 : Migrer `VoiesTree.tsx` (voies par IRI)

**Files:**
- Modify: `app/src/components/character/VoiesTree.tsx`

Passer de l'affichage/édition des slots `voies.profile[]`/`racial`/`prestige` (par nom) à `characterVoies: CharacterVoieRef[]` : chaque entrée résout son nom + ses capacités via le compendium (par IRI) ; l'incrément/décrément de rang écrit `rank` (entier) au lieu de cocher `ranks[]`. Conserver le regroupement par `source` (profil/peuple/prestige) et le sélecteur de voie hybride (introduit en #22, par IRI désormais).

- [ ] **Step 1 : Adapter le composant** (suivre les usages listés en Task 3 Step 2 ; conserver le rendu et les interactions).
- [ ] **Step 2 : Vérifier les accès** : `docker compose exec -T frontend grep -n "ranks\|voies.profile\|voies.racial" src/components/character/VoiesTree.tsx` → vide.

---

### Task 5 : Migrer `CharacterSheet.tsx` + `CombatTracker.tsx`

**Files:**
- Modify: `app/src/pages/CharacterSheet.tsx`, `app/src/pages/CombatTracker.tsx`

Remplacer tous les accès `character.data.*` par `character.caracs` / `character.playState.*` / valeurs dérivées du hook. Pour `CombatTracker` : lire PV/DEF/Init depuis les dérivés (via cofRules ou le hook) et le `current` depuis `playState` — **ne plus** lire les max stockés (ils n'existent plus dans les données).

- [ ] **Step 1 : Adapter les deux pages** (suivre la table Task 3).
- [ ] **Step 2 : Vérifier** : `docker compose exec -T frontend grep -rn "\.data\." src/pages/CharacterSheet.tsx src/pages/CombatTracker.tsx` → vide.

---

### Task 6 : Mapping campagne (`campaignService.ts`) + types dérivés

**Files:**
- Modify: `app/src/utils/campaignService.ts` (ligne ~108), `app/src/components/character/types.ts` (vérif)

- [ ] **Step 1 : Adapter le mapping des personnages imbriqués**

Remplacer `data: c.data || {}` par le passage de `caracs`, `playState`, `characterVoies` (avec valeurs par défaut sûres). Vérifier les endroits où la liste des personnages d'une campagne est affichée (nom/niveau suffisent en général — ne pas sur-mapper).

- [ ] **Step 2 : Vérifier `components/character/types.ts`** compile (types dérivés via `ReturnType` — devrait suivre automatiquement une fois le hook migré).

---

### Task 7 : Validation d'intégration (gate atomique)

**Files:** aucun (vérification).

- [ ] **Step 1 : Type-check global**

Run: `docker compose exec -T frontend npx tsc -b`
Expected: **0 erreur**. (C'est le seuil atomique : il ne passe au vert qu'une fois Tasks 1-6 faites.)

- [ ] **Step 2 : Tests unitaires**

Run: `docker compose exec -T frontend npx vitest run`
Expected: tout vert (66 existants adaptés + nouveaux cofRules).

- [ ] **Step 3 : Lint (pas de nouvelle erreur)**

Run: `docker compose exec -T frontend npm run lint 2>&1 | tail -5`
Expected: pas d'augmentation vs baseline (~163 `no-explicit-any`).

- [ ] **Step 4 : E2E render-safety**

Run: `bash scripts/e2e.sh e2e/character-voies.spec.ts` (et tout autre spec fiche existant)
Expected: PASS (la fiche rend, la sélection de voies fonctionne). Réessayer une fois en cas de flake réseau (cf. mémoire e2e).

- [ ] **Step 5 : Commit (unique, tout le data-layer)**

```bash
git add app/src/types/character.ts app/src/utils/cofRules.ts app/src/utils/cofRules.test.ts app/src/hooks/useCharacterSheet.ts app/src/components/character/VoiesTree.tsx app/src/pages/CharacterSheet.tsx app/src/pages/CombatTracker.tsx app/src/utils/campaignService.ts app/src/components/character/types.ts
git commit -m "feat(character): migre le data-layer front vers caracs/playState/characterVoies (parité)"
```

> **Note d'exécution :** vu le seuil atomique, Tasks 1-6 ne produisent pas de build vert isolément. Deux options : (a) les exécuter en séquence puis committer une fois au vert (Task 7) — recommandé ; (b) si subagent-driven, dispatcher Tasks 1-6 comme **une seule tâche coordonnée** avec les 7 étapes de vérification finales, plutôt que 6 tâches à gate individuel (le reviewer juge sur le diff complet + build vert).

## Definition of Done (Phase 2)

- `Character.data` supprimé du type ; `caracs`/`playState`/`characterVoies` partout.
- Voies référencées par IRI (`CharacterVoieRef`) ; plus de voies par nom pour l'identité.
- Aucune valeur dérivée persistée (hp.max/def/init/luck.max/mp.max) — seuls les `current` sont dans `playState`.
- `tsc -b` 0 erreur ; `vitest` vert ; lint sans nouvelle erreur ; e2e fiche vert.
- Parité : création/chargement/sauvegarde/affichage équivalents à avant.

## Suite

**Phase 3** (dérivation complète `cofRules.ts` : PV par niveau + rétroactif, nombre de DR, langues, `resolveCapabilityEffect` avec dé évolutif/bonus/usages, non-cumul) — plan dédié après merge P2. **Phase 4** (UI dédiée aux nouvelles valeurs) et **Phase 5** (mécaniques spéciales : companions, états, transformations) suivent.
