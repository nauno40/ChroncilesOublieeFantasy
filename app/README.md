# Chroniques Oubliées MJ App

Application web **Mobile First** moderne et immersive pour assister les Maîtres de Jeu (MJ) de *Chroniques Oubliées*.

Conçue pour être utilisée directement à la table de jeu (tablette ou smartphone), cette application centralise tout le nécessaire pour mener vos parties avec fluidité : bestiaire, règles, outils de gestion et ambiance sonore.

![App Screenshot](https://via.placeholder.com/800x400.png?text=Chroniques+Oubli%C3%A9es+MJ)

## ✨ Fonctionnalités

### 🏠 Tableau de Bord
- Vue d'ensemble rapide avec des statistiques sur le contenu disponible.
- Design **Glassmorphism** immersif et soigné.

### 📚 Encyclopédie & Règles (CO Fantasy)
Un accès rapide et filtrable à toutes les règles :
- **Races & Classes** : Détails complets, traits raciaux et capacités de classe.
- **Voies & Capacités** : Système de filtrage intelligent (par Rang, Profil, Voie) pour trouver rapidement une capacité spécifique.
- **Équipement & Montures** : Liste des armes, armures, matériel d'aventure et montures.
- **États Préjudiciables** : Référence rapide des conditions (Aveuglé, Renversé, etc.).

### 🛠️ Outils du MJ

#### ⚔️ Suivi de Combat (Combat Tracker)
- Gestionnaire d'initiative dynamique.
- Suivi des PV des PJ et des Monstres.
- Gestion des tours de jeu.
- Ajout rapide de créatures depuis le bestiaire.

#### 🎲 Lanceur de Dés (Dice Roller)
- Table de jeu virtuelle avec **dés 3D**.
- Lancer rapide de tous les types de dés (d4, d6, d8, d10, d12, d20).
- Physique réaliste et lecture automatique des résultats.

#### 🔊 Pistes Audio (Soundboard)
- Table de mixage simplifiée pour l'ambiance sonore.
- Boutons personnalisables (Combat, Taverne, Angoisse...).
- Liez vos playlists ou vidéos YouTube pour un accès immédiat.

### 📖 Bestiaire
- Accès complet aux créatures du SRD.
- Recherche instantanée par nom.
- Fiches de créatures claires et lisibles sur mobile.

### 🗺️ Gestion de Campagne
- Créez et organisez vos campagnes.
- **Sauvegarde Locale** : Vos données sont stockées uniquement dans votre navigateur. Aucun compte ni connexion internet n'est requis une fois l'application chargée.

## 🚀 Installation & Démarrage

Prérequis : [Node.js](https://nodejs.org/) installé.

1. **Cloner le projet**
   ```bash
   git clone <votre-repo-url>
   cd ChroniquesOubliées/app
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

4. **Accéder à l'application**
   Ouvrez votre navigateur sur `http://localhost:5173`.

## 🛠️ Stack Technique

- **Framework** : [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Styles** : [TailwindCSS](https://tailwindcss.com/) (Design System personnalisé)
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Données** : JSON normalisé (basé sur le SRD)

## ⚖️ Crédits & Licence

- Basé sur le système de jeu **Chroniques Oubliées Fantasy** (Black Book Éditions).
- Ressources et données issues du [CO-DRS](https://www.co-drs.org/fr).
- Images et illustrations utilisées à des fins de démonstration (propriété de leurs auteurs respectifs).
