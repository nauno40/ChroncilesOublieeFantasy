import { describe, expect, it } from 'vitest';
import { malusEncombrement, agiEffective } from './encombrement';

describe('malusEncombrement', () => {
    it('vaut la DEF de l’armure portée (table du chapitre Équipement)', () => {
        // Cotte de mailles : DEF +5 ⇒ +5 à la difficulté de tous les tests d'AGI.
        expect(malusEncombrement({ armor: { def: 5 } })).toBe(5);
        expect(malusEncombrement({ armor: { def: 2 } })).toBe(2);
    });

    it('ignore le bouclier : la règle parle de l’armure, pas de la protection totale', () => {
        expect(malusEncombrement({ armor: { def: 4 }, shield: { def: 2 } })).toBe(4);
        expect(malusEncombrement({ shield: { def: 2 } })).toBe(0);
    });

    it('vaut zéro sans armure', () => {
        expect(malusEncombrement(undefined)).toBe(0);
        expect(malusEncombrement({})).toBe(0);
        expect(malusEncombrement({ armor: {} })).toBe(0);
    });
});

describe('agiEffective', () => {
    it('plafonne l’AGI à la valeur permise par l’armure', () => {
        // Exemple du livre : AGI +3 en armure de plaque (AGI max +2) ⇒ AGI ramenée à +2.
        expect(agiEffective(3, 2)).toBe(2);
    });

    it('ne touche pas une AGI déjà sous le plafond', () => {
        // Même exemple : AGI +3 en cotte de mailles (AGI max +3) ⇒ inchangée.
        expect(agiEffective(3, 3)).toBe(3);
        expect(agiEffective(1, 3)).toBe(1);
    });

    it('laisse l’AGI intacte sans plafond — un bouclier n’en impose pas', () => {
        expect(agiEffective(4, null)).toBe(4);
        expect(agiEffective(4, undefined)).toBe(4);
    });

    it('n’améliore jamais une AGI négative', () => {
        expect(agiEffective(-1, 5)).toBe(-1);
    });
});
