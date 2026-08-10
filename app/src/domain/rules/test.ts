/**
 * Le test COF2 (chapitre « Les règles de base »).
 *
 * « d20 + Carac. + modificateur. Si le résultat est supérieur ou égal à la difficulté,
 * l'action réussit. »
 *
 * Le lanceur de dés de l'application ne savait faire que des `xdy+z` : ni dé bonus, ni dé
 * malus, ni difficulté — alors même que les états préjudiciables **déclarent** un dé malus
 * (`HarmfulStateEffects.malusDie`) qui n'était jusqu'ici qu'affiché en toutes lettres,
 * jamais appliqué à un jet.
 */

/** Table des difficultés du livre. L'ordre est celui de la table, du plus facile au pire. */
export const DIFFICULTES: { label: string; valeur: number }[] = [
    { label: 'Facile', valeur: 5 },
    { label: 'Moyenne', valeur: 10 },
    { label: 'Difficile', valeur: 15 },
    { label: 'Très difficile', valeur: 20 },
    { label: 'Extrême', valeur: 25 },
    { label: 'Abominable', valeur: 30 },
];

export interface OptionsTest {
    /** Valeur de la caractéristique concernée (COF2 : ‑2 à +5, utilisée directement). */
    carac?: number;
    /** Tout ce que le MJ ou une capacité ajoute au résultat. */
    modificateur?: number;
    /** Nombre de dés bonus accordés par la situation ou des capacités. */
    deBonus?: number;
    /** Nombre de dés malus subis (état préjudiciable, arme non maîtrisée…). */
    deMalus?: number;
    /** Difficulté visée. Absente, le jet est rendu sans verdict. */
    difficulte?: number;
    /** Source d'aléa, injectée pour les tests. */
    rng?: () => number;
}

export interface ResultatTest {
    /** Les d20 réellement lancés, dans l'ordre. */
    des: number[];
    /** Le d20 conservé après application du dé bonus ou malus. */
    conserve: number;
    /** `bonus`, `malus`, ou `aucun` quand rien ne s'applique — ou que tout s'annule. */
    avantage: 'bonus' | 'malus' | 'aucun';
    total: number;
    critique: boolean;
    echecCritique: boolean;
    /** Vrai/faux face à la difficulté ; `undefined` si aucune difficulté n'est visée. */
    reussi?: boolean;
}

/**
 * Résout un test.
 *
 * Les deux règles de cumul du livre sont appliquées ici et nulle part ailleurs :
 * « il n'est pas possible de cumuler plusieurs dés bonus ou malus » (un seul de chaque
 * compte) et « le dé malus et le dé bonus s'annulent ». Un personnage avec deux dés bonus
 * et un dé malus lance donc un seul d20.
 *
 * Le critique se lit sur le **dé conservé**, celui dont le livre dit « obtenir un résultat
 * de 20 sur le d20 » : avec un dé malus, un 20 écarté au profit d'un 4 n'est pas un
 * critique. Une réussite critique réussit automatiquement, un échec critique échoue
 * automatiquement — quel que soit le total.
 */
export const lancerTest = (options: OptionsTest = {}): ResultatTest => {
    const { carac = 0, modificateur = 0, difficulte, rng = Math.random } = options;

    const bonus = Math.max(0, options.deBonus ?? 0) > 0;
    const malus = Math.max(0, options.deMalus ?? 0) > 0;
    const avantage: ResultatTest['avantage'] = bonus === malus ? 'aucun' : bonus ? 'bonus' : 'malus';

    const d20 = () => Math.floor(rng() * 20) + 1;
    const des = avantage === 'aucun' ? [d20()] : [d20(), d20()];
    const conserve = avantage === 'bonus' ? Math.max(...des)
        : avantage === 'malus' ? Math.min(...des)
            : des[0];

    const total = conserve + carac + modificateur;
    const critique = conserve === 20;
    const echecCritique = conserve === 1;

    return {
        des,
        conserve,
        avantage,
        total,
        critique,
        echecCritique,
        reussi: difficulte === undefined ? undefined
            : critique ? true
                : echecCritique ? false
                    : total >= difficulte,
    };
};

/** Qualificatif d'une difficulté chiffrée, quand elle figure dans la table du livre. */
export const qualificatifDifficulte = (valeur: number): string | undefined =>
    DIFFICULTES.find(d => d.valeur === valeur)?.label;
