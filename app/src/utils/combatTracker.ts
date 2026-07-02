import type { Combatant } from '../types/campaign';

export interface TrackerState {
    round: number;
    activeId: string | null;
    combatants: Combatant[];
}

/** Tri par initiative décroissante, stable en cas d'égalité (ordre d'insertion). */
export const sortByInitiative = (combatants: Combatant[]): Combatant[] =>
    combatants
        .map((c, i) => ({ c, i }))
        .sort((a, b) => b.c.initiative - a.c.initiative || a.i - b.i)
        .map(({ c }) => c);

/** Avance au combattant suivant dans l'ordre d'initiative ; wrap => round + 1. */
export const nextTurn = (state: TrackerState): TrackerState => {
    const order = sortByInitiative(state.combatants);
    if (order.length === 0) return { ...state, activeId: null };
    const idx = order.findIndex(c => c.id === state.activeId);
    // Pas de tour actif (ou introuvable) : on démarre au premier, round inchangé.
    if (idx === -1) return { ...state, activeId: order[0].id };
    const nextIdx = (idx + 1) % order.length;
    const wrapped = nextIdx === 0;
    return {
        ...state,
        activeId: order[nextIdx].id,
        round: wrapped ? state.round + 1 : state.round,
    };
};

/** Retire un combattant par id sans corrompre le tour actif. */
export const removeById = (state: TrackerState, id: string): TrackerState => {
    const order = sortByInitiative(state.combatants);
    const removedIdx = order.findIndex(c => c.id === id);
    const remaining = order.filter(c => c.id !== id);
    let activeId = state.activeId;
    if (state.activeId === id) {
        activeId = remaining.length === 0
            ? null
            : remaining[Math.min(removedIdx, remaining.length - 1)].id;
    }
    return { ...state, combatants: remaining, activeId };
};

/** Applique un delta de PV, clampé entre 0 et max. */
export const applyHp = (combatants: Combatant[], id: string, delta: number): Combatant[] =>
    combatants.map(c =>
        c.id === id
            ? { ...c, hp: { ...c.hp, current: Math.max(0, Math.min(c.hp.max, c.hp.current + delta)) } }
            : c,
    );
