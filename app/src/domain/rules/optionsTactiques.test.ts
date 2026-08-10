import { describe, expect, it } from 'vitest';
import {
    OPTIONS_TACTIQUES, MANOEUVRES, TOUTES_OPTIONS, optionTactique, bonusAttaqueGroupee,
} from './optionsTactiques';

describe('options tactiques', () => {
    it('porte les modificateurs chiffrés du livre', () => {
        expect(optionTactique('assuree')?.attaque).toBe(5);
        expect(optionTactique('precise-3')?.attaque).toBe(-3);
        expect(optionTactique('precise-7')?.attaque).toBe(-7);
        expect(optionTactique('bloquer')?.attaque).toBe(-5);
        expect(optionTactique('etourdir')?.attaque).toBe(-10);
    });

    it('n’attribue aucun modificateur d’attaque à ce qui n’en a pas', () => {
        // Défense partielle et totale agissent sur la DEF, pas sur le test d'attaque :
        // leur donner un modificateur d'attaque fausserait tous les jets.
        for (const id of ['defense-partielle', 'defense-totale', 'riposte', 'soutenir', 'gener', 'repousser']) {
            expect(optionTactique(id)?.attaque, `« ${id} » ne devrait pas modifier l'attaque`).toBeUndefined();
        }
    });

    it('exprime « Distraire (+CHA) » par une caractéristique, sans chiffre', () => {
        const distraire = optionTactique('distraire');
        expect(distraire?.attaqueCarac).toBe('CHA');
        expect(distraire?.attaque).toBeUndefined();
    });

    it('décrit ce que le livre n’exprime pas en chiffres', () => {
        // Un dé de DM ou un état infligé se lisent, ils ne se calculent pas ici.
        expect(optionTactique('assuree')?.effet).toContain('DM divisés par 2');
        expect(optionTactique('precise-3')?.effet).toContain('1d4°');
        expect(optionTactique('desarmer')?.effet).toContain('arme');
    });

    it('marque les manœuvres soumises au modificateur de taille', () => {
        // Les lignes que le livre marque d'un astérisque.
        const marquees = MANOEUVRES.filter(m => m.modifieParTaille).map(m => m.id);
        expect(marquees).toEqual(['repousser', 'bloquer', 'desarmer', 'renverser', 'etourdir']);
    });

    it('donne un identifiant unique à chaque entrée', () => {
        expect(TOUTES_OPTIONS).toHaveLength(OPTIONS_TACTIQUES.length + MANOEUVRES.length);
        expect(new Set(TOUTES_OPTIONS.map(o => o.id)).size).toBe(TOUTES_OPTIONS.length);
    });

    it('ignore un identifiant inconnu', () => {
        expect(optionTactique('inexistant')).toBeUndefined();
    });
});

describe('bonusAttaqueGroupee', () => {
    it('suit la table : 2 → +5, 3 → +10, 4 → touche automatique', () => {
        expect(bonusAttaqueGroupee(2)).toBe(5);
        expect(bonusAttaqueGroupee(3)).toBe(10);
        expect(bonusAttaqueGroupee(4)).toBe('automatique');
    });

    it('ne donne rien à une créature seule', () => {
        expect(bonusAttaqueGroupee(1)).toBe(0);
        expect(bonusAttaqueGroupee(0)).toBe(0);
    });

    it('traite un groupe de plus de quatre comme un groupe de quatre', () => {
        // Le livre demande de répartir en deux groupes au-delà : c'est l'appelant qui le
        // fait, la fonction ne décrit qu'un groupe.
        expect(bonusAttaqueGroupee(6)).toBe('automatique');
    });
});

describe('manœuvres et test opposé', () => {
    it('marque TOUTES les manœuvres comme tests opposés', () => {
        // « Le PJ choisit une manœuvre et utilise une action limitée pour faire un test
        // opposé d'attaque au contact » : les comparer à la DEF rendrait un verdict qui
        // n'existe pas dans les règles.
        for (const m of MANOEUVRES) {
            expect(m.testOppose, `« ${m.label} » devrait être un test opposé`).toBe(true);
        }
    });

    it('ne marque aucune option tactique ordinaire comme test opposé', () => {
        for (const o of OPTIONS_TACTIQUES) {
            expect(o.testOppose, `« ${o.label} » n'est pas un test opposé`).toBeUndefined();
        }
    });
});
