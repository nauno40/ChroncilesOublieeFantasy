# Capacités au suivi de combat — états déclarés et invocations

> Premier volet du second temps du chantier 3. Le premier temps (création imbriquée
> voie → capacités) est livré (PR #151, #152, #153). Ce volet construit le **pont** entre
> les capacités et la table ; la déclaration côté communautaire viendra ensuite et se
> branchera sur les mêmes clés.

## Problème

Le suivi de combat n'affiche **aucune** capacité. Quand un troll utilise « Fauchage », le
MJ sait de mémoire — ou en ouvrant le bestiaire dans un autre onglet — que la cible doit
être Renversée, puis il applique l'état à la main par une liste déroulante.

L'information existe pourtant : **122 capacités de créatures sur 393** nomment un état en
toutes lettres, et **92 créatures sur 219** en portent au moins une. Elle n'est simplement
reliée à rien.

L'utilisateur l'avait formulé ainsi : « dire si il y a des états déclenchés, des
invocations ? ».

## Décisions

- **Déclaration, pas détection.** Une capacité déclare les états qu'elle inflige dans une
  clé dédiée. Écarté : détecter les noms d'états dans le texte à l'exécution — cela
  fonctionnait sur les 122 capacités sans rien saisir, mais fait dépendre une mécanique de
  jeu d'une heuristique textuelle, invisible et impossible à corriger cas par cas.
- **La détection devient un outil d'amorçage.** Un script d'auteur, exécuté une seule fois,
  propose les déclarations à partir du texte ; elles sont relues puis **commitées comme
  donnée**. Ce qui tourne à l'exécution ne lit qu'une déclaration.
- **Les invocations sont prévues dès maintenant**, bien que seules 4 capacités de créatures
  en évoquent une. Le coût est faible tant que le mécanisme est posé avec le reste ; le
  rajouter après aurait demandé de rouvrir la donnée, l'affichage et le suivi de combat.
- **Les invocations officielles se référencent par nom.** `Creature` utilise
  `#[ORM\GeneratedValue]` et `AppFixtures::loadCreatures()` ne reprend pas l'`id` du JSON :
  l'identifiant d'une créature change à chaque rechargement des fixtures. Une référence par
  identifiant serait cassée. Les monstres maison, eux, portent un identifiant stable.
- **Rien n'est automatique.** Une déclaration ne fait qu'offrir un bouton ; c'est le MJ qui
  applique. Le jeu reste à la table, conformément à la vision du produit.

## Périmètre

**Dans le périmètre**

- Deux clés facultatives sur une capacité de créature : `states` et `summons`.
- Amorçage des déclarations d'états sur le bestiaire officiel (`backend/data/creatures.json`).
- Affichage des capacités d'un combattant issu du bestiaire dans le suivi de combat.
- Application d'un état déclaré à un combattant choisi, en deux clics.
- Ajout au combat d'une créature invoquée, en réutilisant le chemin d'ajout existant.

**Hors périmètre**

- Les capacités des **personnages joueurs** : elles passent par les voies (`CharacterVoie`,
  `Capability`), un tout autre chemin de données.
- La **déclaration côté communautaire** (formulaire d'une capacité homebrew) : tranche
  suivante, qui consommera les mêmes clés.
- Toute automatisation : aucun état appliqué sans geste du MJ.
- L'amorçage des **invocations** officielles : les 4 capacités concernées relèvent d'une
  lecture au cas par cas, sans valeur suffisante ici. Le mécanisme est en place, la donnée
  viendra si le besoin se confirme.

## Architecture

### Données

Une capacité de créature (`Creature.capabilities` et `CustomCreature.capabilities`, tableau
JSON libre dans les deux cas) accepte deux clés facultatives :

```json
{
  "label": "Fauchage",
  "description": "…la victime doit réussir un test de FOR ou de AGI … ou être Renversée.",
  "states": ["Renversé"],
  "summons": [{ "creature": "Loup", "quantity": 1 }]
}
```

- `states` : tableau de **noms d'états**, tels que portés par `HarmfulState.name`. Le nom
  plutôt que l'identifiant, pour la même raison que les créatures — et parce que le suivi de
  combat stocke déjà les états d'un combattant sous forme de noms.
- `summons` : tableau d'objets `{ creature, quantity }`. `creature` vaut le **nom** d'une
  créature officielle, ou `custom-<id>` pour un monstre maison — la convention de préfixe
  déjà utilisée par `CombatTracker` pour `referenceId`. `quantity` est un entier ≥ 1 ;
  absent, il vaut 1.

Aucun changement de schéma : `capabilities` est déjà du JSON libre côté serveur. Aucune
migration du format persisté du suivi de combat : les états d'un combattant sont déjà un
`string[]` de noms, et le combattant porte déjà `source` et `referenceId`.

### Amorçage

Un script d'auteur, `scripts/declarer-etats.mjs`, lit `backend/data/creatures.json`, cherche les 8 noms
d'états dans le texte de chaque capacité (insensible à la casse, aux accents et aux accords
— les formes féminines n'ajoutent qu'un suffixe : « Renversée », « Immobilisée ») et écrit
les `states` correspondants.

Il n'est **pas** exécuté par l'application : son résultat est relu, corrigé, puis commité.
Le compte exact et les cas douteux sont présentés avant commit. Le script reste au dépôt,
documenté comme outil de saisie unique, pour pouvoir être rejoué si le bestiaire s'enrichit.

### Fonctions pures

Trois fonctions dans `app/src/domain/`, testables sans DOM :

```ts
/** Capacités d'un combattant, quand il vient du bestiaire. `undefined` sinon
 *  (ajout manuel, personnage joueur) ou si la créature référencée n'existe plus. */
export const capacitesDuCombattant = (
    combattant: Combatant,
    creatures: Creature[],
    monstresMaison: CustomCreature[],
): CreatureCapability[] | undefined => { /* … */ };

/** États déclarés par une capacité, filtrés sur ceux qui existent réellement :
 *  une déclaration périmée ne doit pas produire une pastille inapplicable. */
export const etatsDeclares = (
    capacite: CreatureCapability,
    etatsConnus: HarmfulState[],
): string[] => { /* … */ };

/** Créature désignée par une référence d'invocation : nom pour l'officiel,
 *  `custom-<id>` pour un monstre maison. `undefined` si introuvable. */
export const resoudreInvocation = (
    reference: string,
    creatures: Creature[],
    monstresMaison: CustomCreature[],
): Creature | CustomCreature | undefined => { /* … */ };
```

`capacitesDuCombattant` s'appuie sur `combattant.source === 'bestiary'` et
`combattant.referenceId`, en reconnaissant le préfixe `custom-` déjà employé par
`CombatTracker.addFromBestiary`.

### Interface

La ligne d'un combattant issu du bestiaire gagne un repli **« Capacités (n) »**, absent
quand la fonction ne renvoie rien. Déplié, il liste les capacités : nom, texte, et selon la
déclaration :

- **une pastille par état déclaré.** Un clic ouvre la liste des combattants ; choisir une
  cible pose l'état sur elle. Deux clics, pas de mode de ciblage global — rien qui puisse
  rester coincé si le MJ change d'avis.
- **un bouton par invocation.** Un clic ajoute la ou les créatures aux combattants, par le
  même chemin que l'ajout depuis le bestiaire : initiative, PV, DEF, départage, et
  numérotation quand la quantité dépasse 1.

L'ajout manuel d'un état par liste déroulante reste inchangé : le nouveau chemin est un
raccourci, pas un remplacement.

### Dégradations

Le contrat de dégradation propre du dépôt s'applique — une section sans donnée n'est pas
rendue :

| Situation | Comportement |
|---|---|
| Combattant ajouté à la main, ou personnage joueur | Pas de repli « Capacités » |
| Créature référencée supprimée depuis l'ajout (monstre maison effacé) | Pas de repli, pas d'erreur |
| Capacité sans `states` ni `summons` | Affichée, sans pastille ni bouton |
| État déclaré absent du compendium | Pastille masquée |
| Liste des états indisponible (appel en échec) | Capacités affichées, aucune pastille |
| Invocation dont la créature est introuvable | Bouton absent |

## Tests

- **Unitaires** sur les trois fonctions pures : combattant manuel et personnage joueur
  (aucune capacité) ; monstre maison via le préfixe `custom-` ; référence introuvable ;
  état déclaré inconnu du compendium ; invocation résolue par nom, par préfixe, et en échec ;
  quantité absente valant 1.
- **Unitaires** sur le script d'amorçage : les formes féminines et plurielles sont
  reconnues, un mot qui contient un nom d'état sans l'être ne l'est pas.
- **Rendu (jsdom)** : un combattant du bestiaire affiche ses capacités ; un clic sur une
  pastille pose l'état sur la cible choisie et non sur une autre ; un clic sur une
  invocation ajoute le bon nombre de combattants ; un combattant manuel n'affiche pas le
  repli.
- **Navigateur** : un troll ajouté au combat, sa capacité « Fauchage », « Renversé » posé
  sur un personnage joueur. Pour l'invocation — dont la donnée officielle n'est pas amorcée,
  cf. « Hors périmètre » — un **monstre maison** portant une capacité à `summons` est créé
  pour la vérification, puis son invocation est ajoutée au combat. Aucune erreur console,
  aucun débordement horizontal, vérifié en 1280×900 et 390×844.

## Risques

- **Déclarations fausses ou manquantes après l'amorçage.** Le script propose, un humain
  relit. Une déclaration erronée reste corrigible dans la donnée, ce qui était l'argument
  principal contre la détection.
- **Le repli alourdit une ligne de combattant**, alors que le suivi de combat sert sous
  pression. Mitigation : replié par défaut, et le compte dans le libellé permet d'ignorer
  les créatures sans capacité intéressante.
- **Référence d'invocation par nom.** Renommer une créature officielle casserait le lien.
  Accepté : les noms du bestiaire sont stables, et l'alternative — l'identifiant — est
  déjà cassée par la régénération des fixtures.
