import { describe, expect, it } from 'vitest';
import { effetsCumules, defEffective } from './etatsCombat';
import type { HarmfulState } from '../../types/normalized';

/** Les définitions réelles du compendium, dans leur forme servie par l'API. */
const DEFINITIONS = [
    { id: 1, name: 'Aveuglé', description: '', effects: { bonuses: [{ target: 'init', value: -5 }, { target: 'attaque', value: -5 }, { target: 'def', value: -5 }], note: '-10 en attaque à distance' } },
    { id: 2, name: 'Renversé', description: '', effects: { bonuses: [{ target: 'attaque', value: -5 }, { target: 'def', value: -5 }], note: "Se relever coûte une action d'attaque" } },
    { id: 3, name: 'Affaibli', description: '', effects: { malusDie: 'all' } },
    { id: 4, name: 'Immobilisé', description: '', effects: { malusDie: 'attack', noMove: true } },
    { id: 5, name: 'Étourdi', description: '', effects: { bonuses: [{ target: 'def', value: -5 }], noAction: true } },
    { id: 6, name: 'Essoufflé', description: '', effects: { moveLimit: 5 } },
    { id: 7, name: 'Ralenti', description: '', effects: { note: 'Une seule action par round' } },
] as unknown as HarmfulState[];

describe('effetsCumules', () => {
    it('additionne les modificateurs chiffrés de deux états', () => {
        // Aveuglé (‑5 DEF) et Renversé (‑5 DEF) : deux pénalités distinctes, donc ‑10.
        const r = effetsCumules(['Aveuglé', 'Renversé'], DEFINITIONS);
        expect(r.def).toBe(-10);
        expect(r.attaque).toBe(-10);
        expect(r.init).toBe(-5);
    });

    it('ne cumule pas les dés malus', () => {
        // « Il n'est pas possible de cumuler plusieurs dés bonus ou malus. »
        const r = effetsCumules(['Affaibli', 'Immobilisé'], DEFINITIONS);
        expect(r.deMalusTests).toBe(true);
        // Un dé malus sur TOUS les tests couvre déjà l'attaque : ne pas l'annoncer deux fois.
        expect(r.deMalusAttaque).toBe(false);
    });

    it('distingue le dé malus général du dé malus d’attaque', () => {
        expect(effetsCumules(['Immobilisé'], DEFINITIONS)).toMatchObject({ deMalusTests: false, deMalusAttaque: true });
        expect(effetsCumules(['Affaibli'], DEFINITIONS)).toMatchObject({ deMalusTests: true, deMalusAttaque: false });
    });

    it('retient l’interdiction d’agir et de se déplacer', () => {
        expect(effetsCumules(['Étourdi'], DEFINITIONS).sansAction).toBe(true);
        expect(effetsCumules(['Immobilisé'], DEFINITIONS).sansDeplacement).toBe(true);
        expect(effetsCumules(['Aveuglé'], DEFINITIONS).sansAction).toBe(false);
    });

    it('garde le plafond de déplacement le plus contraignant', () => {
        const r = effetsCumules(['Essoufflé'], DEFINITIONS);
        expect(r.deplacementMax).toBe(5);
        expect(effetsCumules(['Aveuglé'], DEFINITIONS).deplacementMax).toBeUndefined();
    });

    it('rassemble les notes, préfixées de leur état', () => {
        const r = effetsCumules(['Renversé', 'Ralenti'], DEFINITIONS);
        expect(r.notes).toEqual([
            "Renversé — Se relever coûte une action d'attaque",
            'Ralenti — Une seule action par round',
        ]);
    });

    it('ignore un état inconnu sans perdre les autres', () => {
        // Le suivi de combat accepte des états saisis à la main.
        const r = effetsCumules(['Maudit par le MJ', 'Étourdi'], DEFINITIONS);
        expect(r.def).toBe(-5);
        expect(r.sansAction).toBe(true);
    });

    it('ne retient rien sans état', () => {
        expect(effetsCumules([], DEFINITIONS)).toMatchObject({ def: 0, attaque: 0, init: 0, notes: [] });
    });
});

describe('defEffective', () => {
    it('applique les modificateurs d’états à la DEF de base', () => {
        expect(defEffective(15, effetsCumules(['Aveuglé', 'Renversé'], DEFINITIONS))).toBe(5);
        expect(defEffective(15, effetsCumules([], DEFINITIONS))).toBe(15);
    });
});
