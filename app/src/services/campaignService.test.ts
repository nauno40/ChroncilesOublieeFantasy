import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Campaign } from '../types/campaign';

// `saveCampaign` envoie un PATCH ; on n'observe que ce qu'il met dans la charge utile.
const patch = vi.fn(async (..._args: unknown[]) => ({ id: 12, name: 'Campagne' }));
vi.mock('./api', () => ({ ApiService: { patch: (...a: unknown[]) => patch(...a), post: vi.fn() } }));

const { saveCampaign } = await import('./campaignService');

const campagne = {
    id: '12',
    name: 'Les Ombres de Val-Gelé',
    quests: [{ id: '1', title: 'Q', description: '', status: 'active' }],
    clues: [{ id: '2', title: 'I', content: '' }],
    sessions: [{ id: '3', title: 'S', date: '', summary: '' }],
    encounters: [{ id: '4', name: 'R', combatants: [] }],
} as unknown as Campaign;

const chargeUtile = () => (patch.mock.calls.at(-1) ?? [])[2] as Record<string, unknown>;

describe('saveCampaign — portée des sous-collections', () => {
    beforeEach(() => patch.mockClear());

    // Quêtes, indices, séances et rencontres sont en `orphanRemoval` côté serveur :
    // envoyer un tableau périmé supprime ce qu'il ne contient pas. Vérifié en conditions
    // réelles — un client ajoutant un indice depuis une lecture antérieure effaçait la
    // rencontre qu'un autre venait de créer.
    it('n’envoie que la collection déclarée', async () => {
        await saveCampaign(campagne, ['clues']);
        const envoye = chargeUtile();
        expect(envoye.clues).toBeDefined();
        expect(envoye.quests).toBeUndefined();
        expect(envoye.sessions).toBeUndefined();
        expect(envoye.encounters).toBeUndefined();
    });

    it('n’envoie aucune sous-collection quand la portée est vide', async () => {
        await saveCampaign({ ...campagne, notes: 'note' } as Campaign, []);
        const envoye = chargeUtile();
        for (const c of ['quests', 'clues', 'sessions', 'encounters']) {
            expect(envoye[c], `${c} ne devrait pas partir`).toBeUndefined();
        }
        expect(envoye.notes).toBe('note');
    });

    it('envoie tout quand la portée est omise — l’ancien comportement, à n’utiliser qu’avec un état complet', async () => {
        await saveCampaign(campagne);
        const envoye = chargeUtile();
        for (const c of ['quests', 'clues', 'sessions', 'encounters']) {
            expect(envoye[c], `${c} devrait partir`).toBeDefined();
        }
    });
});
