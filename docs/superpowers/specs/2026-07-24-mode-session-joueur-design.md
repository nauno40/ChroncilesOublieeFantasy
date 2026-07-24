# Mode session joueur (mobile-first) + découvrabilité du partage — Design

**Date :** 2026-07-24
**Objectif :** donner au joueur, pendant une partie, un écran **« Jouer » dédié, tactile et mobile-first** : son personnage (facilement modifiable), la prise de notes, l'historique/résumé de campagne partagé par le MJ, et un lanceur de dés — **sans** la prépa du MJ. Rendre par ailleurs **découvrables** les fonctions de partage MJ ⇄ joueurs qui existent déjà.

## Contexte (existant, à réutiliser — NE PAS refaire)

Le modèle de collaboration est **déjà implémenté** côté back et front :
- Campagne **privée au MJ** (quêtes/indices/séances/notes owner-scopés).
- Adhésion par code : `POST /shared_campaigns/join` ; `GET /shared_campaigns` (mes campagnes rejointes).
- Vue joueur `SharedCampaign` : expose **uniquement** nom + MJ + **résumés de séances** (rien de secret).
- Le MJ voit/édite les persos des membres ; le joueur rattache son perso à la campagne rejointe (par id).
- `Character` a une opération **PATCH** (`security` = owner OU MJ de la campagne) → auto-save possible.
- `useCharacterSheet` fournit toutes les valeurs dérivées + l'édition du `playState`.
- `DiceRoller` (`components/common`) et `SharedCampaign`/`SharingService` sont réutilisables.

Le vrai manque n'est donc **pas** le modèle, mais : (1) un **écran de jeu focalisé mobile**, (2) la **découvrabilité** du partage. (Le partage *sélectif explicite* — cocher une quête/un indice précis — est noté comme évolution future, hors de ce lot.)

## Architecture

- **Route `/play/:id`** sous `<ProtectedRoute>` mais **hors `<Layout>`** (plein écran, pas de sidebar) — comme `/characters/:id/print`.
- **`PlayMode`** (nouveau, `pages/PlayMode/`) : en-tête compact (nom + niveau + retour) + **barre d'onglets en bas** (pattern mobile, `fixed bottom`) : **Perso · Notes · Campagne · Dés**.
- **Réutilisation** : `useCharacterData` + `useCharacterSheet` (valeurs dérivées + `setCharacter`), la résolution de capacités de `PrintableCharacterSheet` (`buildVoieIndex` + `isCapabilityGrantedByEntry`), `DiceRoller`, `SharingService`.
- **Aucune règle nouvelle.** L'écran lit/édite le `playState` et affiche des valeurs dérivées.
- **Auto-save** : un hook `useAutosavePlayState(character)` PATCH **`{ playState }` uniquement** (`ApiService.patch`, `application/merge-patch+json`), **débounce ~1 s**, avec indicateur d'état (enregistré / en cours). Le PATCH partiel n'envoie pas `campaign` → pas de résolution de relation → pas de 400. Pas de bouton « Enregistrer » à la table.

## Onglets

### ⚔️ Perso (défaut) — volet 1
- **Trackers tactiles** : PV, PM (si mage), PC en « courant / max » avec **gros +/-** ; courant plafonné à `min(courant, maxHp)` (déjà en place). Dé de récupération, RD, DEF, Init, dé évolutif en lecture.
- **Attaques** (contact/distance/magie + armes) en lecture rapide.
- **États actifs & usages** : interrupteurs / cases (édition).
- **Capacités & sorts** et **équipement** : consultables, repliables (mêmes valeurs que la fiche).
- Édite `playState` → auto-save.

### 📝 Notes — volet 2
- Zone de notes du joueur, persistée dans `playState` (champ `sessionNotes?: string`, additif). Auto-save. Distincte des notes de roleplay de la fiche.

### 📜 Campagne — volet 3
- Si le perso est rattaché à une campagne rejointe : afficher le **`SharedCampaign`** correspondant (synopsis éventuel + résumés de séances), **lecture seule**. Sinon, invite à rejoindre une campagne.

### 🎲 Dés — volet 4
- Réutilise `DiceRoller`. Lancer rapide en session.

## Découvrabilité du partage — volet 5 (page Campagne, pas dans /play)
- **Joueur** : bloc « Rejoindre une campagne » (code) + « Mes campagnes rejointes » bien visibles (fonctions déjà dans `SharingService`).
- **MJ** : code d'invitation + bouton « Partager » lisibles sur la campagne.
- Bouton **« Jouer »** d'entrée dans `/play/:id` depuis la fiche perso et la liste des persos.

## Découpage (une PR par volet)
1. Écran `/play/:id` (hors Layout) + barre d'onglets + **onglet Perso** (trackers auto-save, capacités consultables) + bouton d'entrée « Jouer ». Onglets Notes/Campagne/Dés présents mais en stub « Bientôt ».
2. Onglet **Notes** (champ `playState.sessionNotes`, auto-save).
3. Onglet **Campagne** (SharedCampaign lecture seule).
4. Onglet **Dés** (DiceRoller).
5. **Découvrabilité** du join/partage (page Campagne) + bouton « Jouer » sur la liste des persos.

## Définition de « fini » (par volet)
- Volet 1 : `/play/:id` s'ouvre plein écran mobile ; PV/PM/PC modifiables au doigt ; capacités consultables ; modifications **auto-sauvegardées** (PATCH playState) et persistées après rechargement ; `tsc` 0, `vitest` vert, lint 0 nouvelle erreur ; **vérifié en viewport mobile** (Playwright).

## Hors périmètre
- Partage sélectif explicite (cocher une quête/un indice) — évolution ultérieure.
- Temps réel / multijoueur live (hors vision — cf. mémoire vision produit).
- Refonte responsive de la fiche complète (on garde la fiche pour préparer/progresser ; le mobile passe par /play).
