import type { Encounter, EncounterCombatant, Combatant } from '../types/campaign';
import type { TrackerState } from './combatTracker';

// Doit correspondre à la clé lue par CombatTracker (loadState).
export const COMBAT_STORAGE_KEY = 'co_combat_tracker';

const rollTiebreak = (): number => Math.floor(Math.random() * 20) + 1;

// Développe le roster d'une rencontre en combattants du Suivi de Combat,
// avec auto-numérotation « Gobelin 1 / 2 » quand la quantité > 1.
export const encounterToCombatants = (encounter: Encounter): Combatant[] => {
    const combatants: Combatant[] = [];
    for (const entry of encounter.combatants) {
        const qty = Math.max(1, entry.quantity || 1);
        for (let i = 0; i < qty; i++) {
            combatants.push({
                id: crypto.randomUUID(),
                name: qty > 1 ? `${entry.name} ${i + 1}` : entry.name,
                type: 'monster',
                initiative: entry.initiative,
                hp: { current: entry.hp, max: entry.hp },
                def: entry.def,
                per: entry.per,
                tiebreak: rollTiebreak(),
                states: [],
                source: 'bestiary',
                referenceId: entry.referenceId,
            });
        }
    }
    return combatants;
};

// Écrit la rencontre développée dans le localStorage du Suivi de Combat.
// Le tracker recharge cet état à son montage (loadState).
export const loadEncounterIntoTracker = (encounter: Encounter): void => {
    const state: TrackerState = {
        round: 1,
        activeId: null,
        combatants: encounterToCombatants(encounter),
    };
    localStorage.setItem(COMBAT_STORAGE_KEY, JSON.stringify(state));
};

// --- Générateur de rencontre (heuristique calibrée sur le groupe) ---

export type EncounterDifficulty = 'facile' | 'normale' | 'difficile' | 'mortelle';

export const DIFFICULTIES: EncounterDifficulty[] = ['facile', 'normale', 'difficile', 'mortelle'];

// Chaque créature « coûte » son NC ; le budget = taille × niveau moyen × facteur.
const DIFFICULTY_FACTOR: Record<EncounterDifficulty, number> = {
    facile: 0.5,
    normale: 1.0,
    difficile: 1.5,
    mortelle: 2.0,
};

// Une créature exploitable par le générateur (bestiaire SRD ou monstre custom).
export interface GeneratorCreature {
    referenceId: string; // "12" (SRD) ou "custom-3"
    name: string;
    source: 'bestiary' | 'custom';
    nc: number;
    hp: number;
    def: number;
    init: number;
    per: number;
    environment?: string;
}

export const encounterBudget = (
    partySize: number,
    avgLevel: number,
    difficulty: EncounterDifficulty,
): number => Math.max(1, Math.round(partySize * avgLevel * DIFFICULTY_FACTOR[difficulty]));

const normalizeEnv = (s?: string): string => (s || '').trim().toLowerCase();

// Compose un roster depuis les créatures d'un environnement, en remplissant le
// budget de NC. Renvoie [] si aucune créature ne correspond.
export const generateEncounter = (params: {
    pool: GeneratorCreature[];
    environment: string;
    difficulty: EncounterDifficulty;
    partySize: number;
    avgLevel: number;
}): EncounterCombatant[] => {
    const { pool, environment, difficulty, partySize, avgLevel } = params;
    const budget = encounterBudget(partySize, avgLevel, difficulty);
    const candidates = pool.filter(
        c => normalizeEnv(c.environment) === normalizeEnv(environment) && c.nc >= 1 && c.nc <= budget,
    );
    if (candidates.length === 0) return [];

    const MAX_TYPES = 4;
    const MAX_TOTAL = 10;
    const roster = new Map<string, EncounterCombatant>();
    let remaining = budget;
    let total = 0;
    let guard = 0;

    while (remaining >= 1 && total < MAX_TOTAL && guard < 80) {
        guard++;
        // Au plafond de types distincts, on renforce plutôt les types déjà présents.
        const atTypeCap = roster.size >= MAX_TYPES;
        const affordable = candidates.filter(
            c => c.nc <= remaining && (!atTypeCap || roster.has(c.referenceId)),
        );
        if (affordable.length === 0) break;
        const pick = affordable[Math.floor(Math.random() * affordable.length)];

        const existing = roster.get(pick.referenceId);
        if (existing) {
            existing.quantity += 1;
        } else {
            roster.set(pick.referenceId, {
                name: pick.name,
                source: pick.source,
                referenceId: pick.referenceId,
                quantity: 1,
                initiative: pick.init,
                hp: pick.hp,
                def: pick.def,
                per: pick.per,
                nc: pick.nc,
            });
        }
        remaining -= pick.nc;
        total += 1;
    }
    return [...roster.values()];
};

// Somme des NC du roster (× quantités) — base de la jauge de menace.
export const rosterNC = (roster: EncounterCombatant[]): number =>
    roster.reduce((sum, c) => sum + (c.nc ?? 0) * (c.quantity || 1), 0);

// Étiquette de menace d'une rencontre relative au groupe.
export const threatLabel = (
    roster: EncounterCombatant[],
    partySize: number,
    avgLevel: number,
): { label: string; tone: string } | null => {
    if (roster.some(c => c.nc == null) || partySize < 1 || avgLevel < 1) return null;
    const ratio = rosterNC(roster) / Math.max(1, partySize * avgLevel);
    if (ratio < 0.75) return { label: 'Facile', tone: 'text-green-400 bg-green-500/10 border-green-500/20' };
    if (ratio < 1.25) return { label: 'Équilibrée', tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    if (ratio < 1.75) return { label: 'Difficile', tone: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { label: 'Mortelle', tone: 'text-red-400 bg-red-500/10 border-red-500/20' };
};

// Vrai si un combat est déjà en cours dans le tracker (pour confirmer l'écrasement).
export const trackerHasCombat = (): boolean => {
    try {
        const raw = localStorage.getItem(COMBAT_STORAGE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as TrackerState;
        return Array.isArray(parsed.combatants) && parsed.combatants.length > 0;
    } catch {
        return false;
    }
};
