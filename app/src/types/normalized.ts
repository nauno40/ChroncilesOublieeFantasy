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

export interface Profile {
    id: number | string;
    name: string;
    description: string;
    note: string | null;
    hitDie: string;
    stats?: any;
    skillPoints: number;

    // Virtual/Mapped fields for frontend display
    weaponsAndArmor?: string;

    // Updated startingEquipment to reflect recent backend changes (raw array from JSON)
    startingEquipment?: any[] | null;

    // New Masteries field
    masteries?: {
        weapons?: string;
        armors?: string;
        shields?: string;
        special?: string;
        weaponsAndArmors?: string;
        constraints?: string;
        [key: string]: any;
    } | null;

    imageUrl?: string;
    magicModifier?: string | null;

    // Relationships
    voies: string[] | Voie[]; // Array of IRIs or Objects
    // Relationship
    family?: string | Family; // IRI or Object

    // Rich Data
    lore?: any; // Structured JSON
}

export interface Voie {
    id: string;
    name: string;
    description?: string; // Added description
    note_speciale?: string | null;
    type: string;
    profileId: string | null; // Reference to profile ID
    details?: any; // Dynamic details from JSON
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
    details?: any; // Dynamic details from JSON
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
        FOR: number;
        DEX: number;
        CON: number;
        INT: number;
        SAG: number;
        CHA: number;
    };
    family?: {
        id: number;
        name: string;
    };
    specialAbilities?: {
        text: string;
    };
    attacks?: any[]; // JSON array
    capabilities?: any[]; // JSON array
    picture?: string;

    // Extended properties
    category?: string;
    environment?: string;
    archetype?: string;
    size?: string;
}
