// Normalized data types with IDs and relationships
// Generated from data normalization - 2025-12-07

import type { ItemBonusTarget } from './character';

// ============================================================================
// CHARACTER DATA
// ============================================================================

export interface RaceModifier {
    type: 'choice' | 'fixed' | 'logic';
    value: number;
    stat?: string;
    options?: string[];
    count?: number;
    logic?: string;
    description?: string;
}

export interface Race {
    id: string;
    name: string;
    description: string;
    detailedDescription: string;
    publicPerception: string;
    abilities: string;
    startingAge: number;
    lifeExpectancy: number;

    characteristics?: string;
    modifiers?: RaceModifier[]; // Array of stat modifiers from API
    speed?: string; // Vitesse (ex. "20 m/tour") — champ réel de l'API sur les 8 races officielles
    physicalTraits: string;
    typicalNames: string;
    minHeight: number;
    maxHeight: number;
    minWeight: number;
    maxWeight: number;
    voieId?: string; // Refactored Voie ID
    roleplay?: string;
    image?: string;
    availableVoies?: string[] | Voie[]; // Array of IRIs or Objects
}

export interface StartingEquipmentItem {
    id: string;
    quantity?: number;
    label?: string; // Optional override/choice description
}

export interface Family {
    id: number | string; // API uses number, but keep string compat for safe handling
    name: string;
    description: string;
    baseHp: number;
    recoveryDie: string;
    luckPoints: number;
    manaStat: string | null;
    specials?: string | null;
}

// Bloc de stats vitales d'un profil (JSON libre côté fixtures) : quelques clés connues,
// affichées explicitement (cf. ClassDetail), le reste rendu génériquement via Object.entries.
export interface ProfileStats {
    hpPerLevel?: number;
    profileType?: string;
    hitDie?: string;
    magicStat?: string;
    [key: string]: unknown;
}

// Élément d'équipement de départ d'un profil : item simple, choix (alternatives), ou ensemble.
export interface ProfileStartingEquipmentItem {
    item?: string;
    stats?: string;
    examples?: string;
    choice?: ProfileStartingEquipmentItem[];
    set?: ProfileStartingEquipmentItem[];
}

export interface Profile {
    id: number | string;
    name: string;
    description: string;
    note: string | null;
    stats?: ProfileStats;

    /** Ancienne prose « armes et armures » d'un profil, remplacée par `masteries`.
     *  L'API ne la sert plus ; conservée pour le repli des fiches communautaires. */
    weaponsAndArmor?: string;

    // Updated startingEquipment to reflect recent backend changes (raw array from JSON)
    startingEquipment?: (ProfileStartingEquipmentItem | string)[] | null;

    // New Masteries field
    masteries?: {
        weapons?: string;
        armors?: string;
        shields?: string;
        special?: string;
        weaponsAndArmors?: string;
        constraints?: string;
    } | null;

    imageUrl?: string;
    magicStat?: string | null; // carac de magie du profil (INT/CHA/PER) — source précise, cf. design §8
    armorMaxDef?: number | null; // seuil de DEF max d'armure autorisée (spec §8 ; -1 = aucune armure)

    // Relationships
    voies: string[] | Voie[]; // Array of IRIs or Objects
    // Relationship
    family?: string | Family; // IRI or Object

    // Rich Data
    lore?: Record<string, unknown>; // Structured JSON
}

export interface Voie {
    id: string;
    name: string;
    description?: string; // Added description
    type: string;
    /** Champ réel de l'API (`Voie.category`) : `type` ci-dessus est une valeur
     * renormalisée ad-hoc par certaines pages consommatrices (ex. `Voies.tsx`), absente
     * du JSON brut. Un objet obtenu via `getVoieById` ne porte que `category`. */
    category?: string;
    maxRank?: number;
    profileId: string | null; // Reference to profile ID
    details?: Record<string, unknown>; // Dynamic details from JSON
}

