import type { ActiveState } from '../../types/character';
import type { HarmfulState, HarmfulStateEffects } from '../../types/normalized';
import { activateState } from './mechanics';

// --- États préjudiciables du compendium → lignes d'état de la fiche (COF2, § États préjudiciables) ---
//
// La fiche portait des états entièrement saisis à la main : le joueur retapait un nom, une
// cible et une valeur que le compendium connaît déjà. Ces fonctions font le pont, sans
// jamais inventer : un état sans mécanique structurée ne produit aucune ligne de bonus,
// et ce qu'on ne sait pas exprimer reste en toutes lettres (cf. `resumeEtat`).

/** Lignes d'état prêtes pour la fiche, dérivées d'un état du compendium. Une ligne par
 *  cible touchée — le modèle d'état de la fiche ne porte qu'un couple cible/valeur.
 *  Un état sans `bonuses` (Ralenti, Essoufflé…) renvoie une liste vide : il n'a rien à
 *  appliquer au calcul, seulement à rappeler au joueur. */
export const etatEnLignes = (etat: HarmfulState): ActiveState[] =>
    (etat.effects?.bonuses ?? []).map(bonus => ({
        name: etat.name,
        // PAS de `group` : un groupe est un groupe d'EXCLUSION (une posture à la fois), et
        // les deux lignes d'un même état se seraient chassées l'une l'autre. Ce sont leurs
        // noms identiques qui les lient — cf. `basculerEtatNomme`.
        active: false,
        target: bonus.target,
        value: bonus.value,
    }));

/** Vrai si l'état porte au moins une pénalité chiffrée que la fiche sait appliquer. */
export const etatEstChiffre = (etat: HarmfulState): boolean =>
    (etat.effects?.bonuses?.length ?? 0) > 0;

/**
 * Rappel en toutes lettres de ce que l'état impose et que les bonus ne portent pas :
 * dé malus, action interdite, déplacement bloqué ou plafonné, et la note du compendium.
 * Renvoie `undefined` quand il n'y a rien à ajouter — une chaîne vide s'afficherait.
 */
export const resumeEtat = (effects: HarmfulStateEffects | undefined): string | undefined => {
    if (!effects) return undefined;
    const morceaux: string[] = [];
    if (effects.malusDie === 'all') morceaux.push('dé malus à tous les tests');
    if (effects.malusDie === 'attack') morceaux.push("dé malus aux tests d'attaque");
    if (effects.noAction) morceaux.push('aucune action possible');
    if (effects.noMove) morceaux.push('pas de déplacement');
    if (effects.moveLimit !== undefined) morceaux.push(`déplacement limité à ${effects.moveLimit} m`);
    if (effects.note) morceaux.push(effects.note);
    return morceaux.length > 0 ? morceaux.join(' · ') : undefined;
};

/**
 * (Dés)active une ligne d'état ET toutes celles qui portent le même nom : un état du
 * compendium occupe une ligne par cible touchée (Renversé : attaque et DEF), et n'en
 * appliquer que la moitié serait pire que de ne rien appliquer.
 *
 * Délègue à `activateState` ligne par ligne, donc l'exclusion de groupe des postures
 * continue de jouer exactement comme avant. Un état sans nom ne bascule que lui-même.
 */
export const basculerEtatNomme = (
    states: ActiveState[] | undefined,
    idx: number,
    active: boolean,
): ActiveState[] => {
    const liste = states ?? [];
    const nom = liste[idx]?.name;
    const indices = nom
        ? liste.map((s, i) => (s.name === nom ? i : -1)).filter(i => i >= 0)
        : [idx];
    return indices.reduce((acc, i) => activateState(acc, i, active), liste);
};
