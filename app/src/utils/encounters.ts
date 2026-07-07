import type { Encounter, Combatant } from '../types/campaign';
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
