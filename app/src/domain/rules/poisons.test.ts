import { describe, expect, it } from 'vitest';
import { enduireArme, resisterAuPoison, DIF_ENDUIRE_ARME, DIF_RESISTER_POISON } from './poisons';

/** Dés déterministes : rend les faces demandées, dans l'ordre. */
const des = (...faces: number[]) => {
    let i = 0;
    return () => (faces[i++] - 1) / 20 + 0.001;
};

describe('enduireArme', () => {
    it('applique le poison quand le test d’INT atteint 10', () => {
        expect(enduireArme(2, des(8)).issue).toBe('applique');
        expect(enduireArme(0, des(10)).issue).toBe('applique');
    });

    it('gaspille la dose sur un échec ordinaire', () => {
        expect(enduireArme(1, des(5)).issue).toBe('dose-gaspillee');
    });

    it('empoisonne le personnage sur un ÉCHEC CRITIQUE, et pas sur un simple échec', () => {
        // « Un échec critique sur ce test signifie que le personnage s'empoisonne
        // lui-même. » Confondre les deux ferait perdre le seul cas où le poison se
        // retourne contre son porteur.
        expect(enduireArme(3, des(1)).issue).toBe('auto-empoisonnement');
        expect(enduireArme(3, des(2)).issue).toBe('dose-gaspillee');
    });

    it('reste un échec critique même avec une INT qui atteindrait la difficulté', () => {
        const r = enduireArme(15, des(1));
        expect(r.total).toBe(16);
        expect(r.issue).toBe('auto-empoisonnement');
    });

    it('rend le dé conservé, pour que la table voie d’où vient le verdict', () => {
        expect(enduireArme(2, des(8))).toMatchObject({ de: 8, total: 10 });
    });
});

describe('resisterAuPoison', () => {
    it('oppose la CON à la difficulté 10 par défaut', () => {
        expect(resisterAuPoison(1, undefined, des(9)).reussi).toBe(true);
        expect(resisterAuPoison(1, undefined, des(8)).reussi).toBe(false);
    });

    it('accepte une difficulté relevée selon la virulence du poison', () => {
        // « Cette difficulté peut être modifiée selon la virulence du poison. »
        expect(resisterAuPoison(2, 15, des(12)).reussi).toBe(false);
        expect(resisterAuPoison(2, 15, des(13)).reussi).toBe(true);
    });
});

describe('difficultés du livre', () => {
    it('vaut 10 pour enduire comme pour résister', () => {
        expect(DIF_ENDUIRE_ARME).toBe(10);
        expect(DIF_RESISTER_POISON).toBe(10);
    });
});
