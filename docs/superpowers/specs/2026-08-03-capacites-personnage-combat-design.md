# Capacités de personnage au suivi de combat — conception

> Suite de #154, qui a relié les capacités de **créatures** aux états et invocations. Ce
> chantier fait la même chose pour les capacités de **personnage**, et amorce la donnée
> officielle correspondante. La déclaration côté communautaire viendra ensuite : elle
> consommera les mêmes clés.

## Problème

`capacitesDuCombattant` ne répond que pour un combattant venu du bestiaire. Un personnage
joueur ajouté au suivi de combat n'expose donc **aucune** capacité, alors que le MJ a
précisément besoin de savoir ce que le personnage peut déclencher.

Et aucune capacité officielle de personnage ne déclare d'état : l'amorçage de #154 n'a touché
que `backend/data/creatures.json`. Les fichiers de profils et de peuples portent pourtant
**385 capacités, dont 45 mentionnent un état**.

Afficher sans amorcer donnerait un panneau vide de sens ; amorcer sans afficher ne servirait
qu'au compendium. Les deux vont ensemble.

## Décisions

- **Les capacités d'un personnage sont filtrées par le rang acquis.** `characterVoies[]` porte
  `{ voie: IRI, rank }` ; un rang 3 donne les capacités 1 à 3, pas les cinq. Afficher les cinq
  proposerait au MJ des capacités que le personnage ne possède pas.
- **Deux colonnes sur `Capability`, pas une clé dans `details`.** `details` est rendu tel quel
  par `DynamicDetailsRenderer` : un `details.states` s'afficherait en JSON brut sur la fiche de
  la capacité. `Capability` étant une entité et non du JSON libre, il faut de vraies colonnes.
- **`summons` est posée mais non amorcée.** Aucune capacité de personnage n'invoque dans les
  données actuelles. La colonne existe pour que le jour où une invocation apparaît, aucune
  migration ni reprise de donnée ne soit nécessaire — la même précaution qu'en #154.
- **Le rendu ne bouge pas.** `CapabilityRefs` et `CombatantCapabilities` prennent déjà la forme
  attendue ; les réutiliser tels quels est ce qui garantit que le PJ et la créature s'affichent
  à l'identique.
- **Aucun rechargement de fixtures.** La base de développement porte du contenu à conserver.
  La migration ajoute deux colonnes **nullables** — aucune perte.

## Périmètre

**Dans le périmètre**

- Colonnes `states` et `summons` sur `Capability`, nullables, avec leur migration et leur
  chargement par `AppFixtures`.
- Fonction pure `capacitesDuPersonnage`, filtrée par rang acquis.
- Branchement dans le suivi de combat, à côté du chemin bestiaire existant.
- Amorçage des déclarations d'états sur les 14 fichiers de profils (`paths[].abilities[]`) et
  les 8 de peuples (`voies[].abilities[]`) — deux formes différentes, vérifiées.

**Hors périmètre**

