import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveChildren, echecsCapacitesEnErreurs, resumeEchecsCapacites, duplicateEntry, resumeDuplication } from './homebrewChildren';
import { HomebrewService, type HomebrewEntry } from './homebrewService';

// Seuls les appels réseau sont doublés : `parRangCroissant` est une fonction pure,
// la doubler ferait passer le test sans rien prouver du tri réel.
vi.mock('./homebrewService', async importOriginal => ({
    ...(await importOriginal<typeof import('./homebrewService')>()),
    HomebrewService: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const nouvelle = (name: string) => ({ category: 'capacite', name, data: { rank: 1 } });

beforeEach(() => vi.clearAllMocks());

describe('saveChildren', () => {
    it('crée les nouvelles, met à jour les existantes, supprime les retirées', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });
        (HomebrewService.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 42 });
        (HomebrewService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        // Confirmées côté serveur avant cet appel : la capacité 42 (mise à jour) et la
        // capacité 55 (retirée par l'auteur, absente des brouillons finaux).
        const confirmees = [{ id: 42, ...nouvelle('B') }, { id: 55, ...nouvelle('C') }];
        const res = await saveChildren(7, 'public', [{ ...nouvelle('A') }, { id: 42, ...nouvelle('B') }], confirmees);

        expect(HomebrewService.create).toHaveBeenCalledTimes(1);
        expect(HomebrewService.update).toHaveBeenCalledWith(42, expect.anything());
        expect(HomebrewService.remove).toHaveBeenCalledWith(55);
        expect(res.failed).toEqual([]);
        expect(res.saved).toBe(2);
        // La capacité créée porte désormais son id serveur ; la retirée a bien disparu.
        expect(res.drafts).toEqual([
            { category: 'capacite', name: 'A', data: { rank: 1 }, id: 99 },
            { category: 'capacite', name: 'B', data: { rank: 1 }, id: 42 },
        ]);
    });

    it('transmet le parent et la visibilité à chaque enfant créé', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });
        await saveChildren(7, 'public', [nouvelle('A')], []);
        const payload = (HomebrewService.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(payload).toMatchObject({ parent: '/api/homebrew_entries/7', visibility: 'public' });
    });

    it('rend compte d’un échec partiel sans interrompre les suivantes', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ id: 1 })
            .mockRejectedValueOnce(new Error('boum'))
            .mockResolvedValueOnce({ id: 3 });

        const res = await saveChildren(7, 'private', [nouvelle('A'), nouvelle('B'), nouvelle('C')], []);

        expect(res.saved).toBe(2);
        expect(res.failed).toEqual([{ position: 2, nature: 'enregistrement', message: 'boum' }]);
    });

    it('une reprise après échec partiel ne recrée pas les capacités déjà réussies', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ id: 101 }) // A réussit au premier essai
            .mockRejectedValueOnce(new Error('boum')); // B échoue au premier essai

        const premier = await saveChildren(7, 'private', [nouvelle('A'), nouvelle('B')], []);

        expect(premier.saved).toBe(1);
        expect(premier.failed).toEqual([{ position: 2, nature: 'enregistrement', message: 'boum' }]);
        // A porte désormais son id serveur — une reprise doit la mettre à jour, jamais
        // la recréer. B reste sans id — rien n'existe encore côté serveur pour elle.
        expect(premier.drafts[0]).toEqual({ category: 'capacite', name: 'A', data: { rank: 1 }, id: 101 });
        expect(premier.drafts[1].id).toBeUndefined();

        vi.clearAllMocks();
        (HomebrewService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 202 });
        (HomebrewService.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 101 });

        // Le formulaire relance avec l'état renvoyé par le premier appel — c'est le
        // contrat : l'appelant remplace ses brouillons par `drafts` avant toute reprise.
        const second = await saveChildren(7, 'private', premier.drafts, []);

        // Aucune création supplémentaire pour A : elle passe par update (elle a un id).
        expect(HomebrewService.create).toHaveBeenCalledTimes(1);
        expect(HomebrewService.update).toHaveBeenCalledWith(101, expect.anything());
        expect(second.saved).toBe(2);
        expect(second.failed).toEqual([]);
    });

    it('une suppression en échec ne fait pas disparaître la capacité du formulaire', async () => {
        (HomebrewService.remove as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('refus serveur'));
        const confirmee = { id: 55, ...nouvelle('Ancienne') };

        // L'auteur a retiré la capacité 55 du formulaire (absente de `drafts`).
        const res = await saveChildren(7, 'private', [], [confirmee]);

        expect(res.failed).toEqual([{ position: 1, nature: 'suppression', message: 'refus serveur' }]);
        // L'auteur l'a retirée : on ne la lui remet pas sous les yeux…
        expect(res.drafts).toEqual([]);
        // …mais elle existe toujours côté serveur, donc elle reste confirmée.
        expect(res.confirmed).toEqual([confirmee]);
    });

    it('une reprise après suppression en échec RESUPPRIME, elle ne met pas à jour', async () => {
        // Le bandeau promet « réessayez » : si la reprise se contentait d'un PATCH,
        // l'échec disparaîtrait de l'écran et la capacité resterait en base.
        (HomebrewService.remove as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('refus serveur'));
        const confirmee = { id: 55, ...nouvelle('Ancienne') };

        const premier = await saveChildren(7, 'private', [], [confirmee]);
        expect(premier.failed).toHaveLength(1);

        vi.clearAllMocks();
        (HomebrewService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        // Le formulaire rejoue avec l'état renvoyé : brouillons vides, confirmées reprises.
        const second = await saveChildren(7, 'private', premier.drafts, premier.confirmed);

        expect(HomebrewService.remove).toHaveBeenCalledWith(55);
        expect(HomebrewService.update).not.toHaveBeenCalled();
        expect(second.failed).toEqual([]);
        expect(second.confirmed).toEqual([]);
    });

    it('sur un lot de suppressions aux issues mixtes, chaque échec pointe sur son propre bloc', async () => {
        // Trois suppressions demandées : la première réussit, les deux suivantes échouent.
        // Compter les échecs sur le rang dans le lot (suppressions réussies incluses)
        // décalait les positions : un échec désignait le bloc voisin, l'autre aucun.
        (HomebrewService.remove as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('refus A'))
            .mockRejectedValueOnce(new Error('refus B'));

        const res = await saveChildren(7, 'private', [], [
            { id: 51, ...nouvelle('Partie') },
            { id: 52, ...nouvelle('Restée A') },
            { id: 53, ...nouvelle('Restée B') },
        ]);

        // Aucune ne revient dans les brouillons : l'auteur les a toutes retirées.
        expect(res.drafts).toEqual([]);
        // Les deux qui résistent restent confirmées, donc rejouables.
        expect(res.confirmed.map(d => d.name)).toEqual(['Restée A', 'Restée B']);
        // Chaque échec porte une position distincte, au-delà des blocs affichés : compter
        // sur le rang dans le lot (suppressions réussies incluses) les décalait.
        expect(res.failed).toEqual([
            { position: 1, nature: 'suppression', message: 'refus A' },
            { position: 2, nature: 'suppression', message: 'refus B' },
        ]);
        // Aucun bloc affiché ne leur correspond : seul le bandeau de synthèse en parle.
        expect(echecsCapacitesEnErreurs(res.failed, res.drafts.length)).toEqual({});
    });
});

