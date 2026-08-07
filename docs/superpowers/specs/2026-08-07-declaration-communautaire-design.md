# Déclaration des états et invocations côté communautaire — conception

> Dernier volet du chantier ouvert par #154 (créatures) et #156 (personnages). Une capacité
> **communautaire** peut désormais déclarer les états qu'elle inflige et les entités qu'elle
> invoque, avec le même vocabulaire de données et le même rendu que l'officiel.

## Problème

Une capacité créée par un utilisateur n'a aucun moyen de déclarer ce qu'elle inflige. Les
capacités de créatures (#154) et de personnage (#156) le font ; la sienne non. L'iso entre
officiel et communautaire — le principe qui a guidé les trois chantiers de refonte — est donc
rompu sur ce point précis.

Deux obstacles concrets, vérifiés :

- `pruneToSchema` ne conserve que les clés **déclarées dans le schéma** de la catégorie.
  Écrire `states` sans l'y déclarer reviendrait à l'effacer à l'enregistrement.
- Les types de champ forment une liste fermée (`text`, `textarea`, `number`, `bool`, `select`,
  `lines`, `caracs`, `image`). Ni choix multiple, ni sélecteur d'entité n'existent.

## Décisions

- **Les états se choisissent dans une liste fermée**, celle des 8 états du compendium. Aucune
  saisie libre : la valeur enregistrée est toujours le nom canonique. C'est ce qui rend
  inutile ici la résolution d'orthographe écrite pour le bestiaire — il n'y a rien à résoudre
  quand rien ne peut être mal écrit.
- **Une invocation se choisit, elle ne se crée jamais depuis ce formulaire.** S'il manque une
  créature, on va la créer dans son espace propre. C'est le verrou contre l'enchaînement sans
  fin de formulaires, posé dès la conception de la création imbriquée.
- **Les listes viennent de la page, pas du champ.** `HomebrewFields` est purement
  présentationnel ; il le reste. Une prop facultative porte les états connus et les collections
  d'entités. Absente, les deux nouveaux champs ne s'affichent pas.
- **La résolution des liens reste à la page.** `CapabilityRefs` a besoin des états connus et des
  entités ; une feuille de présentation est pure et n'en charge aucune. `HomebrewDetail` charge
  et transmet.
- **Aucune migration.** `HomebrewEntry.data` est du JSON libre : les deux clés y entrent sans
  changement de schéma.

## Périmètre

**Dans le périmètre**

- Deux types de champ : `etats` (choix multiple fermé) et `invocations` (lignes typées).
- Les deux clés dans le schéma `capacite`, non obligatoires.
- Chargement des références par `HomebrewForm`, relais par `CapabilityBlocks`.
- Affichage sur la fiche d'une capacité communautaire et dans la carte au sein de sa voie.

**Hors périmètre**

- **Rendre une capacité communautaire jouable à la table.** Les voies d'un personnage sont
  celles du compendium (`VoieSource` = profil, peuple, prestige, hybride, trait) : aucune n'est
  communautaire. La valeur de ce chantier est la lecture et l'iso, pas l'action.
- La création d'entité depuis le sélecteur.
- Toute automatisation : une déclaration n'offre qu'un lien.

## Architecture

### Schéma

Deux entrées ajoutées au schéma `capacite` de `app/src/services/homebrewSchemas.ts` :

```ts
{ key: 'states', label: 'États infligés', type: 'etats', required: false },
{ key: 'summons', label: 'Invocations', type: 'invocations', required: false },
```

`required: false` explicite, conformément au contrat du chantier 2 : l'indicateur n'est jamais
déduit. Les deux clés portent exactement la forme des capacités officielles — `string[]` de noms
canoniques, et `{ type, ref, quantity? }[]` — pour que `etatsDeclares` et `resoudreInvocation`
s'appliquent sans adaptation.

### Références transmises

`HomebrewFields` gagne une prop facultative :

```ts
/** Entités existantes nécessaires aux champs `etats` et `invocations`. Absente, ces deux
 *  champs ne sont pas rendus : mieux vaut ne rien proposer qu'un sélecteur vide. */
references?: {
    etats: HarmfulState[];
    sources: SourcesInvocation;
};
```

`HomebrewForm` charge une fois — `DataService.getStates`, `getCreatures`, `getWeapons` et
`getArmors` ; `getMonsters` de `services/monsterService` ; `HomebrewService.getAll` — et
transmet. `CapabilityBlocks` relaie la
prop aux capacités imbriquées d'une voie — sans quoi une capacité saisie dans une voie n'aurait
pas les mêmes champs qu'une capacité autonome, ce qui casserait l'iso à l'intérieur même du
communautaire.

Un échec de chargement laisse la collection vide : le champ concerné disparaît, la saisie du
reste continue.

### Rendu de saisie

**`etats`** : une pastille cliquable par état connu, active ou non. Le clic bascule. La valeur
stockée est le tableau des noms sélectionnés, dans l'ordre du compendium — pas dans l'ordre des
clics, pour que deux capacités identiques produisent la même donnée.

**`invocations`** : une ligne par invocation, chacune portant un choix de type
(créature / objet), un choix d'entité parmi les existantes du type retenu, une quantité, et un
bouton de retrait. Un bouton « Ajouter une invocation » sous la liste. Une ligne dont l'entité
n'est pas choisie n'est pas enregistrée — elle ne vaut rien et polluerait la donnée.

### Affichage

`SheetCapabilityRef` et `CapaciteSheetVM` gagnent `states?: string[]` et
`summons?: CapabilitySummon[]`, peuplés par `fromHomebrew.ts`.

`VoieSheet` et `CapaciteSheet` reçoivent une prop facultative `references` de même forme, qu'ils
transmettent à `CapabilityRefs` — déjà écrit et déjà partagé avec la fiche de créature et le
suivi de combat. Absente, aucune pastille : le contrat de dégradation propre s'applique.

`HomebrewDetail` charge les références et les passe, comme il charge déjà les capacités d'une
voie.

## Tests

- **Unitaires** : `pruneToSchema` conserve `states` et `summons` sur une capacité ;
  `validateHomebrew` accepte une capacité sans aucune des deux ; l'adaptateur communautaire
  reporte les deux clés dans le view-model.
- **Rendu (jsdom)** : le choix multiple coche et décoche un état, et la valeur remontée est un
  tableau de noms canoniques ; une ligne d'invocation s'ajoute, se remplit et se retire ; une
  ligne sans entité choisie n'est pas remontée ; sans la prop `references`, aucun des deux
  champs n'est rendu.
- **Rendu (jsdom)** sur les feuilles : une capacité communautaire portant un état affiche sa
  pastille quand les références sont fournies, et rien quand elles ne le sont pas.
- **Navigateur** : créer une capacité communautaire déclarant un état et une invocation de
  créature ; vérifier les pastilles sur sa fiche **et** dans la carte au sein de sa voie ;
  vérifier qu'un lien mène à sa cible. Desktop 1280×900 et mobile 390×844, sans débordement
  horizontal ni erreur console.

## Risques

- **Le formulaire devient chargeur de données.** Il était statique ; il consultera six
  collections. C'est le vrai coût de ce chantier. Mitigation : chargement unique au niveau de la
  page, collections déjà mises en cache par `DataService`, et échec silencieux qui masque le
  champ sans bloquer la saisie du reste.
- **Deux nouveaux types de champ dans une liste fermée.** Chaque type ajouté alourdit le
  `switch` de `HomebrewFields`. Accepté : c'est le prix d'un formulaire piloté par schéma, et
  l'alternative — un bloc écrit à la main hors schéma — ferait perdre l'élagage, la validation
  et l'aperçu.
- **Valeur limitée à la lecture.** Une capacité communautaire ne sert toujours pas à la table.
  Le chantier vaut pour l'iso ; si les voies communautaires deviennent un jour jouables, la
  donnée sera déjà là.
