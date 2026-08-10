import { evolutiveDie } from './effects';

/**
 * Dangers et obstacles (COF2, partie MJ, chapitre « Règles de l'aventure »).
 *
 * Ce sont des calculs que le MJ refait de tête en pleine partie — combien de dés pour une
 * chute de 12 m, quelle difficulté pour un froid de ‑15 °C — et que rien dans l'application
 * ne rappelait.
 */

/** Nombre de dés d'une chute, et le dé lui-même (le dé évolutif du personnage). */
export interface DommagesChute {
    /** Nombre de dés jetés. Zéro sous trois mètres. */
    des: number;
    /** Le dé évolutif, qui dépend du niveau : « 1d4° » vaut d6 au niveau 6. */
    de: string;
    /** Vrai quand le plafond du livre est atteint. */
    plafonne: boolean;
}

/**
 * DM d'une chute : « 1d4° par tranche de 3 m de chute pour un maximum de 10d4° (30 m). Un
 * test d'AGI difficulté 10 permet d'ignorer les trois premiers mètres de chute. »
 *
 * `agiReussie` retire trois mètres AVANT le découpage en tranches — c'est ce que veut dire
 * « ignorer les trois premiers mètres », et non retirer un dé au résultat.
 */
export const dommagesChute = (hauteurM: number, niveau: number, agiReussie = false): DommagesChute => {
    const effective = Math.max(0, hauteurM - (agiReussie ? 3 : 0));
    const brut = Math.floor(effective / 3);
    return { des: Math.min(10, brut), de: evolutiveDie(niveau), plafonne: brut > 10 };
};

/** Difficulté du test d'AGI qui permet d'ignorer les trois premiers mètres. */
export const DIF_AMORTIR_CHUTE = 10;

/**
 * Difficulté d'un saut en longueur : « 3 × la distance » avec élan, « 6 × la distance »
 * sans élan.
 *
 * Le livre ajoute « l'élan devant être au moins le double du saut » sur la ligne du saut
 * SANS élan, ce qui se contredit. La condition n'est donc pas codée : elle est rappelée
 * telle quelle par `NOTE_ELAN`, à l'arbitrage du MJ.
 */
export const difficulteSaut = (distanceM: number, avecElan: boolean): number =>
    Math.max(0, Math.round(distanceM * (avecElan ? 3 : 6)));

export const NOTE_ELAN = 'Le livre précise « l’élan devant être au moins le double du saut » — à arbitrer.';

/** DM du feu : « prendre feu ou traverser un incendie inflige 1d6 DM par round ». */
export const DM_FEU_PAR_ROUND = '1d6';

/**
 * Incendie : « il faut réussir un test de CON difficulté [5 + 2 par round] chaque round
 * pour ne pas suffoquer et perdre connaissance ». Le premier round compte pour un.
 */
export const difficulteSuffocation = (round: number): number => 5 + 2 * Math.max(1, round);

/**
 * Difficulté du test de CON contre la chaleur : « lorsque la température ambiante excède
 * les 40 °C, un test de CON difficulté 10 s'impose par tranche de 6 h […] la difficulté est
 * égale à la température ‑ 30 ». En dessous de 40 °C, aucun test.
 */
export const difficulteChaleur = (temperatureC: number): number | null =>
    temperatureC > 40 ? temperatureC - 30 : null;

/**
 * Difficulté du test de CON contre le froid : « en dessous de 0 °C, si le PJ ne porte pas de
 * vêtements adaptés, il doit réussir un test de CON dont la difficulté est égale à la
 * température négative » — difficulté 15 pour ‑15 °C.
 *
 * `bonusVetements` : « des vêtements chauds peuvent apporter un bonus de +5 à +10 au test »,
 * qui allège le test et non la difficulté ; il est donc retranché ici pour donner la
 * difficulté effective, à charge du MJ de choisir sa valeur.
 */
export const difficulteFroid = (temperatureC: number, bonusVetements = 0): number | null =>
    temperatureC < 0 ? Math.max(0, Math.abs(temperatureC) - Math.max(0, bonusVetements)) : null;

/** DM subis en cas d'échec à un test de chaleur ou de froid : 1d4° par tranche de 6 h. */
export const DM_TEMPERATURE = '1d4°';
