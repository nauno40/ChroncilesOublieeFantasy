import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveChildren } from './homebrewChildren';
import { HomebrewService } from './homebrewService';

vi.mock('./homebrewService', () => ({
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
        expect(res.failed).toEqual([{ position: 2, message: 'boum' }]);
    });

    it('une reprise après échec partiel ne recrée pas les capacités déjà réussies', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ id: 101 }) // A réussit au premier essai
            .mockRejectedValueOnce(new Error('boum')); // B échoue au premier essai

        const premier = await saveChildren(7, 'private', [nouvelle('A'), nouvelle('B')], []);

        expect(premier.saved).toBe(1);
        expect(premier.failed).toEqual([{ position: 2, message: 'boum' }]);
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

        expect(res.failed).toEqual([{ position: 1, message: 'refus serveur' }]);
        // Toujours là côté serveur : elle doit réapparaître, pas disparaître silencieusement.
        expect(res.drafts).toEqual([confirmee]);
    });
});
