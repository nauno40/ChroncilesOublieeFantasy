# Fonctionnalités et Roadmap

Suite à l'analyse approfondie du code source frontend et backend, voici l'état actuel des fonctionnalités de l'application Chroniques Oubliées.

## 1. Ce qui est implémenté et qui fonctionne ✅

L'application est déjà très riche visuellement et propose un grand nombre d'outils indispensables pour une partie de jeu de rôle :

- **Encyclopédie / Compendium (Connecté à l'API/JSON)**
  - **Bestiaire** : Visualisation complète des monstres avec filtrage, pagination et détails de fiches.
  - **Profils/Classes & Races** : Listes explicatives complètes tirées des règles, avec le détail des Dés de vie, bonus, voies associées.
  - **Voies & Capacités** : Catalogue détaillé des différentes voies de développement de personnages.
  - **Équipement** : Listes des armes, armures, provisions et montures.
  - **Règles** : Accès au texte formaté des règles ORC.

- **Fiche de Personnage (Outil Principal)**
  - Outil extrêmement complet (`CharacterSheet.tsx`).
  - Calcul automatisé des modificateurs de caractéristiques.
  - Intégration des bonus liés aux Capacités (via un système de parsing `CAPABILITY_MODIFIERS`).
  - Lancer de dés intégré directement depuis la fiche.
  - Gestion de l'inventaire, de l'équipement équipé, de la monnaie corporelle et des protections.
  - Sauvegarde en base de données gérée via le `ApiService` vers le backend.

- **Outils de Table (VT - Virtual Table)**
  - **Lanceur de dés (Dice Roller)** 
  - **Panneau de Sons (Soundboard)** 
  - **États préjudiciables** : Référence rapide pour le MJ (Meneur de Jeu).

## 2. Ce qui fonctionne partiellement ou avec des limitations ⚠️

Certaines fonctionnalités sont très bien designées côte UI mais manquent de persistance côté serveur (Backend) :

- **Gestion de Campagne** (`CampaignDetail.tsx`) : 
  - *Fonctionnement complet en local* : L'interface permet de gérer des quêtes, des indices, des sessions (avec notes auto-sauvegardées) et l'ajout de joueurs.
  - *La limite* : Les données sont pour le moment stockées dans le `localStorage` du navigateur (`campaignService.ts`). Si on change de PC ou de navigateur, on perd la campagne.
  
- **Tracker de Combat (Initiative Tracker)** (`CombatTracker.tsx`) :
  - *Fonctionnement* : Permet au MJ d'ajouter des joueurs et monstres, de générer de l'initiative et de traquer la vie des monstres.
  - *La limite* : Il n'est pas "live". Il fonctionne juste sur l'écran du MJ. Les joueurs ne voient pas le tracker se mettre à jour sur leur propre écran.

- **Système d'Authentification** : 
  - Les fiches de personnages sont sauvegardées via API, mais il semble manquer la notion "d'appartenance" stricte (Login Utilisateur).

## 3. Ce qu'il faudrait ajouter (Roadmap suggérée) 🚀

Pour transformer l'application d'un *Compagnon local* à une véritable *Virtual TableTop / Hub de jeu communautaire*, voici les prochaines étapes logiques :

### Phase 1 : Persistance et Backend
- [x] **Modèles Backend pour la Campagne** : Créer les entités Symfony (API Platform) pour `Campaign`, `Quest`, `Clue`, `Session` afin de remplacer le `localStorage` de l'UI actuelle par l'API.
- [x] **Système de Comptes (Auth)** : Implémenter l'inscription, la connexion (JWT), et lier les entités `Character` et `Campaign` à un `User`.

### Phase 2 : Temps Réel (Multi-joueurs)
- [ ] **Mercure / WebSockets** : Intégrer Symfony Mercure pour avoir du vrai temps réel.
- [ ] **Tracker de combat synchronisé** : Faire en sorte que quand le MJ passe au tour du joueur X, l'écran du joueur X se mette à clignoter ou affiche un pop-up "C'est à votre tour !".
- [ ] **Lancers de dés partagés** : Si un joueur clique sur sa fiche pour attaquer avec son Épée, le MJ voit le résultat du dé dans un "Chat de partie" commun.

### Phase 3 : Nouvelles features
- [ ] **Import/Export PDF** : Pouvoir imprimer la fiche de personnage joliment générée.
- [ ] **Mapping/Grille de combat basique** : Ajouter un canvas où on peut uploader une image (map) et bouger des pions (tokens) représentant les monstres et les joueurs du Tracker de Combat.
- [ ] **Créateur de Monstre Custom** : Interface pour créer un monstre n'étant pas dans le Bestiaire SRD et le sauvegarder dans la Campagne.

---
*Ce document propose un état des lieux orienté fonctionnalités et produit pour l'application Chroniques Oubliées.*
