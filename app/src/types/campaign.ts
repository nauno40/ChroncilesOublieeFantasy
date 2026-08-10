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
    shared?: boolean;
}

export interface Clue {
    id: string;
    content: string;
    found_at?: string;
    status: 'unsolved' | 'solved';
    shared?: boolean;
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

// Une entrée du roster d'une rencontre préparée (créature + quantité).
export interface EncounterCombatant {
    name: string;
    source: 'bestiary' | 'custom' | 'manual';
    referenceId?: string; // id SRD ("12") ou monstre custom ("custom-3")
    quantity: number;
    initiative: number;
    hp: number; // PV max par unité
    def: number;
    per: number;
    nc?: number; // niveau de challenge (pour la jauge de menace)
}

// Rencontre préparée par le MJ : un roster nommé, lançable dans le Suivi de Combat.
export interface Encounter {
    id: string;
    name: string;
    notes?: string;
    combatants: EncounterCombatant[];
}

export interface Combatant {
    id: string;
    name: string;
    type: 'player' | 'npc' | 'monster';
    initiative: number;
    hp: { current: number; max: number };
    def: number;
    level?: number; // niveau (PJ) ou NC (créature) — départage COF2 à initiative égale
    per: number; // Perception (indicatif ; l'Init l'inclut déjà)
    tiebreak: number; // 1d20 stocké — départage final stable
    states: string[];
    /**
     * Réduction des dommages (COF2). SAISIE, jamais devinée : 29 créatures du bestiaire la
     * mentionnent, mais en texte libre dans leurs capacités (« RD 2 avec des armes ») —
     * l'extraire par expression régulière donnerait des faux positifs, et ce projet a déjà
     * tranché en faveur de la déclaration pour les états et les invocations.
     */
    rd?: number;
    /** Valeur d'attaque (COF2 : niveau plafonné à 10 + carac). Saisie, comme la RD. */
    atk?: number;
    source?: 'manual' | 'bestiary' | 'character';
    referenceId?: string; // ID source (bestiaire/perso)
}