export interface Capacity {
    id: string;
    name: string;
    description: string;
    profileId: string | null; // Reference to profile ID
    voieId: string | null; // Reference to voie ID
    voie?: string; // IRI reference from API (e.g. /api/voies/123)
    rank: number | null;
    limited?: boolean;
    isSpell?: boolean;
    /** Type d'action (ex. "Attaque", "Limitée", "Passive") : vide pour les 650
     * capacités officielles à ce jour, mais saisi côté communautaire. */
    actionType?: string;
    details?: Record<string, unknown>; // Dynamic details from JSON
    /** États infligés, déclarés (cf. colonne `Capability.states`). Absent tant que rien
     *  n'est déclaré : l'API omet les valeurs nulles. */
    states?: string[];
    /** Entités invoquées, déclarées (cf. colonne `Capability.summons`). */
    summons?: CapabilitySummon[];
}

// ============================================================================
// EQUIPMENT DATA
// ============================================================================

export interface Weapon {
    id: string;
    name: string;
    type: string;
    damage: string;
    range: string;
    critical: string;
    price: string;
    isRanged: boolean;
    reload: string;
    requirements?: string;
}

export interface Armor {
    id: string;
    name: string;
    type: string;
    acBonus: number;
    acMaxAgi?: number;
    acPenalty?: number;
    price: string;
    comments: string;
}

export interface Material {
    id: string;
    name: string;
    price: string;
    notes?: string;
}

// ============================================================================
// PROVISIONS DATA
// ============================================================================

export interface Food {
    id: string;
    name: string;
    price: string;
}

export interface Lodging {
    id: string;
    name: string;
    price: string;
}

export interface Mount {
    id: string;
    name: string;
    price: string;
}

// ============================================================================
// STATES DATA
// ============================================================================

/** Mécaniques structurées d'un état préjudiciable (COF2, § États préjudiciables).
 *  `note` porte ce que le modèle de bonus ne sait pas exprimer — l'attaque à distance
 *  n'a pas de cible propre, par exemple. */
export interface HarmfulStateEffects {
    bonuses?: { target: ItemBonusTarget; value: number }[];
    /** Dé malus : sur tous les tests, ou seulement sur les tests d'attaque. */
    malusDie?: 'all' | 'attack';
    noAction?: boolean;
    noMove?: boolean;
    /** Déplacement plafonné, en mètres. */
    moveLimit?: number;
    note?: string;
}

export interface HarmfulState {
    id: string;
    name: string;
    description: string;
    image: string;
    effects?: HarmfulStateEffects;
}

export interface Poison {
    id: string;
    name: string;
    effectFail?: string;
    effectSuccess?: string;
    duration?: string;
    delay?: string;
    note?: string;
}

export interface Trap {
    id: string;
    name: string;
    detectDifficulty?: string;
    disarmDifficulty?: string;
    effect?: string;
    complement?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

// For API responses with relationships expanded
export interface ProfileWithVoies extends Profile {
    voiesData: Voie[];
}

export interface VoieWithCapacities extends Voie {
    capacities: Capacity[];
}

// ============================================================================
// COMPLEX / RAW DATA TYPES (Direct mapping from JSON)
// ============================================================================

export interface Field<T = string> {
    value: T;
    label?: string;
    format?: string;
    target_id?: string;
    src?: string;
    alt?: string;
    width?: string;
    height?: string;
    creature_token_url?: string;
}

export interface CreatureData {
    name: string;
    test: string;
    dm: string;
    special: string | null;
    リーチ?: string | null; // Handling potential typo/legacy field name if exists, or normalize to reach
    reach: string | null;
}

export interface CreatureAttackField extends Field {
    data: CreatureData[];
}

export interface CreatureCapability {
    target_id: string;
    label: string;
    rank: string;
    is_limited: string;
    is_magical: string;
    description: string;
    paths?: string;
}

export interface CreaturePath {
    id: string;
    rank: number;
}

// Simplified Creature interface matching API Platform response
export interface Creature {
    id: number;
    name: string;
    description: string;
    nc: number; // level
    hp: number;
    def: number;
    init: number;
    /**
     * Caractéristiques bénéficiant d'un dé bonus à tous leurs tests — l'astérisque du livre
     * (« AGI +3* »). Des NOMS de caractéristiques, jamais des valeurs : celles-ci vivent
     * dans `stats`, et les dédoubler ferait deux vérités pour un même chiffre.
     */
    statsSuperior?: string[];
    stats: {
        // Caractéristiques COF2 (7) — ordre du profil de créature du livre.
        AGI: number;
        CON: number;
        FOR: number;
        PER: number;
        CHA: number;
        INT: number;
        VOL: number;
    };
    family?: {
        id: number;
        name: string;
    };
    specialAbilities?: {
        text: string;
    };
    attacks?: CustomCreatureAttack[]; // JSON array
    capabilities?: CustomCreatureCapability[]; // JSON array
    picture?: string;

