// @vitest-environment jsdom
/**
 * `useCharacterSheet` (566 lignes, le plus gros hook de l'app) n'avait aucun test direct
 * ni indirect. Les calculs dérivés (PV max, DEF, PM…) viennent de `domain/rules`, déjà
 * couverts en profondeur ailleurs (cofRules.test.ts) — ce fichier teste l'ORCHESTRATION
 * propre au hook : chargement, synchronisation `characterVoies` avec le profil choisi
 * (l'effet le plus délicat, avec un historique de régression documenté dans son propre
 * commentaire), la borne des caractéristiques à la création, l'analyse de l'équipement de
 * départ, et l'enregistrement.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { ApiService } from '../services/api';
import { useCharacterSheet, defaultCaracs, defaultPlayState } from './useCharacterSheet';
import type { RefProfile, RefRace, RefVoie, EquipmentLikeItem } from '../types/compendiumRefs';
import type { PlayState } from '../types/character';

vi.mock('../services/api', () => ({
    ApiService: { getOne: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

afterEach(() => vi.clearAllMocks());

// handleSave alerte systématiquement (succès ou échec) — silencieux ici, non testé pour
// lui-même (pas de logique, juste un message).
vi.spyOn(window, 'alert').mockImplementation(() => {});

const voieGuerrier: RefVoie = { '@id': '/api/voies/1', name: 'Voie du Guerrier', capabilities: [] };
const voieRodeur: RefVoie = { '@id': '/api/voies/2', name: 'Voie du Rôdeur', capabilities: [] };

const profilGuerrier: RefProfile = {
    '@id': '/api/profiles/1', name: 'Guerrier', voies: [voieGuerrier], armorMaxDef: 5, stats: { hpPerLevel: 10 },
};
const profilRodeur: RefProfile = {
    '@id': '/api/profiles/2', name: 'Rôdeur', voies: [voieRodeur], armorMaxDef: 3, stats: { hpPerLevel: 8 },
};

const races: RefRace[] = [];
const profiles: RefProfile[] = [profilGuerrier, profilRodeur];
const allVoies: RefVoie[] = [voieGuerrier, voieRodeur];

const navigate = vi.fn();

const setup = (overrides: Partial<Parameters<typeof useCharacterSheet>[0]> = {}) =>
    renderHook(
        (props: Partial<Parameters<typeof useCharacterSheet>[0]>) =>
            useCharacterSheet({ races, profiles, allVoies, id: undefined, isNew: true, navigate, ...props }),
        { initialProps: overrides },
    );

describe('useCharacterSheet — état initial et chargement', () => {
    it('un nouveau personnage démarre sans chargement, avec les valeurs par défaut', () => {
        const { result } = setup({ isNew: true, id: undefined });
        expect(result.current.loading).toBe(false);
        expect(result.current.character.caracs).toEqual(defaultCaracs);
        expect(result.current.character.characterVoies).toEqual([]);
        expect(result.current.character.playState?.equipment).toEqual(defaultPlayState.equipment);
        expect(result.current.character.playState?.weapons).toEqual(defaultPlayState.weapons);
        // Les réserves (PV/PM/PC) démarrent au maximum dès le montage, à la création (effet
        // dédié) — jamais figées à 0 comme dans `defaultPlayState`, qui n'est qu'un filet.
        expect(result.current.character.playState?.hp.current).toBe(result.current.maxHp);
        expect(result.current.character.playState?.mana.current).toBe(result.current.manaPoints);
        expect(result.current.character.playState?.luck.current).toBe(result.current.luckPoints);
    });

    it('charge un personnage existant et complète les racines manquantes avec les défauts (filet Phase 2)', async () => {
        vi.mocked(ApiService.getOne).mockResolvedValueOnce({
            id: 5, name: 'Aldric', level: 3,
            caracs: { ...defaultCaracs, FOR: 2 },
            playState: { hp: { current: 20 } }, // volontairement incomplet
            characterVoies: [],
        });

        const { result } = setup({ isNew: false, id: '5' });
        expect(result.current.loading).toBe(true);

        await act(async () => { await Promise.resolve(); });

        expect(result.current.loading).toBe(false);
        expect(result.current.character.name).toBe('Aldric');
        expect(result.current.character.caracs?.FOR).toBe(2);
        // Le filet complète les champs de playState absents de la réponse serveur.
        expect(result.current.character.playState?.hp.current).toBe(20);
        expect(result.current.character.playState?.mana).toEqual(defaultPlayState.mana);
        expect(result.current.character.playState?.equipment).toEqual([]);
    });

    it('un échec de chargement renvoie vers /characters sans planter', async () => {
        vi.mocked(ApiService.getOne).mockRejectedValueOnce(new Error('404'));

        const { result } = setup({ isNew: false, id: '999' });
        await act(async () => { await Promise.resolve(); });

        expect(result.current.loading).toBe(false);
        expect(navigate).toHaveBeenCalledWith('/characters');
    });
});

describe('useCharacterSheet — updateStat (bornes de création)', () => {
    it('à la création (niveau 0), refuse une valeur hors -2..+5', () => {
        const { result } = setup({ isNew: true });
        act(() => result.current.setCharacter(prev => ({ ...prev, level: 0 })));

        act(() => result.current.updateStat('FOR', '10')); // > MAX_STAT
        expect(result.current.caracs.FOR).toBe(0);

        act(() => result.current.updateStat('FOR', '-5')); // < MIN_STAT
        expect(result.current.caracs.FOR).toBe(0);

        act(() => result.current.updateStat('FOR', '3')); // dans la plage
        expect(result.current.caracs.FOR).toBe(3);
    });

    it('hors création (niveau > 0), n’applique aucune borne', () => {
        const { result } = setup({ isNew: true });
        act(() => result.current.setCharacter(prev => ({ ...prev, level: 4 })));

        act(() => result.current.updateStat('CON', '99'));
        expect(result.current.caracs.CON).toBe(99);
    });
});

describe('useCharacterSheet — synchronisation characterVoies avec le profil', () => {
    it('choisir un profil ajoute ses voies au rang 0, source "profil"', () => {
        const { result } = setup({ isNew: true });
        act(() => result.current.setCharacter(prev => ({ ...prev, profile: profilGuerrier['@id'] })));

        expect(result.current.character.characterVoies).toEqual([
            { voie: '/api/voies/1', rank: 0, source: 'profil' },
        ]);
    });

    it('changer de profil repart de zéro pour les voies de profil (ne garde pas l’ancien rang)', () => {
        const { result } = setup({ isNew: true });
        act(() => result.current.setCharacter(prev => ({
            ...prev,
            profile: profilGuerrier['@id'],
            characterVoies: [{ voie: '/api/voies/1', rank: 3, source: 'profil' }],
        })));

        // Changement de classe : le Guerrier (rang 3) doit disparaître au profit du Rôdeur (rang 0).
        act(() => result.current.setCharacter(prev => ({ ...prev, profile: profilRodeur['@id'] })));

        expect(result.current.character.characterVoies).toEqual([
            { voie: '/api/voies/2', rank: 0, source: 'profil' },
        ]);
    });

    it('préserve les voies de prestige et l’octroi racial (source trait) lors d’un changement de profil', () => {
        const { result } = setup({ isNew: true });
        act(() => result.current.setCharacter(prev => ({
            ...prev,
            profile: profilGuerrier['@id'],
            characterVoies: [
                { voie: '/api/voies/1', rank: 1, source: 'profil' },
                { voie: '/api/voies/99', rank: 1, source: 'prestige' },
            ],
        })));

        act(() => result.current.setCharacter(prev => ({ ...prev, profile: profilRodeur['@id'] })));

        const sources = result.current.character.characterVoies?.map(v => v.source).sort();
        expect(sources).toEqual(['prestige', 'profil']);
    });
});

describe('useCharacterSheet — addEquipmentItem', () => {
    const psVide = (): PlayState => ({ ...defaultPlayState, weapons: [], equipment: [], protection: { armor: { name: '', def: 0 }, shield: { name: '', def: 0 } } });

    it('une arme (stats "DM XdY") est ajoutée à playState.weapons', () => {
        const { result } = setup();
        const ps = psVide();
        result.current.addEquipmentItem({ item: 'Épée longue', stats: 'DM 1d8, Polyvalente' } as EquipmentLikeItem, ps);

        expect(ps.weapons).toEqual([{ name: 'Épée longue', atkMod: 0, dmg: '1d8', special: 'Polyvalente' }]);
    });

    it('une armure (stats "DEF +N") va dans protection.armor', () => {
        const { result } = setup();
        const ps = psVide();
        result.current.addEquipmentItem({ item: 'Cotte de mailles', stats: 'DEF +4' } as EquipmentLikeItem, ps);

        expect(ps.protection.armor).toEqual({ name: 'Cotte de mailles', def: 4 });
        expect(ps.protection.shield).toEqual({ name: '', def: 0 });
    });

    it('un bouclier (nom contenant "bouclier") va dans protection.shield, pas armor', () => {
        const { result } = setup();
        const ps = psVide();
        result.current.addEquipmentItem({ item: 'Petit bouclier', stats: 'DEF +1' } as EquipmentLikeItem, ps);

        expect(ps.protection.shield).toEqual({ name: 'Petit bouclier', def: 1 });
        expect(ps.protection.armor).toEqual({ name: '', def: 0 });
    });

    it('un objet sans DM ni DEF est ajouté tel quel à equipment', () => {
        const { result } = setup();
        const ps = psVide();
        result.current.addEquipmentItem({ item: 'Corde (10m)' } as EquipmentLikeItem, ps);

        expect(ps.equipment).toEqual(['Corde (10m) ']);
    });

    it('un ensemble ("set") traite récursivement chaque sous-élément', () => {
        const { result } = setup();
        const ps = psVide();
        result.current.addEquipmentItem({
            set: [{ item: 'Épée courte', stats: 'DM 1d6' }, { item: 'Sac à dos' }],
        } as EquipmentLikeItem, ps);

        expect(ps.weapons).toHaveLength(1);
        expect(ps.equipment).toEqual(['Sac à dos ']);
    });
});

describe('useCharacterSheet — handleSave', () => {
    it('à la création, POST puis navigue vers la fiche créée', async () => {
        vi.mocked(ApiService.post).mockResolvedValueOnce({ id: 42 });
        const { result } = setup({ isNew: true });

        act(() => result.current.setCharacter(prev => ({
            ...prev,
            name: 'Nouveau',
            characterVoies: [{ voie: '/api/voies/1', rank: 0, source: 'profil' }, { voie: '', rank: 0, source: 'prestige' }],
        })));

        await act(async () => { await result.current.handleSave(); });

        expect(ApiService.post).toHaveBeenCalledOnce();
        // Une voie sans IRI (emplacement de prestige vide) n'est pas envoyée : contrainte
        // backend NotBlank, cf. le commentaire de handleSave.
        const payload = vi.mocked(ApiService.post).mock.calls[0][1] as { characterVoies: unknown[] };
        expect(payload.characterVoies).toEqual([{ voie: '/api/voies/1', rank: 0, source: 'profil' }]);
        expect(navigate).toHaveBeenCalledWith('/characters/42');
    });

    it('à la création rattachée à une campagne, navigue vers la campagne', async () => {
        vi.mocked(ApiService.post).mockResolvedValueOnce({ id: 42 });
        const { result } = setup({ isNew: true, campaignId: 7 });

        await act(async () => { await result.current.handleSave(); });

        const payload = vi.mocked(ApiService.post).mock.calls[0][1] as { campaignId: number };
        expect(payload.campaignId).toBe(7);
        expect(navigate).toHaveBeenCalledWith('/campaign/7');
    });

    it('en édition, PUT sans navigation', async () => {
        vi.mocked(ApiService.getOne).mockResolvedValueOnce({ id: 1, name: 'Aldric', level: 1, caracs: defaultCaracs, playState: defaultPlayState, characterVoies: [] });
        const { result } = setup({ isNew: false, id: '1' });
        await act(async () => { await Promise.resolve(); });

        await act(async () => { await result.current.handleSave(); });

        expect(ApiService.put).toHaveBeenCalledWith('characters', '1', expect.anything());
        expect(navigate).not.toHaveBeenCalled();
    });
});
