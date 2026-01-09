# Walkthrough: Modèle de Données Complet (MCD)

Ce document résume le travail effectué pour générer un Modèle Conceptuel de Données (MCD) exhaustif pour **Chroniques Oubliées Fantasy**, basé sur l'analyse complète du fichier de règles `regles_orc.md` et des données existantes.

## 1. Objectif
Modéliser l'intégralité des règles et données du jeu pour permettre un affichage complet de toutes les informations (Peuples, Voies, Profils, Sorts, Équipement, Monstres, etc.).

## 2. Résultat : `mcd.md`
Le fichier [mcd.md](file:///home/nauno/.gemini/antigravity/brain/7193705c-7716-438c-839f-e9161818e2d6/mcd.md) contient :
- Un **Diagramme de Classes Mermaid** complet visualisant les relations.
- Un **Dictionnaire de Données** détaillant chaque entité et ses attributs.

## 3. Entités Couvertes

### A. Cœur du Jeu (Core)
- **Character** : Le personnage joueur.
- **Race (Peuple)** : Avec modificateurs de stats et capacité raciale.
- **Profile (Profil)** : Classe de personnage, PV, Armes autorisées.
- **Family (Famille)** : Aventurier, Combattant, Mage, Mystique.
- **Stats** : Caractéristiques (FOR, DEX, etc.) et dérivés (Attaque, Défense).

### B. Progression & Capacités
- **Voie** : Groupes de capacités (5 rangs).
- **Capability (Capacité)** : Sorts et aptitudes passives/actives.
- **Quirk (Personnalité)** : Secrets, Travers, Idéaux (issus des tables aléatoires).
- **PregenCharacter (Prétiré)** : Modèles pour débutants.

### C. Économie & Équipement
- **Equipment/Weapon/Armor** : Gestion complète avec propriétés.
- **MagicItem** : Potions, Sceptres, Objets merveilleux.
- **Service** : Auberges, Soins.
- **Building (Immobilier)** : Achat de maisons/châteaux.
- **Vehicle** : Montures, Chariots, Bateaux.
- **CraftingRule** : Règles de fabrication.

### D. Univers & Lore
- **Language** : Langues et alphabets.
- **Faction** : Organisations, Royaumes, Guildes.
- **God (Divinité)** : Panthéon et armes sacrées.

### E. Aventure & Bestiaire
- **Creature** : Monstres avec stats complètes.
- **CreatureTemplate** : Règles de création et Boss.
- **Hazard** : Pièges, Poisons, Maladies.
- **Quest/Scene** : Structure des scénarios.

## 4. Vérification
Le modèle a été validé par :
1.  **Scan des Tables** : Vérification de tous les tableaux du livre de règles pour ne manquer aucune donnée structurée.
2.  **Analyse des Fichiers de Données** : Croisement avec les JSON existants (`creatures.json`, `materials.json`, etc.).
3.  **Recherche Textuelle** : Audit des règles pour des mécaniques spécifiques (Artisanat, Immobilier).

Le MCD est prêt à servir de référence pour l'implémentation de la base de données ou des structures TypeScript de l'application.