    // Extended properties
    category?: string;
    environment?: string;
    archetype?: string;
    size?: string;
}

export interface CustomCreatureAttack {
    name: string;
    atk?: string; // bonus/test d'attaque (texte libre, ex. "+5")
    dm?: string; // dégâts (ex. "1d6+2")
    special?: string;
}

/**
 * Entité invoquée par une capacité. Elle EXISTE toujours déjà : on ne crée rien depuis
 * une invocation, ce qui interdit l'enchaînement sans fin de formulaires.
 *
 * `ref` désigne le **nom** pour le contenu officiel — `Creature` comme les tables
 * d'équipement utilisent `#[ORM\GeneratedValue]`, leurs identifiants changent à chaque
 * rechargement des fixtures — `custom-<id>` pour un monstre maison, `homebrew-<id>` pour
 * une entrée communautaire.
 */
/**
 * Créature ou objet qu'une capacité met en jeu. DÉCLARÉ, jamais détecté.
 *
 * Deux capacités officielles seulement en portent — « Animation des morts » (Zombi humain) et
 * « Panthère ». Ce n'est pas un oubli de saisie : **à COF2, une invocation porte son profil
 * dans le texte du sort**, pas dans le bestiaire. L'élémentaire du magicien, le démon du
 * sorcier et le serviteur invisible ont leurs caractéristiques dans leur propre description,
 * souvent dérivées du niveau du lanceur — les rattacher à une entrée du bestiaire poserait sur
 * la table un profil qui n'est pas le leur. D'autres laissent explicitement le CHOIX au joueur
 * (« monture géante de son choix — mammouth, dinosaure, aigle géant, etc. »), et désigner une
 * créature reviendrait à choisir à sa place.
 *
 * Le contenu maison et communautaire, lui, en déclare librement : c'est là que la clé sert le
 * plus.
 */
export interface CapabilitySummon {
    type: 'creature' | 'item';
    ref: string;
    /** Nombre d'exemplaires ; absent, vaut 1. Sans objet pour un objet. */
    quantity?: number;
}

export interface CustomCreatureCapability {
    /** Nom d'une capacité de monstre maison. Absent du bestiaire officiel, dont les
     *  393 capacités nomment TOUTES via `label` — d'où les deux champs facultatifs.
     *  Tout affichage lit `label ?? name`. */
    name?: string;
    label?: string;
    rank?: number;
    description?: string;
    /** États infligés, déclarés — jamais devinés du texte à l'exécution. */
    states?: string[];
    /** Entités invoquées, toujours existantes. */
    summons?: CapabilitySummon[];
    /** Voie d'origine, pour une capacité de personnage projetée au suivi de combat :
     *  un PJ à trois voies donne sinon une liste plate où deux capacités « rang 1 »
     *  sont indiscernables. Absent pour une capacité de créature. */
    voieName?: string;
}

// Monstre « maison » créé par un MJ (hors compendium SRD), owner-scopé côté API.
// Reprend la forme de Creature pour rester importable dans le Suivi de Combat.
export interface CustomCreature {
    id: number;
    name: string;
    description?: string;
    nc: number;
    hp: number;
    def: number;
    init: number;
    statsSuperior?: string[];
    stats?: {
        // Caractéristiques COF2 (7) — ordre du profil de créature du livre.
        AGI: number;
        CON: number;
        FOR: number;
        PER: number;
        CHA: number;
        INT: number;
        VOL: number;
    };
    specialAbilities?: {
        text: string;
    };
    attacks?: CustomCreatureAttack[];
    capabilities?: CustomCreatureCapability[];
    picture?: string;
    category?: string;
    environment?: string;
    archetype?: string;
    size?: string;
    /** « private » (défaut) ou « public » (publié dans la bibliothèque communautaire). */
    visibility?: 'private' | 'public';
    /** Auteur (exposé en lecture) — sert à distinguer mon contenu de celui de la communauté. */
    authorId?: number;
    authorPseudo?: string | null;
}
