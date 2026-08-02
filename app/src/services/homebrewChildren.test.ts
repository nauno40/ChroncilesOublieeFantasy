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

        const res = await saveChildren(7, 'public', [{ ...nouvelle('A') }, { id: 42, ...nouvelle('B') }], [42, 55]);

        expect(HomebrewService.create).toHaveBeenCalledTimes(1);
        expect(HomebrewService.update).toHaveBeenCalledWith(42, expect.anything());
        expect(HomebrewService.remove).toHaveBeenCalledWith(55);
        expect(res.failed).toEqual([]);
        expect(res.saved).toBe(2);
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
});
