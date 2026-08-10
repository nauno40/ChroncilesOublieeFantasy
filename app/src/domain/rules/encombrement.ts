import type { Protection } from './types';

/**
 * Malus d'encombrement d'une armure (COF2, chapitre « Équipement »).
 *
 * « Les armures infligent des malus d'encombrement aux tests d'AGI : ajoutez la valeur de
 * DEF de l'armure à la difficulté de tous les tests d'AGI effectués par le personnage. Pour
 * certains tests de survie (CON), vous pouvez aussi imposer ce malus. »
 *
 * Le malus n'était calculé nulle part : seul le plafond d'AGI de l'armure (`agiMax`) était
 * appliqué, à la DEF. Un personnage en cotte de mailles voyait donc sa DEF juste, sans rien
 * savoir des +5 de difficulté que son armure lui coûtait sur chaque test d'AGI.
 *
 * **Le bouclier est exclu** : la règle parle de la DEF de l'armure, pas de la protection
 * totale. Un grand bouclier n'alourdit pas les tests d'AGI.
 *
 * **Limite connue et assumée :** « si vous avez une armure magique, non seulement le bonus
 * de magie n'augmente pas le malus d'encombrement, mais en plus il le réduit (minimum 0) ».
 * Le modèle ne distingue pas, dans la DEF d'une armure portée, la part de base de la part
 * magique — il n'y a donc rien à soustraire ici sans l'inventer. Une armure enchantée
 * affichera un malus trop élevé tant que cette distinction n'existe pas.
 */
export const malusEncombrement = (protection: Protection | undefined): number =>
    Math.max(0, protection?.armor?.def ?? 0);

/**
 * AGI effective sous l'armure (COF2) : l'armure plafonne la valeur d'AGI du personnage.
 *
 * *« Un personnage avec une AGI de +3 peut porter jusqu'à la cotte de mailles sans subir de
 * limitation, mais toute armure plus encombrante réduit la valeur de son AGI. »*
 *
 * Le calcul existait déjà, en ligne dans le calcul de la DEF. Il est nommé ici pour être
 * affichable : c'est une valeur que le joueur doit connaître, pas seulement une étape.
 */
export const agiEffective = (agi: number, agiMax: number | null | undefined): number =>
    agiMax != null ? Math.min(agi, agiMax) : agi;
