/**
 * Malus aux attaques à distance (COF2, chapitre « Combat »).
 *
 * Ce sont les modificateurs les plus souvent oubliés à la table : ils dépendent de la
 * situation, pas de la feuille de personnage, et rien dans l'application ne les rappelait.
 *
 * Le tableau du livre mêle trois natures de malus, que ce module garde distinctes plutôt
 * que de les aplatir en un seul nombre :
 *  - un **modificateur chiffré** (‑2, ‑5) ;
 *  - un **dé malus** (longue portée, tireur au contact) ;
 *  - un cas **« Spécial »** (brouillard dense, noir total) que le livre décrit par un renvoi
 *    à une autre règle. Ceux-là ne produisent AUCUN chiffre automatique : les afficher avec
 *    un modificateur inventé serait pire que de ne rien proposer.
 */
export interface ConditionTir {
    id: string;
    label: string;
    groupe: 'Portée' | 'Cible' | 'Tireur' | 'Visibilité';
    /** Modificateur chiffré au test d'attaque. */
    modificateur?: number;
    /** La condition impose un dé malus. */
    deMalus?: boolean;
    /** Ce que le livre dit quand il écrit « Spécial », ou une précision utile. */
    note?: string;
}

export const CONDITIONS_TIR: ConditionTir[] = [
    { id: 'longue-portee', label: 'Longue portée', groupe: 'Portée', deMalus: true, note: 'Entre la portée de l’arme et le double de cette valeur.' },
    { id: 'couvert-faible', label: 'Cible à couvert — faiblement', groupe: 'Cible', modificateur: -2, note: 'Végétation.' },
    { id: 'couvert-fort', label: 'Cible à couvert — fortement', groupe: 'Cible', modificateur: -5, note: 'Muraille.' },
    // Le livre note « ‑2 (‑5) » : deux situations distinctes plutôt qu'une valeur ambiguë.
    { id: 'melee', label: 'Cible en pleine mêlée', groupe: 'Cible', modificateur: -2 },
    { id: 'melee-masquee', label: 'Cible masquée par un allié', groupe: 'Cible', modificateur: -5 },
    { id: 'tireur-contact', label: 'Tireur au contact', groupe: 'Tireur', deMalus: true, note: 'Arme de tir utilisée au contact d’un adversaire.' },
    { id: 'penombre', label: 'Pénombre', groupe: 'Visibilité', modificateur: -5 },
    { id: 'brouillard-leger', label: 'Brouillard léger', groupe: 'Visibilité', modificateur: -5 },
    { id: 'brouillard-dense', label: 'Brouillard dense', groupe: 'Visibilité', note: 'Spécial : comme un brouillard léger dans un rayon de 10 m, puis comme le noir total.' },
    { id: 'noir-total', label: 'Noir total', groupe: 'Visibilité', note: 'Spécial : le tireur subit l’état Aveuglé, sauf capacité contraire.' },
];

export interface MalusTir {
    /** Somme des modificateurs chiffrés (négative ou nulle). */
    modificateur: number;
    /** Un seul dé malus, quel que soit le nombre de conditions qui en imposent. */
    deMalus: boolean;
    /** Les cas « Spécial » retenus, à arbitrer par le MJ. */
    notes: string[];
}

/**
 * Agrège les conditions cochées.
 *
 * Le dé malus ne se cumule pas : « il n'est pas possible de cumuler plusieurs dés bonus ou
 * malus » (chapitre « Les règles de base »). Les modificateurs chiffrés, eux, s'additionnent
 * — le livre ne l'écrit pas noir sur blanc pour ce tableau, c'est la lecture ordinaire de
 * modificateurs de situation, et le MJ garde la main sur le champ de modificateur.
 */
export const malusTir = (ids: string[]): MalusTir => {
    const retenues = CONDITIONS_TIR.filter(c => ids.includes(c.id));
    return {
        modificateur: retenues.reduce((total, c) => total + (c.modificateur ?? 0), 0),
        deMalus: retenues.some(c => c.deMalus === true),
        notes: retenues.filter(c => c.modificateur === undefined && !c.deMalus && c.note).map(c => `${c.label} — ${c.note}`),
    };
};
