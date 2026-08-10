import { describe, expect, it } from 'vitest';
import {
    dommagesChute, difficulteSaut, difficulteSuffocation, difficulteChaleur, difficulteFroid,
} from './dangers';

describe('dommagesChute', () => {
    it('compte un dé par tranche de 3 m', () => {
        expect(dommagesChute(3, 1).des).toBe(1);
        expect(dommagesChute(12, 1).des).toBe(4);
        // Une tranche entamée ne compte pas : 8 m font deux tranches pleines.
        expect(dommagesChute(8, 1).des).toBe(2);
    });

    it('ne fait aucun dé sous trois mètres', () => {
        expect(dommagesChute(2, 1).des).toBe(0);
        expect(dommagesChute(0, 1).des).toBe(0);
    });

    it('plafonne à dix dés, soit 30 m', () => {
        expect(dommagesChute(30, 1)).toMatchObject({ des: 10, plafonne: false });
        expect(dommagesChute(60, 1)).toMatchObject({ des: 10, plafonne: true });
    });

    it('ignore les trois premiers mètres sur un test d’AGI réussi', () => {
        // « Ignorer les trois premiers mètres » retire la hauteur AVANT le découpage :
        // 12 m amortis valent 9 m, soit trois dés, et non « quatre dés moins un ».
        expect(dommagesChute(12, 1, true).des).toBe(3);
        expect(dommagesChute(5, 1, true).des).toBe(0);
    });

    it('utilise le dé évolutif du personnage, et non un d4 fixe', () => {
        expect(dommagesChute(6, 1).de).toBe('d4');
        expect(dommagesChute(6, 6).de).toBe('d6');
        expect(dommagesChute(6, 15).de).toBe('d12');
    });
});

describe('difficulteSaut', () => {
    it('vaut 3 × la distance avec élan, 6 × sans', () => {
        expect(difficulteSaut(4, true)).toBe(12);
        expect(difficulteSaut(4, false)).toBe(24);
        expect(difficulteSaut(2.5, true)).toBe(8);
    });

    it('ne rend jamais de difficulté négative', () => {
        expect(difficulteSaut(-3, true)).toBe(0);
    });
});

describe('difficulteSuffocation', () => {
    it('suit [5 + 2 par round], le premier round comptant pour un', () => {
        expect(difficulteSuffocation(1)).toBe(7);
        expect(difficulteSuffocation(3)).toBe(11);
        expect(difficulteSuffocation(0)).toBe(7);
    });
});

describe('chaleur et froid', () => {
    it('n’impose un test de chaleur qu’au-delà de 40 °C', () => {
        expect(difficulteChaleur(38)).toBeNull();
        expect(difficulteChaleur(40)).toBeNull();
        // « La difficulté est égale à la température ‑ 30 » : 41 °C ⇒ 11.
        expect(difficulteChaleur(41)).toBe(11);
        expect(difficulteChaleur(50)).toBe(20);
    });

    it('n’impose un test de froid qu’en dessous de 0 °C', () => {
        expect(difficulteFroid(0)).toBeNull();
        expect(difficulteFroid(5)).toBeNull();
        // Exemple du livre : difficulté 15 pour ‑15 °C.
        expect(difficulteFroid(-15)).toBe(15);
    });

    it('allège le test avec des vêtements chauds, sans passer sous zéro', () => {
        expect(difficulteFroid(-15, 5)).toBe(10);
        expect(difficulteFroid(-15, 10)).toBe(5);
        expect(difficulteFroid(-3, 10)).toBe(0);
    });
});
