# Back-office : les entités sans contrôleur

**Date** : 2026-08-14
**État** : validé, prêt pour le plan d'implémentation

## Le problème

Le back-office EasyAdmin couvre 9 entités sur 28. Les 19 autres n'ont aucune interface : corriger le prix d'une monture, relire les effets d'un poison, retirer une création communautaire abusive ou comprendre pourquoi la fiche d'un joueur ne s'ouvre plus demande aujourd'hui une requête SQL à la main.

Deux corrections récentes cadrent le travail. `/admin` est désormais réservé à `ROLE_ADMIN` (le pare-feu `main` ne déclarait aucun authentificateur, donc personne n'était jamais connecté, donc rien n'était vérifié). Et toute entité citée par un `AssociationField` doit porter un `__toString()`, sans quoi les pages d'édition **et** de création répondent 500 — panne restée invisible parce que les pages d'index, elles, répondaient 200.

## Périmètre

**27 contrôleurs CRUD** (28 entités moins `PasswordResetToken`) plus le tableau de bord.

`PasswordResetToken` est exclu : un jeton de réinitialisation est un secret à durée de vie courte, l'afficher dans une interface est un risque et non une fonctionnalité.

### Famille A — compendium, écriture complète (17)

Les 9 contrôleurs actuels (User, Race, Family, Profile, Voie, Capability, CreatureFamily, Creature, Equipment) plus **Food, Lodging, Material, Mount, HarmfulState, Poison, Trap, CreatureVoie**.

Ce sont des données de référence, seedées par les fixtures et lisibles publiquement par l'API. Les corriger dans le back-office est la vocation même de l'outil.

Les sept nouvelles fiches sont plates (nom, prix, notes) ; `HarmfulState.effects` est la seule colonne JSON du lot. `CreatureVoie` porte la jointure créature ↔ voie avec son rang, donc un formulaire à deux listes déroulantes : elle exige un `__toString()` sur `Creature`.

### Familles B et C — consulter et supprimer (10)

**B, domaine campagne** : Campaign, Quest, Clue, Session, Encounter, CampaignMembership, Character, CharacterVoie.
**C, contenu communautaire** : HomebrewEntry, CustomCreature.

Ni création ni modification. Ces données appartiennent à un utilisateur et sont écrites par le front, qui applique des règles — propriétaire, appartenance à la campagne, dérivations de la fiche — qu'un formulaire EasyAdmin ignore. Écrire `Character.caracs` à la main produirait une fiche que le front refuserait d'ouvrir. Consulter et supprimer couvre le besoin réel : diagnostiquer, modérer, purger.

**Choix explicite et ses conséquences** : exposer la famille B donne à tout `ROLE_ADMIN` la lecture des notes privées d'un MJ, des indices de ses quêtes et des fiches de tous les joueurs. C'est assumé — l'administrateur est aujourd'hui l'exploitant du service, qui a de toute façon la base. À reconsidérer le jour où `ROLE_ADMIN` serait accordé à un modérateur qui n'est pas l'exploitant.

## Architecture

```
src/Controller/Admin/
├── AbstractWritableCrudController.php     famille A : CRUD complet
├── AbstractReadDeleteCrudController.php   familles B et C : consulter + supprimer
├── DashboardController.php                menu à 5 sections françaises repliées
└── <Entité>CrudController.php  × 27       squelettes
src/Admin/Field/
├── JsonField.php                          CodeEditorField(js) + transformateur
└── JsonToStringTransformer.php
```

Le comportement commun vit dans deux classes de base, pas dans vingt-sept fichiers. Chaque contrôleur concret ne déclare que son entité — une dizaine de lignes — et n'ajoute un `configureFields()` que s'il a une vraie raison.

L'alternative écartée : lister les champs à la main dans chaque contrôleur. Sept cents lignes qui redisent le schéma Doctrine, et toute colonne ajoutée demain reste invisible jusqu'à ce que quelqu'un pense à éditer le contrôleur. C'est précisément ce qui a laissé `title` — un champ que `Race` n'a jamais eu — faire répondre 500 à la page entière.

Les deux classes portent un nom de **comportement**, pas de domaine : `User` reçoit un CRUD complet sans être du compendium, et le jour où une entité de référence deviendrait consultable seulement, elle changera de base sans changer de sens.

### `AbstractWritableCrudController`

Reprend les champs par défaut d'EasyAdmin (`FieldProvider::getDefaultFields()`, ce que fait déjà `AbstractCrudController::configureFields()`) et remplace les colonnes JSON par un `JsonField` éditable.

### `AbstractReadDeleteCrudController`

Mêmes champs, JSON en lecture seule, et `configureActions()` retire `Action::NEW` et `Action::EDIT`. EasyAdmin refuse alors aussi les routes correspondantes — la restriction n'est pas seulement visuelle.

### `JsonField`

`CodeEditorField` en langage `js` (`json` ne figure pas dans les langages autorisés par EasyAdmin) plus un transformateur `array` ↔ chaîne, la colonne étant un tableau PHP.

Le repérage des colonnes est **piloté par les métadonnées Doctrine** : la classe de base parcourt `ClassMetadata` et remplace tout champ dont `getTypeOfField()` vaut `json`. Cela attrape les deux écritures qui coexistent dans le projet — `#[ORM\Column(type: Types::JSON)]` et le `?array` dont Doctrine déduit le type — et couvre les colonnes ajoutées plus tard sans que personne ait à y penser.

