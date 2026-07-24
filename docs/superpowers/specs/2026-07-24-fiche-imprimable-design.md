# Fiche de personnage imprimable / PDF — Design

**Date :** 2026-07-24
**Branche :** `feat/fiche-imprimable`
**Objectif :** permettre au joueur d'imprimer sa fiche de personnage (ou de l'enregistrer en PDF), pour l'amener à la table. Cohérent avec la vision « aide de jeu » (le joueur emporte sa fiche).

## Décisions (actées avec l'utilisateur)

- **Approche : Print-CSS + PDF natif du navigateur.** Une vue d'impression dédiée + `window.print()` → le navigateur propose « Enregistrer au format PDF ». **Aucune dépendance** (pas de lib PDF).
- **Contenu : l'essentiel de jeu** (identité, caracs, stats dérivées, voies & capacités, équipement, langues). Compact, 1-2 pages. Pas le roleplay/notes/mécaniques d'aide (hors périmètre).

## Architecture

### 1. Route dédiée, hors `Layout`

Dans `App.tsx`, ajouter sous `<ProtectedRoute>` mais **en dehors** de `<Layout>` (pas de sidebar/nav) :

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/characters/:id/print" element={<PrintableCharacterSheet />} />
  <Route element={<Layout />}>
    … routes existantes …
  </Route>
</Route>
```

→ la page d'impression est protégée (auth) mais rendue **en pleine page**, sans le chrome de l'app.

### 2. `PrintableCharacterSheet` (nouveau composant/page)

- **Données** : réutilise `useCharacterData()` + `useCharacterSheet({ races, profiles, allVoies, id, isNew: false, navigate })` — la **même dérivation** que la fiche écran, donc **valeurs identiques** (PV/DEF/Init/attaques/DR/PC/PM/dé évolutif/RD…, `mods`/`finalStats`, voies/capacités, `baseLanguages`). Lecture seule : la vue n'a **aucun bouton de sauvegarde**, rien n'est persisté. (Si le hook s'avère trop lourd/à effets de bord gênants sur cette route, repli : dériver directement via `domain/rules` dans le composant — à trancher au plan.)
- **Contenu rendu** (mise en page claire, statique) :
  - **En-tête** : nom, peuple, profil, niveau.
  - **Caractéristiques** : les 7 valeurs finales (`finalStats`), + éventuels bonus aux tests en petit.
  - **Stats dérivées** : PV max, DEF, Initiative, attaques (contact/distance/magie), dé de récupération (DR), PC max, PM max, dé évolutif, RD.
  - **Voies & capacités acquises** : par voie (peuple/profil/prestige/trait), les capacités jusqu'au rang acquis (nom + rang ; « N PM » si sort).
  - **Protection & armes** : armure/bouclier (DEF), armes (nom/attaque/DM).
  - **Langues** : de base (Commun + peuple) + supplémentaires ; talents secondaires.
- **Actions à l'écran** (masquées à l'impression) : bouton **« Imprimer / Enregistrer en PDF »** (`window.print()`) + lien **« ← Retour à la fiche »** (`/characters/:id`).

### 3. Styles d'impression

- La vue est rendue en **couleurs claires** (fond blanc, texte foncé) directement (pas de dépendance au thème sombre de l'app) — plus fiable que d'inverser via `@media print`.
- `@media print` : masque les boutons/liens d'action (`.no-print`), fixe des marges A4 raisonnables, autorise/force des `break-inside: avoid` sur les blocs (une voie ne se coupe pas en deux), supprime ombres/animations.
- Objectif : **1 à 2 pages** propres, lisibles en noir et blanc.

### 4. Point d'entrée

Un bouton **« Imprimer »** dans `CharacterToolbar` (barre d'actions de la fiche) → `navigate('/characters/{id}/print')`. Visible seulement pour un personnage existant (pas en création).

## Définition de « fini » (DoD)

- Bouton « Imprimer » sur la fiche → ouvre `/characters/:id/print`.
- La page d'impression affiche l'essentiel du perso avec les **mêmes valeurs** que la fiche écran, en mise en page claire, sans sidebar.
- « Imprimer / Enregistrer en PDF » déclenche le dialogue d'impression ; l'aperçu est propre (pas de contrôles, pas de fond sombre, sauts de page corrects).
- `tsc -b` = 0, `vitest run` vert, `npm run lint` = 0 nouvelle erreur.

## Hors périmètre

- Vrai fichier `.pdf` téléchargé via une lib (approche B écartée).
- Personnalisation de la mise en page, choix des sections, export image.
- Roleplay/notes/physique/mécaniques d'aide (compagnons, usages, formes…) — l'essentiel de jeu seulement.
- Impression multi-personnages.

## Découpage prévu

- **(a)** Route `/characters/:id/print` (hors Layout) + squelette `PrintableCharacterSheet` (données via le hook) + bouton d'entrée dans `CharacterToolbar`.
- **(b)** Mise en page du contenu (sections essentielles) + print-CSS (`.no-print`, marges, break-inside).
