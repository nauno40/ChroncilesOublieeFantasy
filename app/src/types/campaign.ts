export interface Character {
    id: string;
    name: string;
    race: string;
    class: string;
    level: number;
    hp: { current: number; max: number };
    notes?: string;
}

export interface Session {
    id: string;
    title: string;
    date: string;
    duration: string;
    level: string;
    summary: string;
}

export interface Campaign {
    id: string;
    name: string;
    description: string;
    created_at: number;
    updated_at: number;
    characters: Character[];
    encounters: Encounter[];
    sessions: Session[];
    notes?: string;
}

export interface Encounter {
    id: string;
    name: string;
    status: 'planned' | 'active' | 'completed';
    round: number;
    combatants: Combatant[];
}

export interface Combatant {
    id: string;
    name: string;
    type: 'player' | 'npc' | 'monster';
    initiative: number;
    hp: { current: number; max: number };
    ac: number;
    referenceId?: string; // ID in the JSON data for monsters
}
