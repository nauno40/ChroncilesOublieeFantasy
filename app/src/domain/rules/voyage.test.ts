import { describe, expect, it } from 'vitest';
import {
    distanceParPeriode, distanceSurTerrain, difficulteMarcheForcee, coutMarcheForcee,
    PERIODES_PAR_JOUR, DUREE_PERIODE_H,
} from './voyage';

describe('distanceParPeriode', () => {
    it('suit [12 + CON ‑ pénalité d’armure] à pied', () => {
        expect(distanceParPeriode({ con: 2 })).toBe(14);
        expect(distanceParPeriode({ con: 2, defArmure: 5 })).toBe(9);
        expect(distanceParPeriode({ con: -1, defArmure: 2 })).toBe(9);
    });

    it('réduit de moitié la pénalité quand l’armure est dans le sac', () => {
        expect(distanceParPeriode({ con: 2, defArmure: 4, armureDansLeSac: true })).toBe(12);
        // Arrondi à l'inférieur : une pénalité de 5 en vaut 2 dans le sac.
        expect(distanceParPeriode({ con: 2, defArmure: 5, armureDansLeSac: true })).toBe(12);
    });

    it('donne (14 + CON) avec un animal de bât, sans pénalité d’armure', () => {
        // « Une mule ou un âne peut porter tout le barda du personnage (armure comprise). »
        expect(distanceParPeriode({ con: 2, defArmure: 6, monture: 'bat' })).toBe(16);
    });

    it('donne des valeurs fixes à cheval et à poney, que la CON ne change pas', () => {
        expect(distanceParPeriode({ con: 2, monture: 'cheval' })).toBe(18);
        expect(distanceParPeriode({ con: -2, monture: 'cheval' })).toBe(18);
        expect(distanceParPeriode({ con: 4, monture: 'poney' })).toBe(15);
    });

    it('ne rend jamais de distance négative', () => {
        expect(distanceParPeriode({ con: -2, defArmure: 20 })).toBe(0);
    });
});

describe('distanceSurTerrain', () => {
    it('divise par deux hors piste, par deux en terrain difficile', () => {
        expect(distanceSurTerrain(16, { horsPiste: true })).toBe(8);
        expect(distanceSurTerrain(16, { terrainDifficile: true })).toBe(8);
    });

    it('cumule les deux : divisé par quatre', () => {
        expect(distanceSurTerrain(16, { horsPiste: true, terrainDifficile: true })).toBe(4);
    });

    it('annule le terrain difficile avec Grand pas ou Terrains difficiles, mais pas le hors-piste', () => {
        expect(distanceSurTerrain(16, { terrainDifficile: true, capaciteTerrain: true })).toBe(16);
        // Le livre traite le hors-piste séparément : la capacité ne l'annule pas.
        expect(distanceSurTerrain(16, { horsPiste: true, terrainDifficile: true, capaciteTerrain: true })).toBe(8);
    });

    it('laisse la distance intacte sur un chemin dégagé', () => {
        expect(distanceSurTerrain(14)).toBe(14);
    });
});

describe('marche forcée', () => {
    it('augmente la difficulté de 10 par période supplémentaire', () => {
        expect(difficulteMarcheForcee(1)).toBe(10);
        expect(difficulteMarcheForcee(2)).toBe(20);
        expect(difficulteMarcheForcee(3)).toBe(30);
    });

    it('coûte un dé de récupération tant qu’il en reste', () => {
        expect(coutMarcheForcee(2, false)).toMatchObject({ drPerdu: true, devientAffaibli: false, seffondre: false });
    });

    it('affaiblit le personnage à court de dés', () => {
        expect(coutMarcheForcee(0, false)).toMatchObject({ drPerdu: false, devientAffaibli: true, seffondre: false });
    });

    it('fait s’écrouler celui qui est déjà affaibli', () => {
        expect(coutMarcheForcee(0, true)).toMatchObject({ drPerdu: false, devientAffaibli: false, seffondre: true });
    });
});

describe('rythme de voyage', () => {
    it('compte quatre heures par période et deux périodes par jour', () => {
        expect(DUREE_PERIODE_H).toBe(4);
        expect(PERIODES_PAR_JOUR).toBe(2);
    });
});
