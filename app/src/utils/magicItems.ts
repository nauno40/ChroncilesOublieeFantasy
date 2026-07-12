import { MAGIC_ITEM_TABLES, type MagicTable } from '../data/magicItemTables';

export { MAGIC_ITEM_TABLES };
export type { MagicTable };

// --- Valeur & niveau de magie (COF2, chap. « Objets magiques ») ---

// Le niveau de magie d'un objet est en général égal au bonus qu'il accorde (test, DM, DEF)
// ou au rang de la capacité qu'il reproduit. Valeur = (niveau de magie)² × 200 po.
export const magicItemValue = (magicLevel: number): number =>
    Math.max(0, Math.round(magicLevel)) ** 2 * 200;

// Une potion ou un parchemin vaut (rang du sort)² × 50 pa.
export const potionScrollValue = (spellRank: number): number =>
    Math.max(0, Math.round(spellRank)) ** 2 * 50;

// Une baguette vaut le prix d'un parchemin × le nombre de charges.
export const wandValue = (spellRank: number, charges: number): number =>
    potionScrollValue(spellRank) * Math.max(1, Math.round(charges));

// Prix de revente d'un objet magique : au maximum 50 % de sa valeur réelle.
export const resaleValue = (fullValue: number): number => Math.round(fullValue / 2);

// --- Moteur de tirage sur table ---

export interface TableRoll {
    roll: number;
    result: string;
}

// Tire un dé de la table et renvoie l'entrée dont l'intervalle [min, max] contient le jet.
// `rng` injectable pour les tests (retourne un flottant dans [0, 1)).
export const rollOnTable = (table: MagicTable, rng: () => number = Math.random): TableRoll => {
    const roll = Math.floor(rng() * table.die) + 1;
    const entry = table.entries.find(([min, max]) => roll >= min && roll <= max);
    return { roll, result: entry ? entry[2] : '—' };
};

// Regroupe les tables par catégorie, dans l'ordre d'apparition.
export const tablesByCategory = (): Record<string, MagicTable[]> => {
    const groups: Record<string, MagicTable[]> = {};
    for (const t of MAGIC_ITEM_TABLES) {
        (groups[t.category] ??= []).push(t);
    }
    return groups;
};