describe('echecsCapacitesEnErreurs', () => {
    it('traduit une position affichée (1-based) en clé de bloc (0-based)', () => {
        expect(echecsCapacitesEnErreurs([{ position: 2, nature: 'enregistrement', message: 'boum' }], 3)).toEqual({
            'capacites.1.': "Échec de l'enregistrement de cette capacité — réessayez.",
        });
    });

    it('traduit chaque échec dont la position correspond à un bloc affiché', () => {
        const out = echecsCapacitesEnErreurs(
            [{ position: 1, nature: 'enregistrement', message: 'a' }, { position: 3, nature: 'enregistrement', message: 'c' }],
            3,
        );
        expect(Object.keys(out).sort()).toEqual(['capacites.0.', 'capacites.2.']);
    });

    it('ignore une position au-delà des blocs affichés (ex. suppression d’une capacité déjà retirée du formulaire)', () => {
        // 1 seul bloc visible ; l'échec en position 2 (une suppression refusée) ne
        // désigne aucun bloc du formulaire — seul le bandeau de synthèse doit en rendre compte.
        expect(echecsCapacitesEnErreurs([{ position: 2, nature: 'suppression', message: 'refus serveur' }], 1)).toEqual({});
    });

    it('ne produit aucune erreur en l’absence d’échec', () => {
        expect(echecsCapacitesEnErreurs([], 3)).toEqual({});
    });
});

