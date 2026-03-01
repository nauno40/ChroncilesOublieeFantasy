export interface Character {
    id?: number;
    name: string;
    level: number;
    race?: string | { '@id': string, id: number, name: string };
    profile?: string | { '@id': string, id: number, name: string };
    data: CharacterData;
    createdAt?: string;
    updatedAt?: string;
}

export interface CharacterData {
    stats: {
        FOR: number;
        AGI: number;
        CON: number;
        INT: number;
        PER: number;
        CHA: number;
        VOL: number;
    };
    modifiers: {
        FOR: number;
        AGI: number;
        CON: number;
        INT: number;
        PER: number;
        CHA: number;
        VOL: number;
    };
    hp: {
        current: number;
        max: number;
    };
    mp: {
        current: number;
        max: number;
    };
    attack: {
        contact: number;
        distance: number;
        magic: number;
        weapons: {
            name: string;
            atkMod: number;
            dmg: string;
            special: string;
        }[];
    };
    def: number;
    init: number;
    rp: {
        ideal: string;
        flaw: string;
    };
    luck: {
        current: number;
        max: number;
    };
    protection: {
        armor: { name: string, def: number };
        shield: { name: string, def: number };
    };
    recovery: {
        die: string;
        value: number; // e.g., 5 for d10
    };
    voies: {
        racial: { name: string; ranks: boolean[] };
        profile: { name: string; ranks: boolean[] }[]; // Array of 5
        prestige: { name: string; ranks: boolean[] }[];
    };
    money: {
        pa: number;
    };
    equipment: string[]; // Simple list for now, or object array if complex
    // Add more as we build the sheet
}
