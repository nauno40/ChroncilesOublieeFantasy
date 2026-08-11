import { describe, expect, it } from 'vitest';
import { FILTRES_COMMUNAUTAIRES, PASTILLES_COMMUNAUTAIRES, appliquerFiltres } from './filtresCompendium';
import { invitRecherche, compteurDuType, TYPES_COMPENDIUM } from './compendium';

describe('vocabulaire d’un type', () => {
    it('nomme le type dans l’invite de recherche, des deux côtés', () => {
        // L'onglet communautaire disait « Rechercher… » là où l'officiel nommait le type.
        expect(invitRecherche('race')).toBe('Rechercher un peuple…');
        expect(invitRecherche('voie')).toBe('Rechercher une voie…');
        expect(invitRecherche('piege')).toBe('Rechercher un piège…');
    });

    it('couvre les sous-types de l’équipement, qui nomment la liste à sa place', () => {
        expect(invitRecherche('arme')).toBe('Rechercher une arme…');
        expect(invitRecherche('materiel')).toBe('Rechercher un matériel…');
    });

    it('retombe sur une invite neutre pour la Bibliothèque, qui n’a pas de type', () => {
        expect(invitRecherche('inconnu')).toBe('Rechercher…');
    });

    it('donne un compteur dans les mots du type, pluriel irrégulier compris', () => {
        expect(compteurDuType('race')).toEqual({ singulier: 'peuple', pluriel: undefined });
        // « 6 objet magiques » était le pluriel obtenu en ajoutant un « s ».
        expect(compteurDuType('objet-magique')).toEqual({ singulier: 'objet magique', pluriel: 'objets magiques' });
        expect(compteurDuType('materiel')).toEqual({ singulier: 'matériel', pluriel: 'matériels' });
    });

    it('donne à chaque type un singulier et un article', () => {
        for (const [cle, meta] of Object.entries(TYPES_COMPENDIUM)) {
            expect(meta.singulier, `« ${cle} » sans singulier`).toBeTruthy();
            expect(['un', 'une']).toContain(meta.article);
        }
    });
});

describe('appliquerFiltres', () => {
    const entrees = [
        { data: { rank: 1, isSpell: true } },
        { data: { rank: 3, isSpell: false } },
        { data: { rank: 3, isSpell: true } },
        { data: {} },
    ];
    const filtres = FILTRES_COMMUNAUTAIRES.capacite;

    it('ne filtre rien sans choix', () => {
        expect(appliquerFiltres(entrees, filtres, {})).toHaveLength(4);
        expect(appliquerFiltres(entrees, filtres, { rank: 'all' })).toHaveLength(4);
    });

    it('filtre sur un champ du schéma communautaire', () => {
        expect(appliquerFiltres(entrees, filtres, { rank: '3' })).toHaveLength(2);
    });

    it('normalise le booléen d’un sort, quel que soit son écriture', () => {
        expect(appliquerFiltres(entrees, filtres, { isSpell: 'spell' })).toHaveLength(2);
        // Une entrée sans le champ n'est pas un sort : elle rejoint « hors sorts ».
        expect(appliquerFiltres(entrees, filtres, { isSpell: 'non-spell' })).toHaveLength(2);
    });

    it('cumule les filtres', () => {
        expect(appliquerFiltres(entrees, filtres, { rank: '3', isSpell: 'spell' })).toHaveLength(1);
    });
});

describe('pastilles communautaires', () => {
    it('reprend les intitulés et l’ordre des pastilles officielles des voies', () => {
        // La page officielle propose Toutes, Personnage, Peuple, Créature, Prestige : le
        // formulaire communautaire parlait de « profil », mot absent de l'officiel.
        expect(PASTILLES_COMMUNAUTAIRES.voie.options.map(o => o.label))
            .toEqual(['Toutes', 'Personnage', 'Peuple', 'Créature', 'Prestige']);
    });

    it('compare le texte libre saisi sans tenir compte de la casse ni des espaces', () => {
        const lit = PASTILLES_COMMUNAUTAIRES.voie.lit;
        expect(lit('  Prestige ')).toBe('prestige');
        expect(lit(undefined)).toBe('');
    });
});

describe('filtre « Dé de vie » des classes communautaires', () => {
    const filtres = FILTRES_COMMUNAUTAIRES.classe;
    const classes = [
        { data: { family: 'Combattants' } },
        { data: { family: 'Famille des Mages' } },
        { data: { family: 'aventuriers' } },
        { data: { family: 'Artificiers' } },   // famille maison : aucun dé connu
        { data: {} },
    ];

    it('range chaque classe sous le dé de sa famille, comme la page officielle', () => {
        expect(appliquerFiltres(classes, filtres, { family: 'd10' })).toHaveLength(1);
        expect(appliquerFiltres(classes, filtres, { family: 'd6' })).toHaveLength(1);
        expect(appliquerFiltres(classes, filtres, { family: 'd8' })).toHaveLength(1);
    });

    it('ne propose que les trois dés de COF2', () => {
        // Le dé dépend de la famille : d6, d8, d10. Proposer d4 ou d12 — les dés de d20 —
        // donnerait des choix qui ne rendent jamais rien.
        expect(filtres.find(f => f.key === 'family')?.options.map(o => o.value)).toEqual(['d6', 'd8', 'd10']);
    });

    it('laisse la famille maison hors des trois dés plutôt que dans l’un d’eux', () => {
        for (const de of ['d6', 'd8', 'd10']) {
            expect(appliquerFiltres([classes[3]], filtres, { family: de })).toHaveLength(0);
        }
    });
});
