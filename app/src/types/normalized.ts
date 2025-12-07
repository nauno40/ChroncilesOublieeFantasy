// Normalized data types with IDs and relationships
// Generated from data normalization - 2025-12-07

// ============================================================================
// CHARACTER DATA
// ============================================================================

export interface Race {
    id: string;
    name: string;
    description: string;
    detailedDescription: string;
    publicPerception: string;
    abilities: string;
    startingAge: number;
    lifeExpectancy: number;
    characteristics: string;
    physicalTraits: string;
    typicalNames: string;
    size: {
        min: string;
        max: string;
    };
    weight: {
        min: string;
        max: string;
    };
}

export interface Profile {
    id: string;
    name: string;
    description: string;
    note: string;
    hitDie: string;
    weaponsAndArmor: string;
    startingEquipment: string;
    imageUrl: string;
    magicModifier: string | null;
    voies: string[]; // Array of voie IDs
}

export interface Voie {
    id: string;
    name: string;
    type: string;
    profileId: string | null; // Reference to profile ID
}

export interface Capacity {
    id: string;
    name: string;
    description: string;
    profileId: string | null; // Reference to profile ID
    voieId: string | null; // Reference to voie ID
    rank: number | null;
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
}

export interface Armor {
    id: string;
    name: string;
    type: string;
    defense: string;
    price: string;
    comments: string;
}

export interface Material {
    id: string;
    name: string;
    price: string;
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
// LEGACY TYPES (deprecated, use normalized types above)
// ============================================================================

/** @deprecated Use Race instead */
export interface RaceLegacy {
    Title: string;
    Desc: string;
    Desc2: string;
    Capacités: string;
    "Âge de départ": string;
    Desc3: string;
    Repères: string;
    "Espérance de vie": string;
    Caractéristiques: string;
    "Noms typiques": string;
    "Taille Min": string;
    "Taille Max": string;
    "Poids Min": string;
    "Poids Max": string;
}

/** @deprecated Use Profile instead */
export interface ProfileLegacy {
    Note: string;
    Profil: string;
    Description: string;
    "Dé de vie": string;
    "Armes et armures": string;
    "Equipement de départ": string;
    Image_URL: string;
    Voie1: string;
    Voie2: string;
    Voie3: string;
    Voie4: string;
    Voie5: string;
    Mod: string;
}

/** @deprecated Use Capacity instead */
export interface CapacityLegacy {
    Nom: string;
    Desc: string;
    Profile: string;
    Voie: string;
    rang: string;
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

export interface CapacityWithRelations extends Capacity {
    profile?: Profile;
    voie?: Voie;
}
