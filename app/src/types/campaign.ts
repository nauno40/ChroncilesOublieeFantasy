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

export interface Quest {
    id: string;
    title: string;
    description?: string;
    type: 'main' | 'secondary';
    status: 'active' | 'completed' | 'failed';
}

export interface Clue {
    id: string;
    content: string;
    found_at?: string;
    status: 'unsolved' | 'solved';
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
    quests?: Quest[];
    clues?: Clue[];
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
    def: number;
    per: number; // Perception — départage COF2 à initiative égale
    tiebreak: number; // 1d20 stocké — départage final stable si INIT + PER égales
    states: string[];
    source?: 'manual' | 'bestiary' | 'character';
    referenceId?: string; // ID source (bestiaire/perso)
}
