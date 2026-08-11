import { describe, expect, it } from 'vitest';
import { TYPES_CREATURE, typeCreature } from './typesCreature';

describe('type de créature', () => {
    it('porte les immunités que le livre attache aux non-vivantes', () => {
        // « Ces créatures ne respirent pas et sont immunisées aux maladies et aux poisons,
        // à toutes les attaques qui demandent un test de CON et sont infatigables. […]
        // Elles voient dans le noir. »
        const nv = TYPES_CREATURE['non-vivante'];
        expect(nv.implications).toHaveLength(5);
        expect(nv.implications.join(' ')).toContain('test de CON');
        expect(nv.implications.join(' ')).toContain('noir');
    });

    it('laisse la catégorie par défaut sans implication', () => {
        // « La catégorie par défaut » : n'inventer aucune immunité pour une créature vivante.
        expect(TYPES_CREATURE.vivante.implications).toEqual([]);
    });

    it('conditionne l’immunité mentale à l’absence d’intelligence', () => {
        // Une créature végétative intelligente « n'a pas d'autre immunité particulière » :
        // ranger l'immunité mentale avec les autres la rendrait fausse pour celles-là.
        for (const cle of ['vegetative', 'non-vivante']) {
            expect(TYPES_CREATURE[cle].siSansIntelligence).toHaveLength(1);
            expect(TYPES_CREATURE[cle].implications.join(' ')).not.toContain('mentale');
        }
    });

    it('reconnaît le libellé servi comme celui saisi à la main', () => {
        expect(typeCreature('Non-vivante')).toBe(TYPES_CREATURE['non-vivante']);
        expect(typeCreature('creature non vivante')).toBe(TYPES_CREATURE['non-vivante']);
        expect(typeCreature('Végétative')).toBe(TYPES_CREATURE.vegetative);
        expect(typeCreature('Humanoïde')).toBe(TYPES_CREATURE.humanoide);
        expect(typeCreature('Vivante')).toBe(TYPES_CREATURE.vivante);
    });

    it('ne range pas une créature non vivante parmi les vivantes', () => {
        // « vivante » est contenu dans « non-vivante » : l'ordre des tests est ce qui
        // empêche un squelette de perdre toutes ses immunités.
        expect(typeCreature('Non-vivante')).not.toBe(TYPES_CREATURE.vivante);
    });

    it('n’attribue aucun type à un libellé maison inconnu', () => {
        expect(typeCreature('Aberration')).toBeUndefined();
        expect(typeCreature('')).toBeUndefined();
        expect(typeCreature(undefined)).toBeUndefined();
    });
});
