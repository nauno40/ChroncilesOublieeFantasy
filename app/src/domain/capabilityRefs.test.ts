import { describe, it, expect } from 'vitest';
import { resoudreEtat, etatsDeclares, lienEtat } from './capabilityRefs';
import type { HarmfulState } from '../types/normalized';

// Les 8 états du compendium, dans leur orthographe canonique.
const ETATS: HarmfulState[] = [
    'Affaibli', 'Aveuglé', 'Étourdi', 'Immobilisé',
    'Paralysé', 'Ralenti', 'Renversé', 'Surpris',
].map((name, i) => ({ id: String(i + 1), name, description: '', image: '' }));

describe('resoudreEtat', () => {
    it('accepte l’orthographe canonique', () => {
        expect(resoudreEtat('Étourdi', ETATS)).toBe('Étourdi');
    });

    it('ignore la casse et les accents', () => {
        expect(resoudreEtat('etourdi', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('ÉTOURDI', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('ETOURDI', ETATS)).toBe('Étourdi');
    });

    it('ignore l’accord — le féminin et le pluriel n’ajoutent qu’un suffixe', () => {
        expect(resoudreEtat('Étourdie', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('Renversée', ETATS)).toBe('Renversé');
        expect(resoudreEtat('Immobilisées', ETATS)).toBe('Immobilisé');
        // « Surprise » est la forme féminine de « Surpris » : le nom connu en est un préfixe.
        expect(resoudreEtat('Surprise', ETATS)).toBe('Surpris');
    });

    it('écarte ce qui ne correspond à aucun état connu', () => {
        expect(resoudreEtat('Enflammé', ETATS)).toBeUndefined();
        expect(resoudreEtat('', ETATS)).toBeUndefined();
    });
});

describe('etatsDeclares', () => {
    it('résout chaque déclaration vers son nom canonique', () => {
        const cap = { name: 'Fauchage', states: ['Renversée', 'surpris'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Renversé', 'Surpris']);
    });

    it('fusionne deux orthographes du même état en une seule entrée', () => {
        // Sinon le suivi de combat poserait deux pastilles pour une seule mécanique.
        const cap = { name: 'Choc', states: ['Renversé', 'Renversée', 'RENVERSEES'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Renversé']);
    });

    it('écarte une déclaration périmée sans faire disparaître les autres', () => {
        const cap = { name: 'Mixte', states: ['Enflammé', 'Ralenti'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Ralenti']);
    });

    it('rend un tableau vide quand rien n’est déclaré', () => {
        expect(etatsDeclares({ name: 'Rien' }, ETATS)).toEqual([]);
        expect(etatsDeclares({ name: 'Vide', states: [] }, ETATS)).toEqual([]);
    });
});

describe('lienEtat', () => {
    it('mène à la liste des états filtrée sur le nom', () => {
        expect(lienEtat('Étourdi')).toBe('/states?q=%C3%89tourdi');
    });
});

import { resoudreInvocation, capacitesDuCombattant, capacitesDuPersonnage } from './capabilityRefs';
import type { Capacity, Creature, CustomCreature, Weapon, Armor } from '../types/normalized';
import type { Character } from '../types/character';
import type { Combatant } from '../types/campaign';
import type { HomebrewEntry } from '../services/homebrewService';

const loup = { id: 7, name: 'Loup', capabilities: [{ name: 'Morsure' }] } as unknown as Creature;
const golem = { id: 3, name: 'Golem maison', capabilities: [{ name: 'Poing' }] } as unknown as CustomCreature;
const epee = { id: '11', name: 'Épée longue' } as unknown as Weapon;
const cotte = { id: '12', name: 'Cotte de mailles' } as unknown as Armor;
const relique = { id: 90, name: 'Relique communautaire' } as unknown as HomebrewEntry;

const SOURCES = {
    creatures: [loup],
    monstresMaison: [golem],
    armes: [epee],
    armures: [cotte],
    communautaire: [relique],
};

const combattant = (extra: Partial<Combatant>): Combatant => ({
    id: 'c1', name: 'X', type: 'monster', initiative: 10,
    hp: { current: 5, max: 5 }, def: 12, per: 0, tiebreak: 1, states: [],
    ...extra,
});

describe('resoudreInvocation', () => {
    it('résout une créature officielle par son nom, vers sa fiche', () => {
        const r = resoudreInvocation({ type: 'creature', ref: 'Loup' }, SOURCES);
        expect(r).toEqual({ type: 'creature', creature: loup, lien: '/bestiary/7' });
    });

    it('résout un monstre maison par le préfixe custom-', () => {
        const r = resoudreInvocation({ type: 'creature', ref: 'custom-3' }, SOURCES);
        expect(r).toEqual({ type: 'creature', creature: golem, lien: '/tools/monsters' });
    });

    it('résout une arme officielle vers la liste filtrée, onglet armes', () => {
        const r = resoudreInvocation({ type: 'item', ref: 'Épée longue' }, SOURCES);
        expect(r).toEqual({
            type: 'item', nom: 'Épée longue',
            lien: '/equipment?q=%C3%89p%C3%A9e%20longue&tab=weapons',
        });
    });

    it('résout une armure officielle vers l’onglet armures', () => {
        const r = resoudreInvocation({ type: 'item', ref: 'Cotte de mailles' }, SOURCES);
        expect(r && r.type === 'item' && r.lien).toContain('tab=armors');
    });

    it('résout un objet communautaire vers sa fiche pleine page', () => {
        const r = resoudreInvocation({ type: 'item', ref: 'homebrew-90' }, SOURCES);
        expect(r).toEqual({ type: 'item', nom: 'Relique communautaire', lien: '/homebrew/90' });
    });

    it('ne crée rien quand la référence ne désigne rien d’existant', () => {
        expect(resoudreInvocation({ type: 'creature', ref: 'Dragon' }, SOURCES)).toBeUndefined();
        expect(resoudreInvocation({ type: 'creature', ref: 'custom-999' }, SOURCES)).toBeUndefined();
        expect(resoudreInvocation({ type: 'item', ref: 'homebrew-999' }, SOURCES)).toBeUndefined();
        expect(resoudreInvocation({ type: 'item', ref: 'Bâton' }, SOURCES)).toBeUndefined();
    });
});

describe('capacitesDuCombattant', () => {
    it('rend les capacités d’un combattant venu du bestiaire', () => {
        const c = combattant({ source: 'bestiary', referenceId: '7' });
        expect(capacitesDuCombattant(c, [loup], [golem])).toEqual([{ name: 'Morsure' }]);
    });

    it('reconnaît un monstre maison par son préfixe', () => {
        const c = combattant({ source: 'bestiary', referenceId: 'custom-3' });
        expect(capacitesDuCombattant(c, [loup], [golem])).toEqual([{ name: 'Poing' }]);
    });

    it('ne rend rien pour un combattant ajouté à la main ou un personnage joueur', () => {
        expect(capacitesDuCombattant(combattant({ source: 'manual' }), [loup], [golem])).toBeUndefined();
        expect(capacitesDuCombattant(combattant({ source: 'character', referenceId: '7' }), [loup], [golem])).toBeUndefined();
    });

    it('ne rend rien quand la créature référencée n’existe plus', () => {
        // Le suivi de combat est persisté : un monstre maison peut avoir été supprimé depuis.
        const c = combattant({ source: 'bestiary', referenceId: 'custom-999' });
        expect(capacitesDuCombattant(c, [loup], [golem])).toBeUndefined();
    });

    it('ne rend rien plutôt qu’un tableau vide quand la créature n’a aucune capacité', () => {
        const muet = { id: 8, name: 'Rat', capabilities: [] } as unknown as Creature;
        const c = combattant({ source: 'bestiary', referenceId: '8' });
        expect(capacitesDuCombattant(c, [muet], [])).toBeUndefined();
    });
});

describe('capacitesDuPersonnage', () => {
    // Une voie de 3 capacités ; le personnage n'en a acquis que 2 rangs.
    const CAPS = [
        { id: '1', name: 'Rang 1', description: 'A', rank: 1, voie: '/api/voies/50', voieId: null, active: false, profileId: null },
        { id: '2', name: 'Rang 2', description: 'B', rank: 2, voie: '/api/voies/50', voieId: null, active: false, profileId: null },
        { id: '3', name: 'Rang 3', description: 'C', rank: 3, voie: '/api/voies/50', voieId: null, active: false, profileId: null },
        // Capacité d'une AUTRE voie, que le personnage ne possède pas.
        { id: '4', name: 'Étrangère', description: 'D', rank: 1, voie: '/api/voies/99', voieId: null, active: false, profileId: null },
    ] as unknown as Capacity[];

    const heros = {
        id: 12, name: 'Héros', level: 3,
        characterVoies: [{ voie: '/api/voies/50', rank: 2, source: 'profile' }],
    } as unknown as Character;

    const combattantPerso = (extra: Partial<Combatant> = {}): Combatant => ({
        id: 'c9', name: 'Héros', type: 'player', initiative: 12,
        hp: { current: 10, max: 10 }, def: 13, per: 1, tiebreak: 5, states: [],
        source: 'character', referenceId: '12',
        ...extra,
    });

    it('ne rend que les capacités dont le rang est acquis', () => {
        // Rang 2 acquis : les capacités 1 et 2, jamais la 3 — proposer au MJ une capacité
        // que le personnage ne possède pas serait pire que ne rien afficher.
        const out = capacitesDuPersonnage(combattantPerso(), [heros], CAPS);
        expect(out?.map(c => c.name)).toEqual(['Rang 1', 'Rang 2']);
    });

    it('écarte les capacités des voies que le personnage n’a pas', () => {
        const out = capacitesDuPersonnage(combattantPerso(), [heros], CAPS);
        expect(out?.some(c => c.name === 'Étrangère')).toBe(false);
    });

    it('reconnaît une capacité qui référence sa voie par identifiant brut', () => {
        const parId = [{ id: '5', name: 'Brut', description: 'E', rank: 1, voie: undefined, voieId: '50', active: false, profileId: null }] as unknown as Capacity[];
        const out = capacitesDuPersonnage(combattantPerso(), [heros], parId);
        expect(out?.map(c => c.name)).toEqual(['Brut']);
    });

    it('trie par rang croissant, quel que soit l’ordre reçu', () => {
        const desordre = [CAPS[1], CAPS[0]] as unknown as Capacity[];
        const out = capacitesDuPersonnage(combattantPerso(), [heros], desordre);
        expect(out?.map(c => c.name)).toEqual(['Rang 1', 'Rang 2']);
    });

    it('reporte les déclarations de la capacité', () => {
        const declarante = [{ ...CAPS[0], states: ['Renversé'], summons: [{ type: 'creature', ref: 'Loup' }] }] as unknown as Capacity[];
        const out = capacitesDuPersonnage(combattantPerso(), [heros], declarante);
        expect(out?.[0].states).toEqual(['Renversé']);
        expect(out?.[0].summons).toEqual([{ type: 'creature', ref: 'Loup' }]);
    });

    it('ne rend rien pour un combattant qui n’est pas un personnage', () => {
        expect(capacitesDuPersonnage(combattantPerso({ source: 'manual' }), [heros], CAPS)).toBeUndefined();
        expect(capacitesDuPersonnage(combattantPerso({ source: 'bestiary' }), [heros], CAPS)).toBeUndefined();
    });

    it('ne rend rien quand le personnage est introuvable', () => {
        // Le suivi de combat est persisté : un personnage peut avoir été supprimé depuis.
        expect(capacitesDuPersonnage(combattantPerso({ referenceId: '999' }), [heros], CAPS)).toBeUndefined();
    });

    it('ne rend rien plutôt qu’un tableau vide quand aucun rang n’est acquis', () => {
        const debutant = { ...heros, characterVoies: [{ voie: '/api/voies/50', rank: 0, source: 'profile' }] } as unknown as Character;
        expect(capacitesDuPersonnage(combattantPerso(), [debutant], CAPS)).toBeUndefined();
    });
});
