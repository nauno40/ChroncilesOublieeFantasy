/**
 * Les dommages (COF2, chapitre « Combat »).
 *
 * La réduction des dommages était déjà calculée sur la fiche de personnage
 * (`computeDamageReduction`), mais rien ne l'appliquait à des DM : ni résistance, ni
 * minimum d'un point, ni DM temporaires n'existaient nulle part.
 */

export interface DommagesSubis {
    /** DM effectivement retranchés des PV, jamais moins de 1 quand l'attaque touche. */
    infliges: number;
    /** Le calcul, étape par étape, pour que la table voie d'où vient le chiffre. */
    detail: string[];
}

export interface OptionsDommages {
    /** DM déjà jetés : dés de l'arme + caractéristique + bonus. */
    brut: number;
    /** Réduction des dommages de la cible. « Les RD de sources différentes se cumulent »,
     *  c'est donc un total que l'appelant a déjà additionné. */
    rd?: number;
    /** La cible résiste à ce type de DM : elle les divise par deux. */
    resistance?: boolean;
    /** DM temporaires (« non létaux »). */
    temporaire?: boolean;
    /** FOR de la cible, retranchée des DM temporaires. */
    forCible?: number;
    /** Réussite critique : les DM sont doublés (bonus inclus). */
    critique?: boolean;
}

/**
 * Applique à des DM déjà jetés tout ce que la cible leur oppose.
 *
 * **L'ordre est imposé par le livre là où il le dit** : « si une capacité vous permet de
 * diviser des DM par deux (ou plus), appliquez d'abord la RD puis divisez les DM restants
 * par deux ». Se tromper d'ordre change le résultat — 10 DM contre RD 4 donnent 3 dans le
 * bon ordre, 1 dans le mauvais.
 *
 * **Deux points que le livre ne tranche pas**, signalés comme tels :
 *  - la FOR de la cible est retranchée des DM temporaires sans que l'ordre soit précisé ;
 *    elle est traitée ici comme une réduction, donc avec la RD et avant la division ;
 *  - l'arrondi de la division n'est pas donné dans ce chapitre. L'arrondi à l'inférieur est
 *    retenu, comme le seul arrondi explicite des règles de base (« prendre son temps »).
 *
 * Le minimum d'un point est la dernière étape : « toute attaque qui touche inflige au moins
 * 1 DM », y compris après la RD et y compris pour les DM temporaires.
 */
export const dommagesSubis = (options: OptionsDommages): DommagesSubis => {
    const { brut, rd = 0, resistance = false, temporaire = false, forCible = 0, critique = false } = options;
    const detail: string[] = [];

    let dm = brut;
    detail.push(`DM ${brut}`);

    if (critique) {
        dm *= 2;
        detail.push(`critique ×2 → ${dm}`);
    }
    if (rd > 0) {
        dm -= rd;
        detail.push(`RD ${rd} → ${dm}`);
    }
    if (temporaire && forCible !== 0) {
        dm -= forCible;
        detail.push(`FOR de la cible ${forCible > 0 ? `‑${forCible}` : `+${-forCible}`} → ${dm}`);
    }
    if (resistance) {
        dm = Math.floor(dm / 2);
        detail.push(`résistance ÷2 → ${dm}`);
    }

    const infliges = Math.max(1, dm);
    if (infliges !== dm) detail.push('minimum 1 DM');

    return { infliges, detail };
};

/** DM du combat à mains nues : « 1d3 + FOR », et toujours des DM temporaires. */
export const DM_MAINS_NUES = { des: '1d3', carac: 'FOR', temporaire: true } as const;
