// Normalized data types with IDs and relationships
// Generated from data normalization - 2025-12-07

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
    hitDie: string;
    stats?: ProfileStats;
    skillPoints: number;

    // Virtual/Mapped fields for frontend display
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
    magicModifier?: string | null;
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
    note_speciale?: string | null;
    type: string;
    profileId: string | null; // Reference to profile ID
    details?: Record<string, unknown>; // Dynamic details from JSON
}

export interface Capacity {
    id: string;
    name: string;
    description: string;
    active: boolean;
    profileId: string | null; // Reference to profile ID
    voieId: string | null; // Reference to voie ID
    voie?: string; // IRI reference from API (e.g. /api/voies/123)
    rank: number | null;
    limited?: boolean;
    isSpell?: boolean;
    details?: Record<string, unknown>; // Dynamic details from JSON
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

export interface HarmfulState {
    id: string;
    name: string;
    description: string;
    image: string;
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

export interface CustomCreatureCapability {
    name: string;
    // Les capacités SRD (Creature.capabilities) nomment parfois via `label` plutôt que `name`.
    label?: string;
    rank?: number;
    description?: string;
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
}
