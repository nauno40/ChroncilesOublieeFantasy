import { describe, expect, it } from 'vitest';
import { dommagesSubis } from './dommages';

describe('dommagesSubis', () => {
    it('reproduit l’exemple du livre : 5 au d8 + FOR +3 sur un ogre', () => {
        // « Elle lance le d8, obtient 5 et inflige donc 8 DM (5 + 3). »
        expect(dommagesSubis({ brut: 8 }).infliges).toBe(8);
    });

    it('retranche la RD : « RD 5 et 7 DM subis ⇒ 2 PV perdus »', () => {
        expect(dommagesSubis({ brut: 7, rd: 5 }).infliges).toBe(2);
    });

    it('applique la RD AVANT la division, comme le livre l’impose', () => {
        // « Appliquez d'abord la RD puis divisez les DM restants par deux. »
        // 10 DM contre RD 4 : (10 ‑ 4) / 2 = 3, et non (10 / 2) ‑ 4 = 1.
        expect(dommagesSubis({ brut: 10, rd: 4, resistance: true }).infliges).toBe(3);
    });

    it('arrondit la division à l’inférieur', () => {
        expect(dommagesSubis({ brut: 7, resistance: true }).infliges).toBe(3);
    });

    it('inflige toujours au moins 1 DM, quelle que soit la RD', () => {
        // « Toute attaque qui touche inflige au moins 1 DM. »
        expect(dommagesSubis({ brut: 3, rd: 20 }).infliges).toBe(1);
        expect(dommagesSubis({ brut: 1, resistance: true }).infliges).toBe(1);
        // Le gobelin à 1d4‑1 qui obtient 1 au dé inflige tout de même 1 DM.
        expect(dommagesSubis({ brut: 0 }).infliges).toBe(1);
    });

    it('applique le minimum de 1 DM aussi aux DM temporaires', () => {
        // « La règle s'applique aussi aux DM temporaires. »
        expect(dommagesSubis({ brut: 4, temporaire: true, forCible: 10 }).infliges).toBe(1);
    });

    it('retranche la FOR de la cible aux DM temporaires, et à eux seuls', () => {
        expect(dommagesSubis({ brut: 9, temporaire: true, forCible: 3 }).infliges).toBe(6);
        // Des DM ordinaires ignorent la FOR de la cible.
        expect(dommagesSubis({ brut: 9, forCible: 3 }).infliges).toBe(9);
    });

    it('double les DM sur un critique, avant toute réduction', () => {
        // « Les DM d'une réussite critique sont doublés (bonus inclus). »
        expect(dommagesSubis({ brut: 8, critique: true }).infliges).toBe(16);
        expect(dommagesSubis({ brut: 8, critique: true, rd: 6 }).infliges).toBe(10);
    });

    it('rend le calcul étape par étape', () => {
        const r = dommagesSubis({ brut: 10, rd: 4, resistance: true });
        expect(r.detail).toEqual(['DM 10', 'RD 4 → 6', 'résistance ÷2 → 3']);
    });

    it('signale quand le minimum d’un point a joué', () => {
        expect(dommagesSubis({ brut: 2, rd: 9 }).detail).toContain('minimum 1 DM');
        expect(dommagesSubis({ brut: 9, rd: 2 }).detail).not.toContain('minimum 1 DM');
    });
});
