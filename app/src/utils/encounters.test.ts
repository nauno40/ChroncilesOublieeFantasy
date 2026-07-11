import { describe, it, expect } from 'vitest';
import {
    encounterBudget,
    generateEncounter,
    rosterNC,
    threatLabel,
    DIFFICULTIES,
    type GeneratorCreature,
} from './encounters';

// Pool réaliste type « Forêt » : plusieurs créatures par NC de 1 à 10.
const pool: GeneratorCreature[] = [];
for (let nc = 1; nc <= 10; nc++) {
    for (let k = 0; k < 3; k++) {
        pool.push({
            referenceId: `${nc}-${k}`, name: `Bête NC${nc}-${k}`, source: 'bestiary',
            nc, hp: nc * 8, def: 10 + nc, init: 10 + nc, per: 2, environment: 'Forêt',
        });
    }
}

const parties = [
    { size: 3, level: 3 },
    { size: 4, level: 3 },
    { size: 5, level: 5 },
    { size: 6, level: 6 },
    { size: 6, level: 10 },
];

describe('encounterBudget', () => {
    it('calibré sur la rencontre « ordinaire » COF2 (base = taille × niveau / 2)', () => {
        // Groupe de 4, niv. 3 : ordinaire (normale) = NC total ~6 (≈ 2 × niveau moyen).
        expect(encounterBudget(4, 3, 'facile')).toBe(3);
        expect(encounterBudget(4, 3, 'normale')).toBe(6);
        expect(encounterBudget(4, 3, 'difficile')).toBe(9);
        expect(encounterBudget(4, 3, 'mortelle')).toBe(12);
        // Plus de PJ / plus haut niveau → budget plus élevé.
        expect(encounterBudget(6, 3, 'normale')).toBe(9);
        expect(encounterBudget(6, 6, 'mortelle')).toBe(36);
    });
});

describe('generateEncounter', () => {
    it('respecte le filtre d’environnement', () => {
        const roster = generateEncounter({ pool, environment: 'Désert', difficulty: 'normale', partySize: 4, avgLevel: 3 });
        expect(roster).toEqual([]);
    });

    it('ne dépasse jamais le budget et le remplit bien, même pour de grands groupes', () => {
        for (const p of parties) {
            for (const diff of DIFFICULTIES) {
                const budget = encounterBudget(p.size, p.level, diff);
                let wellFilled = 0;
                for (let i = 0; i < 12; i++) {
                    const roster = generateEncounter({ pool, environment: 'Forêt', difficulty: diff, partySize: p.size, avgLevel: p.level });
                    const nc = rosterNC(roster);
                    expect(roster.length, `${p.size}PJ niv${p.level} ${diff} : roster vide`).toBeGreaterThan(0);
                    expect(nc, `${p.size}PJ niv${p.level} ${diff} : dépasse le budget`).toBeLessThanOrEqual(budget);
                    if (nc >= budget * 0.9) wellFilled++;
                }
                // Au moins 10/12 tirages remplissent ≥ 90 % du budget (mise à l'échelle correcte).
                expect(wellFilled, `${p.size}PJ niv${p.level} ${diff} : sous-rempli`).toBeGreaterThanOrEqual(10);
            }
        }
    });

    it('produit un badge de menace conforme à la difficulté demandée (groupe nombreux)', () => {
        const expected: Record<string, string> = {
            facile: 'Facile', normale: 'Équilibrée', difficile: 'Difficile', mortelle: 'Mortelle',
        };
        for (const diff of DIFFICULTIES) {
            // Sur un gros groupe (6 PJ niv 6), là où l'ancien algorithme sous-remplissait.
            const labels = new Set<string>();
            for (let i = 0; i < 8; i++) {
                const roster = generateEncounter({ pool, environment: 'Forêt', difficulty: diff, partySize: 6, avgLevel: 6 });
                labels.add(threatLabel(roster, 6, 6)?.label ?? '?');
            }
            expect(labels, `difficulté ${diff}`).toEqual(new Set([expected[diff]]));
        }
    });
});
