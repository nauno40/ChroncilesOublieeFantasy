/**
 * Voyage (COF2, partie MJ, chapitre « Règles de l'aventure »).
 *
 * « Une période de déplacement correspond à 4 h de marche. Une journée de voyage normale
 * compte deux périodes de déplacement. »
 */

/** Durée d'une période de déplacement, en heures. */
export const DUREE_PERIODE_H = 4;
/** Périodes d'une journée de voyage normale ; au-delà, c'est une marche forcée. */
export const PERIODES_PAR_JOUR = 2;

export type Monture = 'aucune' | 'bat' | 'poney' | 'cheval';

export interface OptionsDistance {
    /** Valeur de CON du personnage (COF2 : ‑2 à +5, utilisée directement). */
    con: number;
    /** DEF de l'armure portée, qui EST la pénalité d'armure (cf. malus d'encombrement). */
    defArmure?: number;
    /** « Si l'armure est dans le sac, sa pénalité est réduite de moitié. » */
    armureDansLeSac?: boolean;
    monture?: Monture;
}

/**
 * Distance parcourue par période de déplacement, en kilomètres.
 *
 * - à pied : « [12 + CON ‑ pénalité d'armure] kilomètres » ;
 * - avec un animal de bât : « (14 + CON) km », sans pénalité d'armure, celle-ci étant sur
 *   la bête ;
 * - à cheval : 18 km, à poney : 15 km — des valeurs fixes, que la CON ne modifie pas.
 *
 * L'arrondi de la demi-pénalité (armure dans le sac) n'est pas donné par le livre :
 * l'arrondi à l'inférieur est retenu, comme ailleurs dans ces règles, et il joue en faveur
 * du voyageur.
 */
export const distanceParPeriode = (options: OptionsDistance): number => {
    const { con, defArmure = 0, armureDansLeSac = false, monture = 'aucune' } = options;
    if (monture === 'cheval') return 18;
    if (monture === 'poney') return 15;
    if (monture === 'bat') return Math.max(0, 14 + con);

    const penalite = armureDansLeSac ? Math.floor(Math.max(0, defArmure) / 2) : Math.max(0, defArmure);
    return Math.max(0, 12 + con - penalite);
};

export interface OptionsTerrain {
    /** Le personnage sort des chemins et doit chercher sa route. */
    horsPiste?: boolean;
    /** Forêt dense, montagne, marais… */
    terrainDifficile?: boolean;
    /** Grand pas (rôdeur) ou Terrains difficiles (druide) annulent le terrain difficile. */
    capaciteTerrain?: boolean;
}

/**
 * Distance après application du terrain.
 *
 * « Les deux paramètres sont cumulatifs : […] la distance parcourue par période de
 * déplacement est donc divisée par 4. » Les capacités Grand pas (rôdeur, rang 3) et
 * Terrains difficiles (druide, rang 2) annulent l'effet du terrain difficile — mais pas
 * celui du hors-piste, que le livre traite séparément.
 */
export const distanceSurTerrain = (distance: number, options: OptionsTerrain = {}): number => {
    const { horsPiste = false, terrainDifficile = false, capaciteTerrain = false } = options;
    let diviseur = 1;
    if (horsPiste) diviseur *= 2;
    if (terrainDifficile && !capaciteTerrain) diviseur *= 2;
    return Math.floor(distance / diviseur);
};

/**
 * Difficulté des tests d'Équitation d'une marche forcée à cheval.
 *
 * « Un test de CON (Équitation) difficulté 10 pour éviter de perdre 1 DR et un test de CHA
 * (Équitation) de même difficulté pour faire avancer la monture. La difficulté des deux
 * tests augmente de 10 points pour chaque période supplémentaire. »
 *
 * `periodeSupplementaire` compte à partir de 1 pour la première période au-delà des deux
 * périodes d'une journée normale.
 */
export const difficulteMarcheForcee = (periodeSupplementaire: number): number =>
    10 * Math.max(1, periodeSupplementaire);

/**
 * Ce que coûte une période de marche forcée à pied.
 *
 * « Il perd 1 dé de récupération. S'il n'en a plus, il est affaibli jusqu'à ce qu'il termine
 * une récupération complète. S'il est déjà affaibli, il s'écroule sur place. »
 */
export const coutMarcheForcee = (drRestants: number, dejaAffaibli: boolean): {
    drPerdu: boolean;
    devientAffaibli: boolean;
    seffondre: boolean;
} => {
    if (drRestants > 0) return { drPerdu: true, devientAffaibli: false, seffondre: false };
    if (!dejaAffaibli) return { drPerdu: false, devientAffaibli: true, seffondre: false };
    return { drPerdu: false, devientAffaibli: false, seffondre: true };
};
