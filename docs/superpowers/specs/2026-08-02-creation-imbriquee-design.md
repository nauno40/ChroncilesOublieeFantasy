# Création imbriquée voie → capacités — design

> Chantier 3, premier temps. Les chantiers 1 (iso officiel ↔ communautaire, PR #148/#149)
> et 2 (formulaires sur page dédiée, PR #150) sont livrés. Le second temps de ce chantier
> traitera les références d'une capacité : états déclenchés et invocations de créature ou
> d'objet.

## Problème

Créer une voie communautaire complète est aujourd'hui impossible. Le schéma `voie` n'offre
qu'un champ texte `details` : l'auteur y tape ses cinq rangs en vrac. Résultat, sur la fiche
d'une voie communautaire, chaque ligne devient une pseudo-capacité sans rang, sans
description, sans badge — là où une voie officielle affiche cinq capacités structurées avec
leur rang, leur type d'action et leurs règles de choix.

L'utilisateur l'a formulé ainsi : « quand on doit rajouter une voie de classe, il faut
d'abord la créer, puis créer les sorts présents dans cette voie » — et les données doivent
être « sauvegardées comme pour les versions officielles ».

## Décisions

- **Chaque capacité est une entrée à part entière**, reliée à sa voie par une colonne
  `parent`. Écarté : le JSON imbriqué (les capacités resteraient invisibles dans la liste
  « Capacités & Sorts » et sans fiche propre, recreusant l'écart que les deux chantiers
  précédents ont comblé) et la migration vers les tables officielles (trop lourde, et elle
  mélangerait officiel et communautaire dans le compendium).
- **La visibilité des capacités suit celle de la voie.** Une voie publique dont les
  capacités seraient privées s'afficherait vide pour ses lecteurs.
- **Supprimer une voie supprime ses capacités**, la confirmation annonçant leur nombre.
  Conforme à l'officiel, où une capacité n'existe pas hors de sa voie.
- **Saisie d'un seul tenant** : des blocs repliables dans le formulaire de voie, pas une
  suite de formulaires enchaînés. L'auteur garde la vue d'ensemble et peut corriger le
  rang 2 sans naviguer.
- **Deux temps.** Ce premier temps couvre la chaîne voie → capacités. Les références d'une
  capacité (états déclenchés, invocations) viendront ensuite : elles touchent une autre
  entité (`CustomCreature`) et méritent leur propre conception.

## Périmètre

**Dans le périmètre**

- Colonne `parent` sur `HomebrewEntry`, nullable, avec sa migration.
- Section « Capacités » dans le formulaire de voie : ajout, réordonnancement, suppression.
- Enregistrement d'un ensemble voie + capacités, avec traitement de l'échec partiel.
- Fiche de voie et aperçu affichant les capacités réelles via la feuille partagée.
- Les quatre prérequis ci-dessous.

**Hors périmètre**

- Les états déclenchés et les invocations : second temps.
- Les capacités portées par une **classe** (les voies de profil officielles passent par
  `Profile.voies`) : ce chantier ne traite que la voie comme parent.
- Toute migration du contenu communautaire vers les tables officielles.

## Prérequis

Quatre obstacles, identifiés par les revues des chantiers précédents, doivent être levés
avant la saisie imbriquée elle-même :

1. **`pruneToSchema` ne traite qu'un niveau** (`homebrewSchemas.ts`). Il doit élaguer chaque
   capacité selon le schéma `capacite`, sinon des champs parasites partiraient en base.
2. **`validateHomebrew` est plate** : aucune clé ne peut désigner l'erreur d'un enfant. Il
   lui faut une notion de chemin, de la forme `capacites.2.rank`.
3. **Les ancres de défilement sont des identifiants globaux** (`champ-${key}`,
   `HomebrewFields.tsx`). Deux capacités produiraient deux `champ-rank` et le défilement
   irait au premier. À préfixer par le chemin de l'enfant.
4. **Trois cartes de capacité divergentes** (dette du chantier 1) : `RaceSheet` n'affiche
   aucun badge, `ProfileSheet` affiche « L » et « Sort », `VoieSheet` affiche « Actif »,
   « Limité » et « Sort ». Un composant unique doit les remplacer, sans quoi l'aperçu d'une
   voie ne saurait laquelle imiter.

## Architecture

### Modèle de données

```php
#[ORM\ManyToOne]
#[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
#[Groups(['homebrew:read', 'homebrew:write'])]
private ?HomebrewEntry $parent = null;
```

`nullable` est impératif : les **8 capacités et sorts autonomes** que porte déjà la base
(« Éclat de givre », « Chaînes d'ombre », « Murmure vorace », « Réflexe du chat », « Frappe
étourdissante », « Vague déferlante », « Illusion parfaite », « Pas de brume ») n'ont pas de
parent et doivent continuer de fonctionner. `onDelete: 'CASCADE'` assure la suppression en cascade au niveau de la base,
donc atomique — le client n'a pas à orchestrer une suppression enfant par enfant.

### Sécurité

La sécurité actuelle est par opération et fondée sur le propriétaire. Deux règles s'ajoutent,
appliquées dans `HomebrewEntryStateProcessor` :

- **un parent doit appartenir au même propriétaire** que l'enfant ; sinon la requête est
  refusée. Sans cela, n'importe qui pourrait rattacher une capacité à la voie d'autrui ;
- **la visibilité d'un enfant est forcée à celle de son parent** à l'écriture. Le client
  l'envoie déjà correctement, mais la règle serveur rend la garantie indépendante du client.

### Enregistrement d'un ensemble

L'API est REST par entité : enregistrer une voie et cinq capacités fait six appels. Le flux :

1. enregistrer la voie (création ou mise à jour) ;
2. pour chaque capacité : créer les nouvelles, mettre à jour les modifiées, supprimer celles
   que l'auteur a retirées.

**Échec partiel.** Si un appel échoue au milieu, la voie est déjà enregistrée et une partie
des capacités aussi. Le formulaire ne navigue pas, reste rempli, et affiche un compte-rendu
précis : ce qui est enregistré, ce qui ne l'est pas, et un bouton pour réessayer les seules
opérations restantes. C'est le comportement le plus honnête possible sans point d'entrée
serveur transactionnel — lequel serait du travail backend non demandé, et reste ouvert si
l'usage montre que l'échec partiel est fréquent.

### Validation avec chemins

`validateHomebrew` gagne la notion de chemin. Sa signature évolue :

```ts
export interface HomebrewFieldError {
    /** Chemin du champ : `speed` pour la voie, `capacites.2.rank` pour un enfant,
     *  chaîne vide pour une erreur transverse. */
    key: string;
    message: string;
}

export const validateHomebrew = (
    category: string,
    name: string,
    data: Record<string, unknown>,
    children?: { category: string; name: string; data: Record<string, unknown> }[],
): HomebrewFieldError[] => { /* … */ };
```

Les enfants sont validés avec le schéma de leur propre catégorie, et leurs erreurs préfixées
par `capacites.<index>.`. Le message nomme le rang plutôt que l'indice — « capacité 3 » et
non « capacités.2 » — car c'est ce que l'auteur voit à l'écran.

Le contrat établi au chantier 2 tient : `required` reste explicite et non optionnel, `0`
reste une valeur légitime, et une capacité n'est validée que sur les champs requis de son
schéma.

### Carte de capacité unifiée

Un composant `CapabilityCard` remplace les trois rendus divergents, dans
`app/src/components/sheets/`. Il affiche la pastille de rang, le nom, la description, les
badges présents (« Sort », « Limité », « Actif ») et les détails libres via
`DynamicDetailsRenderer`. `RaceSheet`, `ProfileSheet`, `VoieSheet` et l'aperçu le
consomment. Un badge ne s'affiche que si la donnée est vraie — le contrat de dégradation
propre du chantier 1 s'applique.

C'est une **unification de rendus qui divergeaient**, pas une refonte : le vocabulaire
visuel retenu est celui de `VoieSheet`, le plus complet des trois.

### Saisie

Le formulaire de voie reçoit une section « Capacités » sous les champs de la voie :

- un bouton « Ajouter une capacité » crée un bloc replié, numéroté par son rang ;
- chaque bloc porte les champs du schéma `capacite`, un bouton de suppression, et des
  contrôles de réordonnancement qui recalculent les rangs ;
- un bloc en erreur s'ouvre automatiquement et se signale, pour qu'aucune erreur ne reste
  cachée dans un bloc replié — sinon l'auteur verrait un enregistrement refusé sans cause
  visible ;
- l'aperçu rend la voie et ses capacités par la feuille partagée, en direct.

### Lecture

La fiche d'une voie communautaire et son aperçu affichent les capacités réelles. Côté
adaptateur, `homebrewToVoieVM` cesse de dériver de pseudo-capacités du champ texte
`details` et consomme les enfants. Le champ `details` de la voie conserve son rôle propre :
les mécaniques de la voie elle-même, rendues par `DynamicDetailsRenderer`.

## Tests

- **Unitaires** sur la validation avec chemins : une capacité incomplète produit une erreur
  portant `capacites.<index>.<champ>` ; une voie valide sans capacité n'en produit aucune ;
  les erreurs transverses gardent leur clé vide.
- **Unitaires** sur l'élagage en profondeur : un champ absent du schéma `capacite` est
  retiré de chaque enfant.
- **Unitaires** sur l'adaptateur : une voie et ses enfants produisent un view-model dont les
  capacités sont triées par rang.
- **Rendu (jsdom)** : la carte de capacité unifiée affiche chaque badge présent et aucun
  badge absent ; un bloc en erreur est ouvert.
- **Visuel (Playwright)**, desktop et mobile : création d'une voie avec trois capacités,
  vérification qu'elles apparaissent sur la fiche **et** dans la liste « Capacités & Sorts »,
  qu'un enregistrement incomplet est refusé avec défilement vers la bonne capacité, et que
  la suppression de la voie emporte ses capacités.

## Risques

- **Échec partiel de l'enregistrement.** Traité par un compte-rendu précis et une reprise,
  faute de point d'entrée transactionnel. Reste le risque principal.
- **Suppression en cascade.** Une confirmation trop discrète ferait perdre cinq capacités
  d'un clic. La confirmation annonce le nombre exact.
- **Rattachement frauduleux.** Un client modifié pourrait tenter de rattacher une capacité à
  la voie d'autrui : la règle serveur sur le propriétaire du parent ferme ce chemin.
- **Régression sur les capacités autonomes.** Les 8 entrées sans parent doivent continuer de
  s'afficher, de se modifier et de se dupliquer exactement comme avant. Vérifié explicitement
  après la migration, qui doit les laisser intactes avec `parent` à nul.
