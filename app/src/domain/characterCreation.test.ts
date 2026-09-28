import { describe, expect, it } from 'vitest';
import { applyProfileSelection } from './characterCreation';
import { defaultPlayState } from '../hooks/useCharacterSheet';
import type { Character } from '../types/character';
import type { ProfileList } from '../components/character/types';
import type { EquipmentLikeItem } from '../types/compendiumRefs';

const baseCharacter: Partial<Character> = { name: 'Test', level: 0, playState: { ...defaultPlayState } };

const addEquipmentItem = (itemObj: EquipmentLikeItem, ps: { weapons?: unknown[]; protection?: { armor: { name: string; def: number }; shield: { name: string; def: number } }; equipment?: string[] }) => {
    if (itemObj.set) {
        itemObj.set.forEach(sub => addEquipmentItem(sub, ps));
        return;
    }
    const item = itemObj.item!;
    const stats = itemObj.stats || '';
    if (stats.includes('DM')) {
        ps.weapons = [...(ps.weapons || []), { name: item }];
    } else if (stats.includes('DEF')) {
        const defVal = parseInt(stats.match(/DEF\s*\+(\d+)/i)?.[1] || '0');
        const prot = { ...(ps.protection || { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } }) };
        if (item.toLowerCase().includes('bouclier')) prot.shield = { name: item, def: defVal };
        else prot.armor = { name: item, def: defVal };
        ps.protection = prot;
    } else {
        ps.equipment = [...(ps.equipment || []), `${item} ${stats ? `(${stats})` : ''}`];
    }
};

describe('applyProfileSelection', () => {
    it('sans équipement de départ : profil posé, sac d\'aventurier ajouté, pas de file de choix', () => {
        const profiles = [{ '@id': '/api/profiles/1', name: 'Guerrier' }] as unknown as ProfileList;
        const { characterPatch, choicesFound } = applyProfileSelection('/api/profiles/1', baseCharacter, profiles, addEquipmentItem);

        expect(characterPatch.profile).toBe('/api/profiles/1');
        expect(choicesFound).toEqual([]);
        // Sac d'aventurier (Couverture, Torche, Briquet à silex, Outre, Gamelle) présent.
        expect(characterPatch.playState?.equipment).toEqual(
            expect.arrayContaining(['Couverture', 'Torche', 'Briquet à silex', 'Outre', 'Gamelle']),
        );
    });

    it('réinitialise armes/protection/inventaire avant d\'appliquer le nouveau profil', () => {
        const dirty: Partial<Character> = {
            ...baseCharacter,
            playState: {
                ...defaultPlayState,
                weapons: [{ name: 'Ancienne épée', atkMod: 0, dmg: '1d6', special: '' }],
                equipment: ['Vieux machin'],
                protection: { armor: { name: 'Vieille armure', def: 2 }, shield: { name: '', def: 0 } },
            },
        };
        const profiles = [{ '@id': '/api/profiles/1', name: 'Guerrier' }] as unknown as ProfileList;
        const { characterPatch } = applyProfileSelection('/api/profiles/1', dirty, profiles, addEquipmentItem);

        expect(characterPatch.playState?.weapons).toEqual([]);
        expect(characterPatch.playState?.protection).toEqual({ armor: { name: '', def: 0 }, shield: { name: '', def: 0 } });
        expect(characterPatch.playState?.equipment).not.toContain('Vieux machin');
    });

    it('sépare items directs (posés immédiatement) et choix (mis en file, non appliqués)', () => {
        const profiles = [{
            '@id': '/api/profiles/2',
            name: 'Magicien',
            startingEquipment: [
                { item: 'Bâton', stats: 'DM 1d6' },
                { choice: [{ item: 'Dague', stats: 'DM 1d4' }, { item: 'Fronde', stats: 'DM 1d4' }] },
            ],
        }] as unknown as ProfileList;

        const { characterPatch, choicesFound } = applyProfileSelection('/api/profiles/2', baseCharacter, profiles, addEquipmentItem);

        expect(characterPatch.playState?.weapons).toEqual([{ name: 'Bâton' }]);
        expect(choicesFound).toHaveLength(1);
        expect(choicesFound[0]).toEqual([{ item: 'Dague', stats: 'DM 1d4' }, { item: 'Fronde', stats: 'DM 1d4' }]);
        // Le choix n'est PAS résolu ici : aucune dague/fronde dans l'équipement posé.
        expect(characterPatch.playState?.weapons).not.toContainEqual(expect.objectContaining({ name: 'Dague' }));
    });

    it('tire une bourse de départ entre 2 et 12 pa (2d6)', () => {
        const profiles = [{ '@id': '/api/profiles/1', name: 'Guerrier' }] as unknown as ProfileList;
        for (let i = 0; i < 20; i++) {
            const { characterPatch } = applyProfileSelection('/api/profiles/1', baseCharacter, profiles, addEquipmentItem);
            expect(characterPatch.playState?.money?.pa).toBeGreaterThanOrEqual(2);
            expect(characterPatch.playState?.money?.pa).toBeLessThanOrEqual(12);
        }
    });

    it('profil introuvable : pose quand même le profil et le sac d\'aventurier, aucun choix', () => {
        const { characterPatch, choicesFound } = applyProfileSelection('/api/profiles/inconnu', baseCharacter, [] as unknown as ProfileList, addEquipmentItem);
        expect(characterPatch.profile).toBe('/api/profiles/inconnu');
        expect(choicesFound).toEqual([]);
        expect(characterPatch.playState?.equipment?.length).toBeGreaterThan(0);
    });
});
