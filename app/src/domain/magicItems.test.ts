import { describe, it, expect } from 'vitest';
import {
    catalogueObjetsMagiques,
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
            // Plage de jets possibles : notation `NdM` → N..N×M, sinon dé simple 1..die.
            const m = t.roll?.match(/^(\d+)d(\d+)$/);
            const [lo, hi] = m ? [Number(m[1]), Number(m[1]) * Number(m[2])] : [1, t.die];
            // chaque valeur possible est couverte par exactement une entrée
            for (let r = lo; r <= hi; r++) {
                const hits = t.entries.filter(([min, max]) => r >= min && r <= max);
                expect(hits.length, `${t.name} : jet ${r}`).toBe(1);
            }
        }
    });
});

describe('catalogueObjetsMagiques', () => {
    const catalogue = catalogueObjetsMagiques();

    it('ne retient que les tables qui se déclarent comme catalogue', () => {
        // Le point du choix « déclaration plutôt que détection » : « Origine – Peuple » et
        // « Types d'armes magiques » énumèrent des noms sans énumérer des objets. Les voir
        // arriver dans le catalogue serait le symptôme d'une détection remise en place.
        const noms = catalogue.map(o => o.nom);
        for (const intrus of ['Humains', 'Nains', 'Dragons', 'Locale', 'Bâton', 'Dague']) {
            expect(noms, `« ${intrus} » n'est pas un objet magique`).not.toContain(intrus);
        }
    });

    it('retient les objets et les propriétés nommés par les règles', () => {
        const noms = catalogue.map(o => o.nom);
        expect(noms).toContain('Anneau ou cape de protection');   // table « Armures magiques »
        expect(noms.some(n => n.startsWith('Récupération mineure'))).toBe(true); // potions de soins
        expect(noms).toContain('Affûtée');                        // propriété d'arme
    });

    it('déduit la rareté du nom de la table, seul endroit où les règles la donnent', () => {
        const rare = catalogue.find(o => o.source === 'Potions rares');
        const commun = catalogue.find(o => o.source === 'Potions communes');
        expect(rare?.rarete).toBe('Rare');
        expect(commun?.rarete).toBe('Commun');
        // Les autres tables ne disent rien de la rareté : ne rien afficher plutôt qu'inventer.
        expect(catalogue.find(o => o.source === 'Armures magiques')?.rarete).toBeUndefined();
    });

    it('distingue un objet d’une propriété', () => {
        expect(catalogue.find(o => o.nom === 'Anneau ou cape de protection')?.nature).toBe('objet');
        expect(catalogue.find(o => o.nom === 'Affûtée')?.nature).toBe('propriete');
    });

    it('ne répète pas un nom présent dans deux tables, et écarte les instructions de tirage', () => {
        const noms = catalogue.map(o => o.nom);
        expect(new Set(noms).size).toBe(noms.length);
        expect(noms.some(n => /^relancer/i.test(n))).toBe(false);
    });

    it('laisse les tables du générateur intactes', () => {
        // Le générateur reste la page des outils du MJ : le catalogue ne doit rien lui retirer.
        expect(MAGIC_ITEM_TABLES.length).toBeGreaterThan(15);
        expect(MAGIC_ITEM_TABLES.some(t => t.name === 'Origine – Provenance')).toBe(true);
    });
});