- La **déclaration côté communautaire** (formulaire d'une capacité homebrew) : chantier
  suivant, qui consommera les mêmes clés.
- L'amorçage des **invocations** : aucune donnée candidate.
- Toute automatisation : une déclaration n'offre qu'un bouton, le MJ agit.

## Architecture

### Modèle de données

Deux colonnes sur `backend/src/Entity/Capability.php`, à l'image de `effect` et `details` qui
sont déjà des `JSON` nullables :

```php
#[ORM\Column(type: Types::JSON, nullable: true)]
#[Groups(['capability:read'])]
private ?array $states = null;

#[ORM\Column(type: Types::JSON, nullable: true)]
#[Groups(['capability:read'])]
private ?array $summons = null;
```

`states` porte des **noms d'états** (`HarmfulState.name`), `summons` des objets
`{ type, ref, quantity? }` — exactement la forme retenue en #154 pour les créatures, de sorte
que `resoudreEtat`, `etatsDeclares` et `resoudreInvocation` s'appliquent sans adaptation.

**Quatre endroits** d'`AppFixtures` construisent une `Capability`, et non un seul — vérifié :
les capacités de voies de peuple, celles des voies de prestige, celles des voies de profil, et
`loadCapabilities()` qui lit `capacites.json`. Chacun doit lire les deux clés, sinon une partie
du compendium resterait muette sans que rien ne le signale. Absentes du JSON, les clés laissent
les colonnes nulles.

C'est aussi la raison pour laquelle l'amorçage vise les fichiers de **profils** et de
**peuples** : c'est de là que viennent ces capacités.

### Fonction pure

Dans `app/src/domain/capabilityRefs.ts`, sœur de `capacitesDuCombattant` :

```ts
/** Capacités d'un combattant PERSONNAGE : celles de ses voies dont le rang est acquis.
 *  `undefined` pour tout autre combattant, pour un personnage introuvable, ou quand
 *  aucune capacité n'est acquise. */
export const capacitesDuPersonnage = (
    combattant: Combatant,
    personnages: Character[],
    capacites: Capacity[],
): CustomCreatureCapability[] | undefined => { /* … */ };
```

Elle s'appuie sur `combattant.source === 'character'` et `combattant.referenceId`, puis, pour
chaque `characterVoies[]`, retient les capacités dont la voie correspond — la référence de voie
d'une capacité est tantôt une IRI (`/api/voies/123`), tantôt un identifiant brut, comme
`capsOfVoie` le gère déjà dans `fromOfficial.ts` — **et dont `rank` est ≤ au rang acquis**.

Les capacités sont projetées vers la forme que consomment les composants : `name`,
`description`, `states`, `summons`. Le tri est par rang croissant, comme partout ailleurs.

### Suivi de combat

Dans `CombatTracker.tsx`, le bloc qui rend `CombatantCapabilities` interroge désormais les deux
fonctions, dans l'ordre : `capacitesDuCombattant` (bestiaire) puis `capacitesDuPersonnage`
(personnage). La première qui répond gagne ; aucune ne répond pour un ajout manuel.

Le tracker charge déjà `characters` ; il lui faut en plus les capacités du compendium
(`DataService.getCapabilities()`, déjà en cache).

### Amorçage

`scripts/declarer-etats.mjs` est étendu aux `backend/data/Profils/*.json` (14) et
`backend/data/Races/*.json` (8). Le fichier traité est passé en argument ; le comportement ne
change pas : il **propose**, n'écrit qu'avec `--ecrire`, et signale les tournures suspectes.

Le crible sémantique ajouté au round de correction de #154 sert directement ici : il repère
« immunisé contre », « pour éviter d'être », « s'en débarrasser », « si la cible est ». Sur le
bestiaire, il couvrait 14 des 15 faux positifs.

La relecture humaine reste la règle : le compte exact et les cas douteux sont présentés avant
commit.

### Affichage au compendium

Rien à écrire. `CapabilityRefs` est déjà consommé par `CapabilityCard` : dès que l'API sert la
colonne, les pastilles apparaissent sur la fiche d'une voie officielle et sur celle d'une
capacité, exactement comme pour une créature.

## Tests

- **Unitaires** sur `capacitesDuPersonnage` : filtrage par rang acquis (rang 3 ⇒ 3 capacités,
  pas 5) ; combattant venu du bestiaire ou ajouté à la main (rien) ; personnage introuvable ;
  voie du personnage absente du compendium ; capacité référençant sa voie par IRI **et** par
  identifiant brut ; tri par rang croissant.
- **Unitaires backend** : une capacité chargée depuis un JSON portant `states` expose la
  colonne ; une capacité sans la clé la laisse nulle.
- **Rendu (jsdom)** : un combattant personnage affiche ses capacités ; une pastille pose l'état
  sur la cible choisie.
- **Navigateur** : un personnage ajouté au suivi de combat expose ses capacités acquises et non
  les autres ; une pastille pose l'état sur un autre combattant. Vérifié en 1280×900 et 390×844,
  sans débordement horizontal ni erreur console.

## Risques

- **Déclarations fausses après l'amorçage** — le risque principal, déjà matérialisé en #154 où
  15 déclarations sur 121 étaient des préconditions ou des résistances. Parade inchangée : le
  script propose, un humain relit, et le crible sémantique signale les tournures à risque.
- **Migration sur une table du compendium.** Deux colonnes nullables, aucune donnée touchée, et
  **aucun rechargement de fixtures** : la base de développement porte du contenu à conserver.
- **Rang acquis mal interprété.** Afficher toutes les capacités d'une voie proposerait au MJ des
  actions que le personnage ne possède pas. C'est le premier cas testé.
