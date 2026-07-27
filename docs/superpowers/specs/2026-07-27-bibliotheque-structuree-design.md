# Bibliothèque structurée — design

**Objectif** : rendre la création dans la Bibliothèque (HomebrewEntry) fidèle au schéma des entités du compendium, comme « Mes Monstres » (CustomCreature) l'est pour les créatures. Aujourd'hui : un simple champ `description` libre → ressemble à un carnet d'idées. Cible : un formulaire structuré par catégorie, à schéma complet.

**Décisions produit** (validées) : schéma **complet fidèle** par catégorie ; livraison **par vagues** ; le contenu reste dans la **Bibliothèque** (surface séparée, non fusionnée dans les listes du compendium public).

## Architecture

- **Backend** : `HomebrewEntry` reçoit un champ **`data` (JSON, nullable)** — schéma-less, comme `CustomCreature.stats` / `Voie.details`. Les champs structurés par catégorie y sont stockés. `category` / `name` / `visibility` inchangés ; `description` reste (résumé court, en plus de `data`). Migration + `data` dans les groupes `homebrew:read`/`homebrew:write`. Entrées existantes : `data = null` → compatibles.
- **Frontend** :
  - `app/src/services/homebrewSchemas.ts` : définit, par catégorie, la liste des champs `{ key, label, type, options?, help? }`. Types : `text | textarea | number | bool | select | caracs | lines`.
  - Composant générique `HomebrewFields` : rend le formulaire d'une catégorie depuis son schéma, écrit dans `data`. `caracs` = grille AGI/CON/FOR/PER/CHA/INT/VOL (comme MonsterForm) → objet ; `lines` = éditeur de lignes répétables → `string[]`.
  - `Bibliotheque.tsx` : après le choix de catégorie → nom + `HomebrewFields` + visibilité. Fiche de détail : rendu structuré étiqueté (champs vides masqués), calqué sur les pages compendium.
  - `homebrewService` : `data` dans le type + le payload.

## Mapping des champs (fidèle aux entités)

### Vague 1 — race, classe, objet-magique, sort, état

- **race** (→ `Race`) : `modifiers` (caracs) · `speed` (text) · `minHeight`/`maxHeight` (number, cm) · `minWeight`/`maxWeight` (number, kg) · `startingAge` (number) · `lifeExpectancy` (number) · `physicalTraits` (textarea) · `publicPerception` (textarea) · `abilities` (textarea) · `roleplay` (textarea) · `typicalNames` (textarea) · `detailedDescription` (textarea).
- **classe** (→ `Profile`) : `family` (text) · `note` (textarea) · `lore` (lines) · `weaponsAuth` (lines) · `armorAuth` (lines) · `armorMaxDef` (number) · `magicStat` (select: —/FOR/DEX/CON/INT/SAG/CHA→VOL, en libellés COF2 AGI/CON/FOR/PER/CHA/INT/VOL) · `stats` (caracs) · `startingEquipment` (lines) · `masteries` (lines).
- **objet-magique** (→ `Equipment`) : `type` (text) · `rarity` (select: Commun/Rare/Très rare/Légendaire) · `price` (text) · `weight` (number) · `material` (text) · `quality` (text) · `damage` (text) · `range` (text) · `critical` (text) · `acBonus` (number) · `acMaxAgi` (number) · `acPenalty` (number) · `properties` (lines, effets magiques).
- **sort** (→ `Capability`, `isSpell=true`) : `rank` (number) · `actionType` (text) · `limited` (bool) · `effect` (lines) · `details` (lines).
- **état** (→ `HarmfulState`) : schéma réel = nom + description → aucun champ `data` supplémentaire.

### Vagues suivantes (mêmes principes)

- **voie** (→ `Voie`) : `category` (text) · `maxRank` (number) · `details` (lines).
- **capacite** (→ `Capability`) : `rank` (number) · `actionType` (text) · `isSpell` (bool) · `limited` (bool) · `effect` (lines) · `details` (lines).
- **equipement** (→ `Equipment`) : même schéma qu'objet-magique.
- **poison** (→ `Poison`) : `effectFail` · `effectSuccess` · `duration` · `delay` · `note` (text/textarea).
- **piege** (→ `Trap`) : `detectDifficulty` · `disarmDifficulty` · `effect` · `complement`.
- **autre** : générique (nom + description seuls).

## Rendu / tests

- Fiche de détail : liste étiquetée par champ, `caracs` en grille, `lines` en puces. Champs vides masqués.
- Backend : tests existants (`HomebrewEntryTest`) doivent rester verts (`data` nullable). Ajouter un test « create with data » (round-trip du JSON).
- Gates : tsc 0, lint 0 nouveau, vitest, phpunit HomebrewEntryTest.
