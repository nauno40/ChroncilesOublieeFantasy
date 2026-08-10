import { lancerTest } from './test';

/**
 * Poisons (COF2, partie MJ, chapitre « Règles de l'aventure »).
 *
 * Les types de poison et leurs effets sont au compendium depuis longtemps ; ce qui manquait,
 * ce sont les deux règles qui les mettent en jeu — enduire une arme, et résister.
 */

/** « Enduire une arme de poison nécessite un test d'INT difficulté 10. » */
export const DIF_ENDUIRE_ARME = 10;

/**
 * « Lorsqu'une personne est mise en contact […] elle doit effectuer un test de CON
 * difficulté 10 (cette difficulté peut être modifiée selon la virulence du poison). »
 */
export const DIF_RESISTER_POISON = 10;

/** « Les composants actifs se dégradent en 1d6 minutes » sur une créature morte. */
export const DELAI_DEGRADATION = '1d6 minutes';

/**
 * « Seule la première attaque réussie avec une arme enduite de poison permet d'appliquer
 * les effets du poison à la victime. »
 */
export const NOTE_PREMIERE_ATTAQUE =
    'Seule la première attaque réussie applique le poison ; la dose est ensuite consommée.';

export type IssueEnduire = 'applique' | 'dose-gaspillee' | 'auto-empoisonnement';

export interface ResultatEnduire {
    issue: IssueEnduire;
    /** Le d20 conservé, pour que la table voie d'où vient le verdict. */
    de: number;
    total: number;
}

/**
 * Enduire une arme de poison : test d'INT difficulté 10.
 *
 * Trois issues, et non deux : « en cas d'échec, la dose est gaspillée. Un **échec critique**
 * sur ce test signifie que le personnage s'empoisonne lui-même. » Confondre les deux ferait
 * perdre le seul cas où le poison se retourne contre son porteur.
 */
export const enduireArme = (intelligence: number, rng?: () => number): ResultatEnduire => {
    const jet = lancerTest({ carac: intelligence, difficulte: DIF_ENDUIRE_ARME, rng });
    const issue: IssueEnduire = jet.echecCritique ? 'auto-empoisonnement'
        : jet.reussi ? 'applique'
            : 'dose-gaspillee';
    return { issue, de: jet.conserve, total: jet.total };
};

/**
 * Résister à un poison : test de CON contre la virulence.
 *
 * `difficulte` vaut 10 par défaut, « cette difficulté peut être modifiée selon la virulence
 * du poison » — c'est au MJ de la fixer, pas à ce module de la deviner.
 *
 * La réussite n'annule pas toujours l'effet : la table du compendium porte une colonne
 * « Effet — Réussite » (un poison rapide inflige encore 1d4° DM). Cette fonction rend donc
 * le verdict du test, pas l'effet — celui-ci se lit sur le poison.
 */
export const resisterAuPoison = (constitution: number, difficulte = DIF_RESISTER_POISON, rng?: () => number) =>
    lancerTest({ carac: constitution, difficulte, rng });