describe('resumeEchecsCapacites', () => {
    it('parle d’enregistrement quand tous les échecs sont des créations/mises à jour', () => {
        const phrase = resumeEchecsCapacites([{ position: 1, nature: 'enregistrement', message: 'boum' }], 2);
        expect(phrase).toContain('enregistrée(s)');
        expect(phrase).not.toContain('supprimée(s)');
    });

    it('parle de suppression quand tous les échecs sont des suppressions refusées', () => {
        // 1 seul bloc visible : une position 2 est nécessairement une suppression
        // (capacité déjà retirée du formulaire par l'auteur), pas un échec d'enregistrement.
        const phrase = resumeEchecsCapacites([{ position: 2, nature: 'suppression', message: 'refus serveur' }], 1);
        expect(phrase).toContain('supprimée(s)');
        expect(phrase).not.toContain('enregistrée(s)');
    });

    it('mentionne les deux quand les échecs sont mixtes', () => {
        const phrase = resumeEchecsCapacites(
            [{ position: 1, nature: 'enregistrement', message: 'boum' }, { position: 3, nature: 'suppression', message: 'refus serveur' }],
            2,
        );
        expect(phrase).toContain('enregistrée(s)');
        expect(phrase).toContain('supprimée(s)');
    });
});

describe('duplicateEntry', () => {
    const voie = {
        id: 7, category: 'voie', name: 'Voie du feu', description: 'desc',
        visibility: 'public', data: { category: 'profil', maxRank: 5 },
        authorId: 1, authorPseudo: 'moi', createdAt: '', updatedAt: '',
    } as unknown as HomebrewEntry;

    const capacite = (id: number, name: string, rank: number) => ({
        id, category: 'capacite', name, description: null, visibility: 'public',
        data: { rank }, authorId: 1, authorPseudo: 'moi', createdAt: '', updatedAt: '',
    }) as unknown as HomebrewEntry;

    it('copie les capacités de la voie, dans l’ordre des rangs', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ id: 70 }) // la copie de la voie
            .mockResolvedValue({ id: 71 });    // ses capacités

        // Fournies dans le désordre : la copie doit rétablir l'ordre des rangs.
        const res = await duplicateEntry(voie, [capacite(9, 'Rang 2', 2), capacite(8, 'Rang 1', 1)]);

        expect(res).toEqual({ id: 70, copiees: 2, echecs: 0 });
        const appels = (HomebrewService.create as ReturnType<typeof vi.fn>).mock.calls;
        expect(appels[0][0]).toMatchObject({ name: 'Voie du feu (copie)', visibility: 'private' });
        expect(appels[1][0]).toMatchObject({ name: 'Rang 1', parent: '/api/homebrew_entries/70', visibility: 'private' });
        expect(appels[2][0]).toMatchObject({ name: 'Rang 2', parent: '/api/homebrew_entries/70' });
    });

    it('ne recopie jamais l’identifiant d’origine : ce sont de nouvelles entrées', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 70 });
        await duplicateEntry(voie, [capacite(8, 'Rang 1', 1)]);
        for (const [payload] of (HomebrewService.create as ReturnType<typeof vi.fn>).mock.calls) {
            expect(payload).not.toHaveProperty('id');
        }
    });

    it('rend compte d’une capacité qui n’a pas pu être copiée', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ id: 70 })
            .mockResolvedValueOnce({ id: 71 })
            .mockRejectedValueOnce(new Error('boum'));

        const res = await duplicateEntry(voie, [capacite(8, 'A', 1), capacite(9, 'B', 2)]);
        expect(res).toEqual({ id: 70, copiees: 1, echecs: 1 });
        expect(resumeDuplication(res.copiees, res.echecs)).toContain('1 capacité(s) sur 2');
    });

    it('une entrée sans enfant se duplique comme avant', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 70 });
        const res = await duplicateEntry(voie);
        expect(res).toEqual({ id: 70, copiees: 0, echecs: 0 });
        expect(HomebrewService.create).toHaveBeenCalledTimes(1);
        expect(resumeDuplication(0, 0)).toBeNull();
    });
});
