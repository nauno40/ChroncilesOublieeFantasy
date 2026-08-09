import { describe, expect, it } from 'vitest';
import { modDegats, sousTypeEquipement, COLONNES_TABLE } from './tablesCompendium';

describe('modDegats', () => {
    it('n’ajoute la FOR qu’aux armes de contact (COF2)', () => {
        expect(modDegats('Contact')).toBe('+ FOR');
        expect(modDegats('Distance')).toBe('—');
        expect(modDegats(undefined)).toBe('—');
    });
});

describe('sousTypeEquipement', () => {
    it('respecte la règle de la page officielle : « Bouclier » et « Corps » sont des armures', () => {
        // Cette règle décidait seule du tri officiel avant d'être partagée : la changer
        // ferait disparaître des entrées d'un onglet. Vérifiée sur les deux types réels.
        expect(sousTypeEquipement({ type: 'Bouclier' })).toBe('armure');
        expect(sousTypeEquipement({ type: 'Corps' })).toBe('armure');
        expect(sousTypeEquipement({ type: 'Contact', damage: '1d8' })).toBe('arme');
        expect(sousTypeEquipement({ type: 'Distance', damage: '1d6' })).toBe('arme');
    });

    it('classe une entrée communautaire par ses champs, faute de type normalisé', () => {
        // Le type communautaire est du texte libre : c'est la présence de `acBonus` ou de
        // `damage` qui tranche.
        expect(sousTypeEquipement({ type: 'Plastron enchanté', acBonus: 4 })).toBe('armure');
        expect(sousTypeEquipement({ type: 'Fléau d’armes', damage: '2d6' })).toBe('arme');
        expect(sousTypeEquipement({ type: 'Épée courte' })).toBe('arme');
        expect(sousTypeEquipement({ type: 'Trousse de soins' })).toBe('materiel');
    });

    it('ne prend pas un bonus de DEF nul pour une armure', () => {
        expect(sousTypeEquipement({ type: 'Corde', acBonus: 0 })).toBe('materiel');
    });
});

describe('COLONNES_TABLE', () => {
    it('ne déclare jamais deux fois la même colonne dans une table', () => {
        for (const [type, colonnes] of Object.entries(COLONNES_TABLE)) {
            const cles = colonnes.map(c => c.key);
            expect(new Set(cles).size, `colonnes en double dans « ${type} »`).toBe(cles.length);
        }
    });
});
