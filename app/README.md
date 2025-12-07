# Chroniques Oubliées MJ App

Application web Mobile First pour assister les Maîtres de Jeu (MJ) de *Chroniques Oubliées*.

Cette application permet de gérer facilement vos campagnes, de consulter le bestiaire et de suivre les combats, le tout optimisé pour une utilisation sur tablette ou smartphone directement à la table de jeu.

## Fonctionnalités

### 📖 Bestiaire
- Accès complet aux créatures du SRD.
- Recherche par nom et filtres par catégorie.
- Fiches détaillées avec caractéristiques, attaques et capacités.

### 🗺️ Gestion de Campagne
- Créez et suivez plusieurs campagnes.
- Vos données sont sauvegardées localement dans votre navigateur (aucun compte requis).
- Vue d'ensemble de vos aventures.

### ⚔️ Suivi de Combat
- Gestionnaire d'initiative dynamique.
- Suivi des PV des PJ et des Monstres.
- Ajout rapide de combattants.

## Installation

Prérequis : [Node.js](https://nodejs.org/) installé.

1. Clonez le dépôt ou téléchargez les sources.
2. Installez les dépendances :

```bash
npm install
```

3. Lancez le serveur de développement :

```bash
npm run dev
```

4. Ouvrez votre navigateur sur l'adresse indiquée (généralement `http://localhost:5173`).

## Technologies

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) (Icônes)

## Crédits

Basé sur le système de jeu *Chroniques Oubliées*.
Resources et données issues du [CO-DRS](https://www.co-drs.org/fr).
