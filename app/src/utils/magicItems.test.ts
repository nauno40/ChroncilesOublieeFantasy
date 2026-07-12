import { describe, it, expect } from 'vitest';
import {
    magicItemValue,
    potionScrollValue,
    wandValue,
    resaleValue,
    rollOnTable,
    MAGIC_ITEM_TABLES,
    type MagicTable,
} from './magicItems';

describe('valeur des objets magiques (COF2)', () => {
    it('objet magique = niveau de magie² × 200 po', () => {
        expect(magicItemValue(1)).toBe(200);   // épée +1
        expect(magicItemValue(2)).toBe(800);
        expect(magicItemValue(6)).toBe(7200);   // épée +2 de feu intense (nm 6)
        expect(magicItemValue(0)).toBe(0);
    });
    it('potion / parchemin = rang du sort² × 50 pa', () => {
        expect(potionScrollValue(1)).toBe(50);
        expect(potionScrollValue(3)).toBe(450);
    });
    it('baguette = prix du parchemin × charges', () => {
        expect(wandValue(2, 5)).toBe(potionScrollValue(2) * 5);
    });
    it('revente = 50 % au maximum', () => {
        expect(resaleValue(800)).toBe(400);
    });
});

describe('rollOnTable', () => {
    const table: MagicTable = {
        name: 'Test', category: 'X', die: 6,
        entries: [[1, 3, 'A'], [4, 5, 'B'], [6, 6, 'C']],
    };
    it('mappe le jet sur le bon intervalle', () => {
        expect(rollOnTable(table, () => 0).result).toBe('A');       // roll 1
        expect(rollOnTable(table, () => 3.5 / 6).result).toBe('B'); // roll 4
        expect(rollOnTable(table, () => 0.999).result).toBe('C');   // roll 6
    });
    it('renvoie le jet dans [1, die]', () => {
        const { roll } = rollOnTable(table, () => 0.5);
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
    });
});

describe('données de tables', () => {
    it('toutes les tables sont bien formées (dé, entrées couvrant 1..die)', () => {
        expect(MAGIC_ITEM_TABLES.length).toBeGreaterThan(10);
        for (const t of MAGIC_ITEM_TABLES) {
            expect(t.die).toBeGreaterThan(0);
            expect(t.entries.length).toBeGreaterThan(0);
            // chaque valeur du dé est couverte par exactement une entrée
            for (let r = 1; r <= t.die; r++) {
                const hits = t.entries.filter(([min, max]) => r >= min && r <= max);
                expect(hits.length, `${t.name} : jet ${r}`).toBe(1);
            }
        }
    });
});
