# Formulaires de création communautaire — design

> Chantier 2 sur 3 issus du retour du 31/07/2026. Le chantier 1 (iso officiel ↔
> communautaire) est livré (PR #148, #149). Le chantier 3 portera sur la création
> imbriquée voie → capacités → invocations.

## Problème

Trois reproches, tous vérifiés dans le code :

| Reproche | Constat |
|---|---|
| « Le formulaire est tout petit (popup en mode mobile), c'est pas du tout utilisable en l'état » | Modale `max-w-lg` dans `HomebrewBrowser.tsx`, jusqu'à 14 champs empilés dans un panneau qui plafonne à `90vh` |
| « J'ai pas vu la possibilité de rajouter une image de ma race » | Aucune clé `image` dans `homebrewSchemas.ts`. Le champ est pourtant **déjà lu** par les deux adaptateurs (`fromHomebrew.ts`, `fromOfficial.ts`) et rendu par `RaceSheet`/`ProfileSheet` : il ne manque que l'entrée de formulaire |
| « Les champs sont pour la plupart obligatoires » | En réalité **seul le nom** l'est. Décision prise : tout ce qui relève des règles devient obligatoire |

S'y ajoute une dette explicitement laissée par le chantier 1 : **« Modifier » n'est pas
câblé sur `OwnerBar`**, précisément parce que le formulaire vivait dans une modale
inaccessible depuis la fiche.

## Décisions

- **Image par URL**, pas d'envoi de fichier. Le backend n'a aucun mécanisme d'upload
  (ni VichUploader, ni gestion `multipart`) et `HomebrewEntry` n'a pas de colonne image.
  Le contenu officiel fonctionne déjà ainsi — les 14 images de classes pointent vers
  `co-drs.org`. Risque assumé : un lien peut mourir ; le placeholder à l'initiale sert de
  repli, comme aujourd'hui.
- **Page dédiée**, pas de modale agrandie ni de formulaire par étapes.
- **Tout champ de règles est obligatoire**, avec une exception nommée pour les champs
  conditionnels de l'équipement (voir plus bas).

## Périmètre

**Dans le périmètre**

- Formulaire de création et d'édition sur page dédiée, pour les 11 catégories.
- Champ image (URL) sur les catégories dont la fiche affiche une image : `race`, `classe`.
- Validation par catégorie, bloquante, avec messages sous les champs.
- Câblage de « Modifier » sur `OwnerBar`.

**Hors périmètre**

- L'envoi de fichier et le stockage d'images côté serveur.
- La création imbriquée (voie → capacités → invocations) : chantier 3.
- L'unification des trois cartes de capacité divergentes : dette du chantier 1, à traiter
  avant le chantier 3, pas ici.

## Architecture

### Routes et navigation

Deux routes nouvelles, protégées comme le reste de l'application :

```
/bibliotheque/nouveau/:categorie   → création
/bibliotheque/:id/modifier         → édition
```

L'origine de la navigation est transmise en paramètre de requête (`?retour=/races`) et
utilisée après enregistrement ou annulation. À défaut, on retombe sur la page de la
catégorie. Ce mécanisme corrige au passage le retour arrière figé en dur relevé dans
`HomebrewDetail` par la revue du chantier 1.

Les points d'entrée existants sont redirigés vers ces routes :

- le bouton « Créer — <catégorie> » de `HomebrewBrowser` ;
- les actions « Modifier » des cartes et des tableaux (`HomebrewList`) ;
- le bouton « Modifier » d'`OwnerBar`, désormais câblé.

La modale de `HomebrewBrowser` disparaît. Son état de formulaire, `handleSave` et
`pruneToSchema` migrent vers la page.

### Composants

```
app/src/pages/HomebrewForm.tsx        ← la page : chargement, soumission, navigation
app/src/components/homebrew/
    HomebrewFields.tsx (existant)     ← rendu des champs, enrichi des erreurs et du type 'image'
    HomebrewFormPreview.tsx           ← colonne d'aperçu (grand écran)
app/src/services/homebrewValidation.ts ← fonction pure de validation
```

Sur écran large, deux colonnes : le formulaire à gauche, l'aperçu à droite. L'aperçu rend
la **vraie feuille partagée** (`RaceSheet`, `ProfileSheet`, `VoieSheet`, `CapaciteSheet`)
alimentée par l'adaptateur communautaire, de sorte que l'auteur voit exactement ce que
verra un lecteur. Sous le point de rupture, une seule colonne : le formulaire, l'aperçu
étant accessible par un bouton qui le déplie.

**Les six catégories sans feuille dédiée** (`poison`, `piege`, `etat`, `equipement`,
`objet-magique`, `autre`) n'ont **pas** d'aperçu : le formulaire occupe toute la largeur.
Extraire le rendu générique de `HomebrewDetail` pour les servir serait du travail non
demandé ; l'asymétrie est assumée et documentée.

### Validation

Le type `HomebrewFieldDef` (`homebrewSchemas.ts`) gagne un indicateur explicite :

```ts
/** Champ requis pour enregistrer. Explicite plutôt que déduit de `tab`. */
required?: boolean;
```

Renseigné champ par champ : `true` pour les champs de règles, `false` pour les champs de
lore et pour les champs conditionnels de l'équipement. Le nom reste requis dans tous les
cas ; la description ne l'est pas.

Conséquence chiffrée, mesurée sur les schémas actuels :

| Catégorie | Champs requis |
|---|---|
| Race | 9 |
| Classe | 8 |
| Capacité | 6 |
| Sort, Poison | 5 |
| Piège | 4 |
| Voie | 3 |
| Équipement, objet magique | 7 (13 moins les 6 conditionnels) |
| État | 0 (le schéma n'a que nom et description) |

**L'exception de l'équipement.** Le schéma partagé par `equipement` et `objet-magique`
contient trois champs marqués « si arme » (`damage`, `range`, `critical`) et trois marqués
« si armure » (`acBonus`, `acMaxAgi`, `acPenalty`). Ils s'excluent mutuellement : un anneau
enchanté n'a ni dégâts ni bonus de défense. Les exiger tous rendrait la création
impossible. Ils sont donc non requis, et remplacés par une **règle de cohérence** : un
équipement peut renseigner le bloc arme, ou le bloc armure, ou aucun des deux — mais pas
les deux à la fois. Le message d'erreur nomme les deux blocs en conflit.

La validation vit dans une **fonction pure**, testable sans DOM, conformément à la culture
de test du dépôt :

```ts
export interface HomebrewFieldError {
    key: string;      // clé du champ, ou '' pour une erreur transverse
    message: string;
}

export const validateHomebrew = (
    category: string,
    name: string,
    data: Record<string, unknown>,
): HomebrewFieldError[] => { /* … */ };
```

Un champ est considéré manquant s'il est absent, vide, ou — pour un bloc de
caractéristiques — s'il ne porte aucune valeur. La valeur `0` est légitime et ne compte
pas comme manquante, conformément au contrat établi au chantier 1.

### Comportement à l'enregistrement

L'enregistrement est bloqué tant que la liste d'erreurs n'est pas vide. Chaque erreur
s'affiche sous son champ, et la page défile jusqu'au premier champ fautif. Les erreurs
transverses (règle de cohérence de l'équipement) s'affichent en tête de formulaire.

La validation ne se déclenche qu'à la première tentative d'enregistrement, puis en continu
à chaque modification : on n'agresse pas l'auteur avec des erreurs avant qu'il ait essayé.

## Tests

- **Unitaires (Vitest)** sur `validateHomebrew` : pour chaque catégorie, une entrée
  complète ne produit aucune erreur ; une entrée vide produit exactement les erreurs
  attendues ; la valeur `0` n'est pas comptée comme manquante ; la règle de cohérence de
  l'équipement se déclenche sur un mélange arme/armure et reste muette sinon.
- **Rendu (jsdom, filet posé en PR #149)** : le formulaire affiche les messages d'erreur
  attendus après une tentative d'enregistrement invalide, et le champ image montre son
  aperçu. Ces tests utilisent le commentaire de tête `// @vitest-environment jsdom`, la
  configuration globale restant en Node.
- **Visuel (Playwright)** : création complète d'une race sur mobile (390×844) et desktop,
  jusqu'à l'apparition de l'entrée dans la liste ; édition depuis « Modifier » de la fiche ;
  0 débordement horizontal, 0 erreur console.

## Risques

- **Régression des points d'entrée.** Trois endroits ouvrent aujourd'hui la modale ; en
  oublier un laisserait un bouton mort. Mitigation : les recenser par recherche avant de
  supprimer la modale, et vérifier chacun par Playwright.
- **Perte de saisie.** Passer d'une modale à une page rend la navigation arrière plus
  probable. Mitigation : confirmation avant d'abandonner un formulaire modifié.
- **Rigidité de la validation.** Neuf champs requis pour une race peut décourager. C'est
  un choix assumé, réversible en basculant un `required` dans le schéma — d'où l'intérêt
  de l'avoir rendu explicite plutôt que déduit.
