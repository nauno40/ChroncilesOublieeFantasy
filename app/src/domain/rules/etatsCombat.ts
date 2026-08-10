import type { HarmfulState } from '../../types/normalized';

/**
 * Ce que les états préjudiciables d'un combattant lui coûtent, tous cumulés (COF2).
 *
 * Chaque état était déjà décrit et affiché, mais jamais AGRÉGÉ : le suivi de combat montrait
 * la DEF de base d'un combattant Aveuglé et Renversé, qui devrait pourtant être à ‑10. Le MJ
 * devait faire la somme de tête, à chaque attaque.
 */
export interface EffetsCumules {
    /** Modificateurs chiffrés, négatifs le plus souvent. */
    def: number;
    attaque: number;
    init: number;
    /** Un dé malus sur TOUS les tests (Affaibli). */
    deMalusTests: boolean;
    /** Un dé malus sur les seuls tests d'attaque (Immobilisé). */
    deMalusAttaque: boolean;
    /** Le combattant ne peut pas agir (Étourdi, Paralysé, Surpris). */
    sansAction: boolean;
    /** Le combattant ne peut pas se déplacer (Immobilisé). */
    sansDeplacement: boolean;
    /** Déplacement plafonné, en mètres (Essoufflé, Invalide) — le plus contraignant gagne. */
    deplacementMax?: number;
    /** Ce qu'aucun chiffre ne porte, dans les mots du compendium. */
    notes: string[];
}

/** Cibles de bonus que ce cumul sait porter ; les autres restent au calcul de la fiche. */
const CIBLES = { def: 'def', attaque: 'attaque', init: 'init' } as const;

/**
 * Agrège les états portés par un combattant.
 *
 * **Les modificateurs chiffrés s'additionnent** — Aveuglé (‑5 DEF) et Renversé (‑5 DEF)
 * donnent bien ‑10 : ce sont deux pénalités distinctes, rien dans les règles ne les fait se
 * chevaucher.
 *
 * **Le dé malus, lui, ne se cumule pas** : « il n'est pas possible de cumuler plusieurs dés
 * bonus ou malus » (chapitre « Les règles de base »). Deux états qui en imposent un n'en
 * donnent qu'un — d'où des booléens plutôt qu'un compteur.
 *
 * Un état inconnu du compendium est ignoré silencieusement : le suivi de combat accepte des
 * états saisis à la main, et refuser d'afficher le reste serait pire.
 */
export const effetsCumules = (noms: string[], definitions: HarmfulState[]): EffetsCumules => {
    const cumul: EffetsCumules = {
        def: 0, attaque: 0, init: 0,
        deMalusTests: false, deMalusAttaque: false,
        sansAction: false, sansDeplacement: false,
        notes: [],
    };

    for (const nom of noms) {
        const etat = definitions.find(d => d.name === nom);
        const effets = etat?.effects;
        if (!effets) continue;

        for (const bonus of effets.bonuses ?? []) {
            if (bonus.target === CIBLES.def) cumul.def += bonus.value;
            else if (bonus.target === CIBLES.attaque) cumul.attaque += bonus.value;
            else if (bonus.target === CIBLES.init) cumul.init += bonus.value;
        }
        if (effets.malusDie === 'all') cumul.deMalusTests = true;
        if (effets.malusDie === 'attack') cumul.deMalusAttaque = true;
        if (effets.noAction) cumul.sansAction = true;
        if (effets.noMove) cumul.sansDeplacement = true;
        if (effets.moveLimit !== undefined) {
            cumul.deplacementMax = cumul.deplacementMax === undefined
                ? effets.moveLimit
                : Math.min(cumul.deplacementMax, effets.moveLimit);
        }
        if (effets.note) cumul.notes.push(`${nom} — ${effets.note}`);
    }

    // Un dé malus sur tous les tests couvre déjà les tests d'attaque : ne pas l'annoncer
    // deux fois, sous peine de laisser croire à un cumul que les règles interdisent.
    if (cumul.deMalusTests) cumul.deMalusAttaque = false;

    return cumul;
};

/** DEF effective d'un combattant : sa DEF de base, modifiée par ses états. */
export const defEffective = (defBase: number, effets: EffetsCumules): number => defBase + effets.def;
