# État des lieux : Frontend (Application Web)

Le répertoire `./app` héberge une application moderne et réactive servant de "Compagnon Joueur et Meneur de Jeu".

## 1. Stack Technique

- **Moteur de Build** : Vite.js 7.2 (très rapide, HMR intégré).
- **Framework UI** : React 19 (la toute dernière version) avec TypeScript (`~5.9`).
- **Styling** : Tailwind CSS 4 (`@tailwindcss/postcss`). Il inclut `tailwindcss-animate` et `tailwind-merge` (stack classique pour les composants type *shadcn/ui*).
- **Composants d'interface** : Utilisation de `lucide-react` pour les icônes vectorielles et `react-rnd` potentiellement pour des fenêtres redimensionnables/draggables (très utile pour des Trackers de combat ou fenêtres de jets de dés).
- **Routing** : React Router DOM 7.
- **Tests** : Configuration `@playwright/test` pour les tests E2E potentiels, plus `eslint` v9 en version "flat config" (`eslint.config.js`).

## 2. Structure et Pages

L'interface de l'application est extrêmement riche et propose des vues distinctes que l'on retrouve dans `src/pages/` :

- **Meneur de Jeu (MJ) / Outils avancés** :
  - `Campaign.tsx` & `CampaignDetail.tsx` : Gestion globale d'une campagne.
  - `CombatTracker.tsx` : Outil de suivi de l'initiative, des tours et points de vie très prisé sur les VTT (Virtual TableTops).
  - `Bestiary.tsx` & `CreatureDetail.tsx` : Interface pour consulter tous les monstres, intégrée au Tracker.
  - `SoundboardPage.tsx` : Une page pour envoyer des effets sonores/musique à la table.

- **Joueurs / Personnages** :
  - `CharacterSheet.tsx` : Fiche de personnage interactive (très lourd fichier de 135ko, central à l'application).
  - `CharacterList.tsx` : Liste des personnages du joueur.

- **Encyclopédie Règles / Compendium** :
  - `Classes.tsx` & `ClassDetail.tsx` (ou Profils)
  - `Races.tsx` & `RaceDetail.tsx`
  - `Voies.tsx` & `VoieDetail.tsx` & `Capacites.tsx`
  - `Equipment.tsx`, `Mounts.tsx`, `Provisions.tsx` (Boutique et Inventaire)
  - `States.tsx` (États préjudiciables)
  - `Rules/` (Dossier contenant les textes du livre de règles).

- **Outils transverses** :
  - `Dice.tsx` : Probablement un lanceur de dés 3D ou 2D accessible rapidement.
  - `Tools.tsx` : Outils annexes divers.

## 3. Communication avec l'API

L'application communique probablement via le dossier `src/services/` ou des hooks customs (`src/hooks/`) vers le backend Symfony `http://localhost:8000/api` de manière dynamique. Des fichiers de données en dur pourraient aussi être chargés via `src/data/` pour un usage offline partiel (particulièrement utile pour consulter les règles sans nécessiter d'API).

> [!NOTE] 
> La complexité de `CharacterSheet.tsx` et l'utilisation de `react-rnd` indiquent qu'il ne s'agit pas d'un simple CRUD, mais d'un outil extrêmement complet visant à remplaçer le papier durant une partie (lancés de dés cliquables, suivi des PV en direct, fenêtres volantes, etc.).

---
*Ce document fait partie de l'état des lieux global généré pour le projet Chroniques Oubliées.*