Colonnes concernées aujourd'hui : `Capability.effect`, `Race.modifiers`, `Profile.weaponsAuth`/`armorAuth`/`lore`/`stats`/`startingEquipment`/`masteries`, `Equipment.properties`, `HarmfulState.effects`, `Creature` et `CustomCreature` (`stats`, `statsSuperior`, `specialAbilities`, `attacks`, `capabilities`), `Character.caracs`/`playState`, `Encounter.combatants`, `HomebrewEntry.data`.

Effet voulu : `Capability.effect`, masqué faute de rendu correct, redevient **visible en lecture**. C'est un JSON dérivé par `CapabilityEffectBuilder` au chargement des fixtures — on veut l'inspecter, pas le saisir ; une saisie serait écrasée au chargement suivant. Il reste donc en lecture seule bien qu'il appartienne à la famille A.

### Menu

Cinq sections repliées, en français — le menu est aujourd'hui le dernier endroit du produit qui dit « Game Data ».

| Section | Entités |
|---|---|
| Comptes | User |
| Compendium (règles) | Race, Family, Profile, Voie, Capability, Equipment, Material, Food, Lodging, Mount, HarmfulState, Poison, Trap |
| Bestiaire | CreatureFamily, Creature, CreatureVoie |
| Contenu communautaire | HomebrewEntry, CustomCreature |
| Données des utilisateurs | Campaign, CampaignMembership, Quest, Clue, Session, Encounter, Character, CharacterVoie |

Le regroupement dit aussi la sensibilité : les données d'utilisateurs sont visiblement à part.

## Suppression : ce qui n'est pas garanti

Supprimer depuis le back-office suit les cascades Doctrine, qui n'ont pas été écrites pour cet usage. Là où il n'y a pas de cascade, Postgres refuserait par clé étrangère et la page rendrait une erreur brute.

**Mesuré** (`tests/Admin/BackOfficeSecurityTest.php::testAdminDeletesUserData`) : les 10 sections B et C se suppriment toutes, **à condition de supprimer les feuilles avant les racines** — `campaign` porte `orphanRemoval: true` sur ses quêtes, indices, séances, rencontres et adhésions, et `character` porte la même chose sur ses voies de personnage ; Doctrine efface donc ces lignes en cascade dès que la racine est supprimée. Un ordre racine-avant-feuille fait échouer le balayage (la ligne dépendante, déjà effacée, répond 404), sans que ce soit un refus par clé étrangère.

Mais ce balayage teste un état artificiel : dans le jeu d'essai, `character` est supprimé avant `campaign`, et `BackOfficeFixture` ne rattache de toute façon jamais l'un à l'autre. Or un personnage de joueur réellement rattaché à sa campagne est l'état normal du produit. `Character::$campaign` est un `ManyToOne` nullable, mais la migration `Version20260301194224.php` pose la clé étrangère `character.campaign_id → campaign.id` **sans clause `ON DELETE`**, donc `RESTRICT` par défaut chez Postgres ; côté ORM, `Campaign::$characters` ne porte que `cascade: ['persist']`, sans `orphanRemoval`, donc Doctrine ne l'efface pas en cascade non plus.

**Mesuré séparément** (`testCampaignDeletionIsRefusedWhenACharacterIsAttached`, hors du balayage à deux listes — l'ordre de celui-ci aurait déjà supprimé le personnage bloquant) : un administrateur qui tente de purger une campagne à laquelle un personnage est rattaché **se voit refuser la suppression**. EasyAdmin attrape la `ForeignKeyConstraintViolationException` de Doctrine et répond **409**, avec un message qui nomme l'entité et l'exception d'origine — pas une erreur 500 brute, mais un refus propre côté HTTP. La campagne reste en base. C'est le cas concret que cette section promettait de documenter ; il n'est pas hypothétique, c'est l'état courant d'une campagne jouée.

Les cascades du domaine campagne ne seront pas modifiées : changer le produit pour arranger son outil d'administration serait le mauvais sens.

## Tests

`tests/Admin/BackOfficeSecurityTest.php` passe d'une liste écrite à la main à un parcours des 27 sections :

- **accès** — 401 anonyme, 403 joueur connecté, 200 administrateur ;
- **famille A** — index, création et édition rendus pour les 17 sections ;
- **familles B et C** — index et détail rendus, `new` et `edit` refusés pour les 10 sections ;
- **suppression** — un cas par famille, vérifié en base.

Le jeu d'essai sème **une ligne par entité citée en association** et sort du fichier de test dans un `BackOfficeFixture` réutilisable. Ce n'est pas du confort : sur une base vide, aucune entité n'est jamais convertie en chaîne, la panne surveillée disparaît, et le test redevient un faux vert.

## Ce que cette spec ne fait pas

- **Aucune règle métier nouvelle.** Le back-office lit et écrit ce que le schéma expose ; les dérivations restent au front et aux fixtures.
- **Aucun changement de l'API.** Les entités ne gagnent que des `__toString()`, sans effet sur la sérialisation.
- **Aucun changement des cascades de suppression.**
- **Pas d'internationalisation** : les libellés sont écrits en français en dur, comme le reste du back-office l'est en anglais aujourd'hui.
