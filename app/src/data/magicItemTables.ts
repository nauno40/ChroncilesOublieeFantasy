export interface MagicTable { name: string; category: string; die: number; entries: [number, number, string][]; }

// Tables de génération d'objets magiques, transcrites du chapitre « Objets magiques » (partie MJ).
export const MAGIC_ITEM_TABLES: MagicTable[] = [
  {
    "name": "Origine d'un objet magique",
    "category": "Divers",
    "die": 10,
    "entries": [
      [
        1,
        1,
        "Locale"
      ],
      [
        2,
        2,
        "La nation où l'objet est découvert."
      ],
      [
        3,
        3,
        "Une nation voisine de la nation où l'objet vient d'être trouvé."
      ],
      [
        4,
        4,
        "Grand Nord"
      ],
      [
        5,
        5,
        "Sud profond"
      ],
      [
        6,
        6,
        "Ouest lointain"
      ],
      [
        7,
        7,
        "Est lointain"
      ],
      [
        8,
        8,
        "Les profondeurs"
      ],
      [
        9,
        9,
        "Un autre continent"
      ],
      [
        10,
        10,
        "Un autre plan"
      ]
    ]
  },
  {
    "name": "Type de potion",
    "category": "Potions",
    "die": 6,
    "entries": [
      [
        1,
        3,
        "Potion de soins"
      ],
      [
        4,
        5,
        "Potion commune"
      ],
      [
        6,
        6,
        "Potion rare"
      ]
    ]
  },
  {
    "name": "Potions de soins",
    "category": "Potions",
    "die": 6,
    "entries": [
      [
        1,
        3,
        "Récupération mineure (Prêtre)"
      ],
      [
        4,
        5,
        "Récupération majeure (Prêtre)"
      ],
      [
        6,
        6,
        "Délivrance (Prêtre)"
      ]
    ]
  },
  {
    "name": "Potions communes",
    "category": "Potions",
    "die": 10,
    "entries": [
      [
        1,
        1,
        "Détection de l'invisible (Ensorceleur)"
      ],
      [
        2,
        2,
        "Lévitation (Magicien)"
      ],
      [
        3,
        3,
        "Forme gazeuse (Magicien)"
      ],
      [
        4,
        4,
        "Accélération (Magicien)"
      ],
      [
        5,
        5,
        "Maîtrise des éléments (Magicien)"
      ],
      [
        6,
        6,
        "Respiration aquatique (Magicien)"
      ],
      [
        7,
        7,
        "Armure de mana (Magicien)"
      ],
      [
        8,
        8,
        "Chute ralentie (Magicien)"
      ],
      [
        9,
        9,
        "Invisibilité (Magicien)"
      ],
      [
        10,
        10,
        "Vol (Magicien)"
      ]
    ]
  },
  {
    "name": "Potions rares",
    "category": "Potions",
    "die": 20,
    "entries": [
      [
        1,
        1,
        "Langage des animaux (Druide, 1d6 minutes)"
      ],
      [
        2,
        2,
        "Masque du prédateur (Druide)"
      ],
      [
        3,
        3,
        "Forme animale (Druide, 1d6 minutes)"
      ],
      [
        4,
        4,
        "Terrains difficiles (Druide, 2d6 h)"
      ],
      [
        5,
        5,
        "Forme d'arbre (Druide, 2d6 minutes)"
      ],
      [
        6,
        6,
        "Peau d'écorce (Druide, +5 DEF)"
      ],
      [
        7,
        7,
        "Clairvoyance (Ensorceleur, 1d6 tours)"
      ],
      [
        8,
        8,
        "Sous tension (Ensorceleur)"
      ],
      [
        9,
        9,
        "Forme éthérée (Ensorceleur)"
      ],
      [
        10,
        10,
        "Imitation (Ensorceleur)"
      ],
      [
        11,
        11,
        "Fortifiant (Forgesort)"
      ],
      [
        12,
        12,
        "Feu grégeois (Forgesort)"
      ],
      [
        13,
        13,
        "Élixir de guérison (Forgesort)"
      ],
      [
        14,
        14,
        "Déphasage (Magicien)"
      ],
      [
        15,
        15,
        "Beauté de la succube (Sorcier)"
      ],
      [
        16,
        16,
        "Aspect du démon (Sorcier)"
      ],
      [
        17,
        17,
        "Masque mortuaire (Sorcier)"
      ],
      [
        18,
        18,
        "Reptation (Sorcier)"
      ],
      [
        19,
        19,
        "Ailes célestes (Prêtre)"
      ],
      [
        20,
        20,
        "Sanctuaire (Prêtre)"
      ]
    ]
  },
  {
    "name": "Parchemin / Baguette – Voie du sort inscrit",
    "category": "Parchemins & baguettes",
    "die": 20,
    "entries": [
      [
        1,
        1,
        "Ensorceleur ‑ Voie de l'air"
      ],
      [
        2,
        2,
        "Ensorceleur ‑ Voie de la divination"
      ],
      [
        3,
        3,
        "Ensorceleur ‑ Voie de l'envoûteur"
      ],
      [
        4,
        4,
        "Ensorceleur ‑ Voie des illusions"
      ],
      [
        5,
        5,
        "Ensorceleur ‑ Voie de l'invocation"
      ],
      [
        6,
        6,
        "Magicien ‑ Voie de la magie des arcanes"
      ],
      [
        7,
        7,
        "Magicien ‑ Voie de la magie destructrice"
      ],
      [
        8,
        8,
        "Magicien ‑ Voie de la magie élémentaire"
      ],
      [
        9,
        9,
        "Magicien ‑ Voie de la magie protectrice"
      ],
      [
        10,
        10,
        "Magicien ‑ Voie de la magie universelle"
      ],
      [
        11,
        11,
        "Sorcier ‑ Voie du démon"
      ],
      [
        12,
        12,
        "Sorcier ‑ Voie de la mort"
      ],
      [
        13,
        13,
        "Sorcier ‑ Voie de l'outre‑tombe"
      ],
      [
        14,
        14,
        "Sorcier ‑ Voie du sang"
      ],
      [
        15,
        15,
        "Sorcier ‑ Voie de la sombre magie"
      ],
      [
        16,
        16,
        "Prêtre ‑ Voie de la foi"
      ],
      [
        17,
        17,
        "Prêtre ‑ Voie de la prière"
      ],
      [
        18,
        18,
        "Prêtre ‑ Voie des soins"
      ],
      [
        19,
        19,
        "Prêtre ‑ Voie de la spiritualité"
      ],
      [
        20,
        20,
        "Druide ‑ Voie des végétaux"
      ]
    ]
  },
  {
    "name": "Types d'armes magiques",
    "category": "Armes magiques",
    "die": 6,
    "entries": [
      [
        1,
        3,
        "Arme de contact"
      ],
      [
        4,
        5,
        "Arme à distance"
      ],
      [
        6,
        6,
        "Sceptre de magie (DM comme un bâton : 1d6)"
      ]
    ]
  },
  {
    "name": "Armes magiques – Propriétés des armes de contact",
    "category": "Armes magiques",
    "die": 12,
    "entries": [
      [
        1,
        2,
        "Affûtée"
      ],
      [
        3,
        3,
        "Fléau des morts"
      ],
      [
        4,
        4,
        "Fléau des dragons"
      ],
      [
        5,
        5,
        "Fléau des géants"
      ],
      [
        6,
        6,
        "Fléau des goblinoïdes"
      ],
      [
        7,
        7,
        "Fléau des démons"
      ],
      [
        8,
        8,
        "Feu"
      ],
      [
        9,
        9,
        "Froid"
      ],
      [
        10,
        10,
        "Foudre"
      ],
      [
        11,
        12,
        "Tirez deux propriétés, doublez son effet ou spécial*"
      ]
    ]
  },
  {
    "name": "Armes magiques – Armes de contact et armes à distance",
    "category": "Armes magiques",
    "die": 20,
    "entries": [
      [
        1,
        1,
        "Maniques (mains nues)"
      ],
      [
        2,
        2,
        "Bâton"
      ],
      [
        3,
        4,
        "Dague"
      ],
      [
        5,
        5,
        "Épée bâtarde"
      ],
      [
        6,
        7,
        "Épée courte"
      ],
      [
        8,
        10,
        "Épée longue"
      ],
      [
        11,
        11,
        "Hache à une main"
      ],
      [
        12,
        13,
        "Épée à deux mains"
      ],
      [
        14,
        14,
        "Hache à deux mains"
      ],
      [
        15,
        16,
        "Masse ou marteau"
      ],
      [
        17,
        18,
        "Rapière"
      ],
      [
        19,
        19,
        "Vivelame ou Katana"
      ],
      [
        20,
        20,
        "Autre arme"
      ]
    ]
  },
  {
    "name": "Armures magiques",
    "category": "Objets de défense",
    "die": 20,
    "entries": [
      [
        1,
        2,
        "Anneau ou cape de protection"
      ],
      [
        3,
        4,
        "Bracelets de défense ou robe de mage"
      ],
      [
        5,
        6,
        "Cuir"
      ],
      [
        7,
        8,
        "Cuir renforcé"
      ],
      [
        9,
        10,
        "Chemise de mailles"
      ],
      [
        11,
        13,
        "Cotte de mailles"
      ],
      [
        14,
        15,
        "Demi‑plaque"
      ],
      [
        16,
        16,
        "Plaque complète"
      ],
      [
        17,
        18,
        "Petit bouclier"
      ],
      [
        19,
        20,
        "Grand bouclier"
      ]
    ]
  },
  {
    "name": "Propriétés des armures magiques",
    "category": "Objets de défense",
    "die": 12,
    "entries": [
      [
        1,
        1,
        "Action libre"
      ],
      [
        2,
        2,
        "Défense ou défense supérieure"
      ],
      [
        3,
        3,
        "Natation"
      ],
      [
        4,
        4,
        "Ombre"
      ],
      [
        5,
        5,
        "Protection"
      ],
      [
        6,
        6,
        "Résistance à la magie"
      ],
      [
        7,
        7,
        "Résistance au feu"
      ],
      [
        8,
        8,
        "Résistance au froid"
      ],
      [
        9,
        9,
        "Résistance à l'électricité"
      ],
      [
        10,
        10,
        "Résistance à l'acide"
      ],
      [
        11,
        11,
        "Mobile"
      ],
      [
        12,
        12,
        "Tirez deux propriétés ou doublez son effet ou spécial*"
      ]
    ]
  },
  {
    "name": "Rang du pouvoir",
    "category": "Objets de pouvoir",
    "die": 8,
    "entries": [
      [
        1,
        2,
        "1"
      ],
      [
        3,
        4,
        "2"
      ],
      [
        5,
        6,
        "3"
      ],
      [
        7,
        7,
        "4"
      ],
      [
        8,
        8,
        "5"
      ]
    ]
  },
  {
    "name": "Type de pouvoir",
    "category": "Objets de pouvoir",
    "die": 20,
    "entries": [
      [
        1,
        1,
        "Arquebusier"
      ],
      [
        2,
        2,
        "Barde"
      ],
      [
        3,
        3,
        "Barbare"
      ],
      [
        4,
        4,
        "Chevalier"
      ],
      [
        5,
        6,
        "Druide"
      ],
      [
        7,
        8,
        "Ensorceleur"
      ],
      [
        9,
        10,
        "Forgesort"
      ],
      [
        11,
        11,
        "Guerrier"
      ],
      [
        12,
        13,
        "Magicien"
      ],
      [
        14,
        14,
        "Moine"
      ],
      [
        15,
        16,
        "Sorcier"
      ],
      [
        17,
        18,
        "Prêtre"
      ],
      [
        19,
        19,
        "Rôdeur"
      ],
      [
        20,
        20,
        "Voleur"
      ]
    ]
  },
  {
    "name": "Objet de puissance",
    "category": "Objets de puissance",
    "die": 12,
    "entries": [
      [
        1,
        1,
        "AGI"
      ],
      [
        2,
        2,
        "CON"
      ],
      [
        3,
        3,
        "FOR"
      ],
      [
        4,
        4,
        "PER"
      ],
      [
        5,
        5,
        "CHA"
      ],
      [
        6,
        6,
        "INT"
      ],
      [
        7,
        7,
        "VOL"
      ],
      [
        8,
        8,
        "DR"
      ],
      [
        9,
        9,
        "PC"
      ],
      [
        10,
        10,
        "PM"
      ],
      [
        11,
        11,
        "PV"
      ],
      [
        12,
        12,
        "Relancer"
      ]
    ]
  }
];
