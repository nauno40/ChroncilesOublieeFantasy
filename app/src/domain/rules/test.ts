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

/**
 * Seuil de réussite critique en attaque (COF2, chapitre « Combat »).
 *
 * « Certains objets ou capacités augmentent de 1 point (ou plus) les chances d'obtenir un
 * critique […] Quoi qu'il en soit, la valeur minimale requise pour obtenir une réussite
 * critique ne peut jamais être inférieure à 16. »
 */
export const seuilCritique = (ameliorations = 0): number =>
    Math.max(16, 20 - Math.max(0, ameliorations));

export interface OptionsAttaque {
    /** Valeur d'attaque du personnage : niveau (plafonné à 10) + carac. Cf. `attackValue`. */
    valeurAttaque?: number;
    /** Modificateurs de situation (couvert ‑2/‑5, pénombre ‑5, capacités…). */
    modificateur?: number;
    /** DEF de la cible. Absente, le jet est rendu sans verdict. */
    defCible?: number;
    /** Points de « critique amélioré » (rapière, capacités) : abaissent le seuil, jamais sous 16. */
    critiqueAmeliore?: number;
    deBonus?: number;
    deMalus?: number;
    rng?: () => number;
}

export interface ResultatAttaque extends Omit<ResultatTest, 'echecCritique'> {
    /** Seuil de critique effectivement appliqué (20 par défaut). */
    seuilCritique: number;
    /** Vrai quand les DM doivent être doublés — critique au contact ou à distance. */
    dmDoubles: boolean;
}

/**
 * Résout un test d'attaque : d20 + valeur d'attaque contre la DEF de la cible.
 *
 * Deux différences avec le test de caractéristique, toutes deux explicites dans le livre et
 * faciles à manquer :
 *  - **il n'y a pas d'échec critique automatique en combat.** « Un résultat de 1 au d20 en
 *    combat n'est pas obligatoirement un échec critique (de notre point de vue, cela serait
 *    trop fréquent) » : un 1 qui atteint tout de même la DEF touche. Le MJ garde la main
 *    pour improviser une complication ;
 *  - **le seuil de critique est abaissable** (« critique amélioré »), sans jamais descendre
 *    sous 16.
 *
 * La réussite critique reste une réussite automatique, et double les DM (bonus inclus ; les
 * dés obtenus en bonus, eux, ne se multiplient pas — cela relève du jet de DM, pas d'ici).
 */
export const lancerAttaque = (options: OptionsAttaque = {}): ResultatAttaque => {
    const { valeurAttaque = 0, modificateur = 0, defCible, critiqueAmeliore = 0, rng } = options;

    const base = lancerTest({
        carac: valeurAttaque,
        modificateur,
        deBonus: options.deBonus,
        deMalus: options.deMalus,
        rng,
    });

    const seuil = seuilCritique(critiqueAmeliore);
    const critique = base.conserve >= seuil;

    return {
        des: base.des,
        conserve: base.conserve,
        avantage: base.avantage,
        total: base.total,
        critique,
        seuilCritique: seuil,
        dmDoubles: critique,
        reussi: defCible === undefined ? undefined : critique || base.total >= defCible,
    };
};

/**
 * Rendement décroissant (COF2, chapitres « Combat » et « Magie et sorts »).
 *
 * « Le MJ peut assigner un bonus cumulatif de +5 au test effectué par la cible pour résister
 * à la même capacité durant un combat » — la cible s'adapte à ce qu'on lui répète.
 *
 * `repetitions` est le nombre de fois que la capacité a DÉJÀ été subie pendant ce combat :
 * la première tentative n'accorde donc rien, la deuxième +5, la troisième +10.
 *
 * **Ce bonus ne s'applique qu'aux tests de RÉSISTANCE** — test opposé d'attaque magique ou
 * test de caractéristique contre un état. « L'effet de rendement décroissant ne concerne pas
 * les tests d'attaque magique contre la DEF d'un adversaire et les DM infligés » : une
 * flèche de feu répétée ne devient jamais moins efficace.
 */
export const bonusRendementDecroissant = (repetitions: number): number =>
    5 * Math.max(0, Math.floor(repetitions));

export const NOTE_RENDEMENT_DECROISSANT =
    'Ne s’applique qu’aux tests de résistance : ni aux attaques magiques contre la DEF, ni aux DM.';
