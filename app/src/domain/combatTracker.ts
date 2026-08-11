import type { Combatant } from '../types/campaign';
import { bonusRendementDecroissant } from './rules/test';

export interface TrackerState {
    round: number;
    activeId: string | null;
    combatants: Combatant[];
    /**
     * Combien de fois chaque capacité a déjà été subie, par combattant — la mémoire du
     * rendement décroissant (COF2) : « un bonus cumulatif de +5 au test effectué par la
     * cible pour résister à la même capacité durant un combat ».
     *
     * Indexé par identifiant de combattant puis par nom de capacité. Absent d'un état
     * enregistré avant cette version : les fonctions le traitent comme vide.
     */
    tentatives?: Record<string, Record<string, number>>;
}

/**
 * Enregistre qu'une capacité vient d'être employée sur une cible. C'est ce compte, et non
 * l'état posé, que le livre suit : deux capacités différentes qui infligent le même état
 * ne se renforcent pas l'une l'autre.
 */
export const enregistrerTentative = (state: TrackerState, cibleId: string, capacite: string): TrackerState => {
    if (!capacite) return state;
    const parCible = state.tentatives?.[cibleId] ?? {};
    return {
        ...state,
        tentatives: {
            ...(state.tentatives ?? {}),
            [cibleId]: { ...parCible, [capacite]: (parCible[capacite] ?? 0) + 1 },
        },
    };
};

/**
 * Bonus dont la cible dispose pour la PROCHAINE tentative de cette capacité, d'après ce
 * qu'elle a déjà subi.
 *
 * Le compte est celui des tentatives DÉJÀ subies : aucune n'accorde rien, une accorde +5,
 * deux accordent +10. Le décalage est facile à introduire — retrancher un de plus donnerait
 * un bonus toujours en retard d'un rang, et la deuxième tentative se jouerait sans rien.
 */
export const bonusResistance = (state: TrackerState, cibleId: string, capacite: string): number =>
    bonusRendementDecroissant(state.tentatives?.[cibleId]?.[capacite] ?? 0);

/** Ce que la cible a acquis, pour l'afficher : capacité et bonus de la prochaine résistance. */
export const resistancesAcquises = (state: TrackerState, cibleId: string): { capacite: string; bonus: number }[] =>
    Object.entries(state.tentatives?.[cibleId] ?? {})
        .map(([capacite, subies]) => ({ capacite, bonus: bonusRendementDecroissant(subies) }))
        .filter(r => r.bonus > 0)
        .sort((a, b) => b.bonus - a.bonus);

const isPlayer = (c: Combatant): boolean => c.type === 'player';
const levelOf = (c: Combatant): number => c.level ?? 0;

/**
 * Ordre d'action COF2 (chap. « Le combat », Initiative) : initiative décroissante,
 * puis départage à égalité — d'abord le plus haut niveau (NC pour une créature :
 * un NC 7 passe avant des PJ niveau 5), puis à niveau égal les PJ avant les PNJ,
 * puis un départage stable (le 1d20 stocké — « les joueurs décident »).
 * Retourne <0 si `a` agit avant `b`.
 */
export const compareCombatants = (a: Combatant, b: Combatant): number => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative; // INIT décroissante
    if (levelOf(b) !== levelOf(a)) return levelOf(b) - levelOf(a);         // plus haut niveau / NC
    if (isPlayer(a) !== isPlayer(b)) return isPlayer(a) ? -1 : 1;          // à niveau égal, PJ avant PNJ
    return b.tiebreak - a.tiebreak;                                        // départage final (1d20)
};

/** Tri par ordre d'action COF2 ; l'ordre d'insertion départage l'ultime égalité (stable). */
export const sortByInitiative = (combatants: Combatant[]): Combatant[] =>
    combatants
        .map((c, i) => ({ c, i }))
        .sort((a, b) => compareCombatants(a.c, b.c) || a.i - b.i)
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
