// @vitest-environment jsdom
/**
 * Test de rendu de `ProfileSheet` : filet de sécurité contre le défaut qui a motivé ce
 * fichier (armorMaxDef présent dans le view-model, peuplé par les deux adaptateurs et
 * couvert par un test unitaire, mais jamais consommé par le JSX — donc affiché nulle
 * part, cf. RaceSheet.test.tsx pour le contexte complet). Ce fichier construit un
 * view-model où CHAQUE propriété de `ProfileSheetVM` est renseignée avec une valeur
 * distinctive, rend le composant, et vérifie que chaque valeur apparaît dans le DOM.
 *
 * `ProfileSheet` a deux onglets (« Légendes & Histoire » / « Voies & Capacités ») : les
 * champs de l'onglet inactif ne sont pas dans le DOM au premier rendu. On les couvre
 * avec un second test qui clique sur l'onglet, plutôt que de les retirer du
 * view-model.
 *
 * Deux paires de champs sont mutuellement exclusives PAR CONCEPTION (pas un défaut) :
 * `masteries`/`weaponsAndArmor` (ternaire explicite dans le JSX ; les adaptateurs ne
 * peuplent jamais les deux à la fois — cf. `fromOfficial.ts:183`) et
 * `magicStat`/`family.manaStat` (repli `vm.magicStat ?? vm.family?.manaStat`, une
 * seule valeur affichée). Le view-model « complet » ci-dessous exerce le chemin
 * principal (masteries, magicStat) ; un test dédié plus bas exerce les deux replis
 * avec un view-model minimal pour prouver qu'ils s'affichent bien quand c'est leur
 * tour d'être la seule source disponible.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileSheet } from './ProfileSheet';
import type { ProfileSheetVM } from './types';

afterEach(cleanup);

const vm: ProfileSheetVM = {
    name: 'ProfileMarkerNom',
    description: 'ProfileMarkerDescription',
    image: 'https://example.test/profile-marker.webp',
    family: {
        name: 'ProfileMarkerFamilyName',
        subtitle: 'ProfileMarkerFamilySubtitle',
        description: 'ProfileMarkerFamilyDescription',
        baseHp: 77,
        recoveryDie: 'ProfileMarkerRecoveryDie',
        luckPoints: 88,
        manaStat: 'ProfileMarkerManaStat',
        bonus: 'ProfileMarkerFamilyBonus',
    },
    hitDie: 'ProfileMarkerHitDie',
    profileType: 'ProfileMarkerProfileType',
    magicStat: 'ProfileMarkerMagicStat',
    armorMaxDef: 99,
    stats: { ProfileMarkerStatKey: 12 },
    masteries: [{ label: 'ProfileMarkerMasteryLabel', value: 'ProfileMarkerMasteryValue' }],
    weaponsAndArmor: undefined, // exclu par le ternaire quand `masteries` est défini ; cf. test dédié.
    startingEquipment: ['ProfileMarkerEquipmentItem'],
    note: 'ProfileMarkerNote',
    lore: [{ label: 'ProfileMarkerLoreLabel', value: 'ProfileMarkerLoreValue' }],
    voies: [
        {
            id: 'profile-voie-1',
            name: 'ProfileMarkerVoieName',
            details: { marqueur: 'ProfileMarkerVoieDetailsValue' },
            capabilities: [
                {
                    id: 'profile-cap-1',
                    rank: 5,
                    name: 'ProfileMarkerCapName',
                    description: 'ProfileMarkerCapDescription',
                    isSpell: true,
                    limited: true,
                    details: { marqueur: 'ProfileMarkerCapDetailsValue' },
                },
            ],
        },
    ],
};

describe('ProfileSheet', () => {
    it('affiche le tronc commun (identité, statistiques vitales, maîtrises, équipement) et l\'onglet Légendes & Histoire actif par défaut', () => {
        const { container } = render(
            <MemoryRouter>
                <ProfileSheet vm={vm} />
            </MemoryRouter>,
        );
        const text = container.textContent ?? '';

        // Identité + image.
        expect(text).toContain(vm.name);
        expect(text).toContain(vm.family!.subtitle);
        const images = container.querySelectorAll('img');
        expect(images.length).toBeGreaterThan(0);
        for (const img of images) {
            expect(img.getAttribute('src')).toBe(vm.image);
        }

        // Carte « Statistiques Vitales » — c'est ici que vivait le défaut qui a motivé
        // ce fichier : armorMaxDef était peuplé mais jamais rendu.
        expect(text).toContain(vm.profileType);
        expect(text).toContain(vm.hitDie);
        expect(text).toContain(String(vm.armorMaxDef));
        expect(text).toContain('ProfileMarkerStatKey');
        expect(text).toContain('12');
        expect(text).toContain(String(vm.family!.baseHp));
        expect(text).toContain(vm.family!.recoveryDie);
        expect(text).toContain(String(vm.family!.luckPoints));
        expect(text).toContain(vm.magicStat); // prioritaire sur family.manaStat (cf. test dédié)
        expect(text).toContain(vm.family!.bonus);

        // Carte « Maîtrises ».
        expect(text).toContain('ProfileMarkerMasteryLabel');
        expect(text).toContain('ProfileMarkerMasteryValue');

        // Carte « Équipement de départ ».
        expect(text).toContain('ProfileMarkerEquipmentItem');

        // Onglet « Légendes & Histoire » (actif par défaut).
        expect(text).toContain(vm.description);
        expect(text).toContain(vm.note);
        expect(text).toContain('ProfileMarkerLoreLabel');
        expect(text).toContain('ProfileMarkerLoreValue');
        expect(text).toContain(vm.family!.description);

        // Les champs de l'onglet « Voies & Capacités » ne sont pas encore dans le DOM.
        expect(text).not.toContain('ProfileMarkerVoieName');
    });

    it('affiche l\'onglet Voies & Capacités après clic (voies, capacités et leurs badges)', () => {
        const { container } = render(
            <MemoryRouter>
                <ProfileSheet vm={vm} />
            </MemoryRouter>,
        );
        fireEvent.click(within(container).getByText('Voies & Capacités'));
        const text = container.textContent ?? '';

        const voie = vm.voies![0];
        expect(text).toContain(voie.name);
        const voieLink = within(container).getByText(voie.name).closest('a');
        expect(voieLink?.getAttribute('href')).toBe(`/voies/${voie.id}`);
        expect(text).toContain('ProfileMarkerVoieDetailsValue');

        const cap = voie.capabilities![0];
        expect(text).toContain(String(cap.rank));
        expect(text).toContain(cap.name);
        expect(text).toContain(cap.description);
        expect(text).toContain('ProfileMarkerCapDetailsValue');
        // Badges booléens : libellés fixes rendus par le composant, pas des valeurs
        // distinctives du view-model — vérifiés par présence exacte de l'élément.
        expect(within(container).getByText('Sort')).toBeTruthy();
        expect(within(container).getByText('L')).toBeTruthy();
    });

    it('affiche les replis weaponsAndArmor et family.manaStat quand leur champ prioritaire est absent', () => {
        const fallbackVm: ProfileSheetVM = {
            name: 'ProfileMarkerFallback',
            weaponsAndArmor: 'ProfileMarkerWeaponsAndArmorFallback',
            family: { name: 'Famille de repli', manaStat: 'ProfileMarkerManaStatFallback' },
        };
        const { container } = render(
            <MemoryRouter>
                <ProfileSheet vm={fallbackVm} />
            </MemoryRouter>,
        );
        const text = container.textContent ?? '';
        expect(text).toContain('ProfileMarkerWeaponsAndArmorFallback');
        expect(text).toContain('ProfileMarkerManaStatFallback');
    });
});
