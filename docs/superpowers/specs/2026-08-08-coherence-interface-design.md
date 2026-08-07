# Cohérence de l'interface — design

**Constat de départ (utilisateur) :** « l'ensemble manque de cohérence ».

Ce document part d'une revue des **23 écrans** capturés en desktop (1440 px) et en mobile
(390 px). Chaque écart cité ci-dessous a été constaté sur une capture, pas supposé.

La refonte UI/UX de juillet (PR #132→#137) a posé un design system — `PageShell`,
`ContentCard`, `AuthorTag`, `SourceTabs`, `EmptyState`. Il est en place. Ce qui manque
n'est pas un composant de plus : c'est **une règle unique par décision**. Le patchwork
restant vient de ce que chaque écran répond à sa façon à des questions déjà tranchées
ailleurs.

---

## 1. Diagnostic

### 1.1 Le sous-titre de page dit trois choses différentes

| Écran | Sous-titre | Nature |
|---|---|---|
| Peuples, Classes, Capacités, États | « 8 races trouvées » | **compteur de résultats** |
| Voies | « Explorez les chemins de puissance… » | **accroche** |
| Campagnes, Personnages, Outils du MJ | « Vos aventures en tant que meneur… » | **fonction de la page** |
| Créatures, Équipement | *(aucun)* | — |

Le même emplacement, juste sous le titre, porte tantôt une donnée, tantôt une promesse,
tantôt rien. Le lecteur ne peut pas apprendre à le lire.

### 1.2 Le même objet porte plusieurs noms

| Dans la navigation | Sur la page | Ailleurs |
|---|---|---|
| Races | Races | « Race / Peuple » (Bibliothèque), « Peuple » (formulaire) |
| Armes & Armures | Équipement | — |
| Dés | Lanceur de dés | « Lanceur de dés » (Outils) |
| Ambiances | Pistes audio | « Pistes Audio » (Outils) |
| Créatures | Créatures | « Mes Monstres » (Outils), « Bestiaire » (suivi de combat) |
| — | « Mes créations » (compendium) | « Mon contenu » (Bibliothèque) |

Six objets, treize noms.

### 1.3 La casse des titres n'obéit à aucune règle

`Suivi de Combat` · `Lanceur de dés` · `Mes Monstres` · `Pistes Audio` ·
`Objets Magiques` · `Mes campagnes` · `Mes Personnages` — sur deux écrans voisins.

### 1.4 Deux systèmes d'onglets se superposent

Sur Équipement : les onglets de source (Officiel / Communauté / Mes créations) en
pilules dorées, puis juste dessous les onglets de sous-type (Armes / Armures / Matériel)
en contrôle segmenté à icônes. Deux grammaires visuelles pour la même action —
« restreindre ce que je regarde ».

### 1.5 La zone de recherche change de forme d'un écran à l'autre

- **Peuples** : panneau avec le compteur au-dessus du champ.
- **Créatures** : panneau avec champ + bouton « Filtres », compteur ailleurs.
- **Équipement** : champ nu, sans panneau, sous les onglets de sous-type.
- **Bibliothèque** : champ + bouton « Nouveau » + compteur en dessous + chips de catégorie.

### 1.6 Les cartes ne portent pas les mêmes informations

Peuple = image + nom. Créature = image + nom + niveau + PV + DEF + FOR + INIT.
Bibliothèque = vignette à initiale + catégorie + nom + auteur. Rien ne dit au lecteur
ce qu'il peut attendre d'une carte.

### 1.7 Le bouton flottant recouvre le contenu

Sur les 23 écrans, en desktop comme en mobile, la pastille d'outils est posée en bas à
droite **au-dessus** du contenu : elle masque la dernière ligne d'un tableau, la
dernière carte d'une grille, la colonne de droite d'une fiche.

---

## 2. Principes

1. **Une décision, une règle.** Tout ce qui se répète (titre, sous-titre, recherche,
   onglets, carte) suit une règle unique, écrite ici, appliquée partout.
2. **Le nom d'une chose ne change pas selon l'écran.** Un lexique fait autorité.
3. **La forme suit le rôle.** Deux contrôles de rôles différents (choisir une source /
   filtrer un sous-type) ne se ressemblent pas ; deux contrôles de même rôle se
   ressemblent exactement.
4. **Rien ne recouvre le contenu.** Un élément flottant s'efface ou réserve sa place.
5. **On ne casse pas ce qui marche.** Le design system existe : on l'étend et on l'impose,
   on ne le remplace pas.

---

## 3. Décisions

### 3.1 Gabarit de page

`PageShell` devient le **seul** en-tête possible. Sa signature se resserre :

- `title` — le nom de la page, **tiré du lexique** (§3.2).
- `subtitle` — **toujours la fonction de la page**, jamais un compteur, jamais une
  accroche. Une phrase, à l'infinitif ou au présent, qui dit ce qu'on vient y faire.
- `icon` — **obligatoire**. Chaque page en a une ; c'est le repère visuel du fil
  d'ariane et de l'onglet.
- `count` — **nouveau**, facultatif : le compteur de résultats trouve enfin sa place
  propre, à droite du titre, en petit. Il sort du sous-titre.

Les pages qui n'ont pas d'icône aujourd'hui (compendium, Équipement) reprennent celle de
leur entrée de navigation : le même symbole désigne la même chose des deux côtés.

### 3.2 Lexique

Une seule table, dans `app/src/domain/lexique.ts`, consommée par la navigation, les
titres de page, les libellés de catégorie de la Bibliothèque et les cartes d'outils.

| Concept | Nom retenu | Motif |
|---|---|---|
| Race / Peuple | **Peuples** | le mot du livre COF2 ; « race » est un import D&D |
| Armes & armures & matériel | **Équipement** | le sur-ensemble réel de la page |
| Créature du bestiaire | **Créatures** | inchangé |
| Créature créée par le MJ | **Mes créatures** | « monstre » n'existe nulle part ailleurs |
| Jets de dés | **Dés** | court, c'est ce que dit la navigation |
| Ambiance sonore | **Ambiances** | idem |
| Contenu personnel | **Mes créations** | déjà majoritaire (compendium) |
| Contenu partagé | **Communauté** | inchangé |

**Casse : capitale au premier mot seulement.** « Suivi de combat », « Objets magiques »,
« Mes personnages ». Les petites capitales du thème restent une affaire de CSS, pas de
contenu — c'est ce qui permet de les changer sans réécrire les chaînes.

### 3.3 Deux contrôles, deux formes

- **Source** (Officiel / Communauté / Mes créations) : `SourceTabs`, pilules, toujours
  **immédiatement sous le titre**, à la même place sur tous les écrans.
- **Sous-type** (Armes / Armures / Matériel ; catégories de la Bibliothèque) : chips
  discrètes, **dans la barre de recherche**, avec le champ — parce que filtrer et
  chercher sont la même intention.

### 3.4 Barre de recherche unique

Un composant `SearchToolbar` : champ de recherche, chips de sous-type facultatives,
bouton d'action principal facultatif (« Nouveau »). Une seule disposition, un seul
espacement, sur les huit écrans de liste. Le compteur n'y est plus (il est passé dans
l'en-tête, §3.1).

### 3.5 Anatomie d'une carte

Trois variantes, et pas une de plus, toutes construites sur `ContentCard` :

1. **Illustrée** (peuples, classes, créatures) : image, nom, et **jusqu'à quatre
   statistiques** en pied. Les créatures en montrent quatre, les peuples zéro
   aujourd'hui — la même carte, garnie différemment, pas une carte différente.
2. **Textuelle** (voies, capacités, états, poisons, pièges) : nom, badges, description
   coupée à trois lignes.
3. **Communautaire** : la variante correspondante + `AuthorTag`. C'est déjà la règle des
   feuilles partagées ; elle vaut aussi pour les cartes.

### 3.6 Le bouton flottant réserve sa place

La pastille d'outils garde sa position, mais chaque page reçoit une gouttière basse
(`pb-24` en mobile, `pb-16` en desktop) pour que rien ne passe dessous. Sur les écrans où
elle n'a aucun sens (fiche imprimable, mode session), elle disparaît.

---

## 4. Plan par phases

Chaque phase est livrable seule, vérifiée par capture avant/après.

**Phase 1 — Lexique et casse.** `domain/lexique.ts`, navigation, titres, cartes d'outils,
libellés de catégorie. Aucun changement visuel de structure : uniquement des mots.
*Risque : nul. Vérification : plus aucun objet ne porte deux noms (test unitaire sur le
lexique + relevé des chaînes).*

**Phase 2 — En-tête unique.** `PageShell` gagne `count`, l'icône devient obligatoire, les
sous-titres deviennent des fonctions. Les compteurs quittent le sous-titre.
*Vérification : les 23 écrans ont titre + icône + sous-titre de même nature.*

**Phase 3 — Recherche et filtres.** `SearchToolbar`, chips de sous-type, `SourceTabs`
replacé au même endroit partout. Équipement perd son second système d'onglets.
*Vérification : même disposition sur les huit écrans de liste.*

**Phase 4 — Cartes.** Les trois variantes, appliquées aux listes du compendium et de la
Bibliothèque. Les peuples et les classes gagnent le pied de statistiques (vitesse,
modificateurs / famille, DEF max) qu'ils ont déjà en données.
*Vérification : capture des huit listes, mêmes hauteurs de carte, mêmes gouttières.*

**Phase 5 — Gouttières et flottant.** Gouttière basse sur toutes les pages, pastille
retirée là où elle n'a pas lieu d'être.
*Vérification : aucune carte ni ligne de tableau recouverte, sur les 46 captures.*

---

## 5. Hors périmètre, assumé

- **La palette et la typographie ne bougent pas.** Le thème sombre doré fonctionne ; le
  problème est l'application inégale des règles, pas les règles elles-mêmes.
- **L'accessibilité** (association `label`↔champ, ordre de tabulation, rôles ARIA) est un
  chantier distinct, déjà identifié. La cohérence visuelle ne le remplace pas.
- **Les pages de détail** (fiches de peuple, classe, voie, capacité) sont déjà iso entre
  officiel et communautaire depuis PR #148 : elles ne sont touchées que par le lexique.
