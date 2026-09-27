import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Campaign } from '../types/campaign';

// `saveCampaign` envoie un PATCH ; on n'observe que ce qu'il met dans la charge utile.
const patch = vi.fn<(...args: unknown[]) => Promise<{ id: number; name: string }>>(
    async () => ({ id: 12, name: 'Campagne' }),
);
const post = vi.fn<(...args: unknown[]) => Promise<{ id: number; name: string }>>(
    async () => ({ id: 99, name: 'Campagne' }),
);
const getOne = vi.fn<(...args: unknown[]) => Promise<unknown>>();
vi.mock('./api', () => ({
    ApiService: {
        patch: (...a: unknown[]) => patch(...a),
        post: (...a: unknown[]) => post(...a),
        getOne: (...a: unknown[]) => getOne(...a),
    },
}));

const { saveCampaign, getCampaign } = await import('./campaignService');

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

describe('saveCampaign — PATCH (id backend) vs POST (id temporaire)', () => {
    beforeEach(() => { patch.mockClear(); post.mockClear(); });

    // Distinction cruciale : un PUT (plutôt qu'un PATCH) réinitialiserait les champs hors
    // payload — dont `inviteCode`, non exposé en écriture — et pousserait le serveur à en
    // régénérer un, en collision avec l'ancien. D'où PATCH pour un id backend (entier, sans
    // tiret) et POST pour un id temporaire (UUID client, contient un tiret).
    it('PATCH quand l’id ressemble à un id backend (entier, sans tiret)', async () => {
        await saveCampaign({ ...campagne, id: '12' } as Campaign);
        expect(patch).toHaveBeenCalledOnce();
        expect(post).not.toHaveBeenCalled();
    });

    it('POST quand l’id est un UUID temporaire (contient un tiret)', async () => {
        await saveCampaign({ ...campagne, id: 'a1b2c3-temp-uuid' } as Campaign);
        expect(post).toHaveBeenCalledOnce();
        expect(patch).not.toHaveBeenCalled();
    });

    it('POST quand l’id est vide (nouvelle campagne jamais enregistrée)', async () => {
        await saveCampaign({ ...campagne, id: '' } as Campaign);
        expect(post).toHaveBeenCalledOnce();
        expect(patch).not.toHaveBeenCalled();
    });
});

describe('saveCampaign — @id des sous-éléments selon leur propre id', () => {
    beforeEach(() => patch.mockClear());

    // Un élément déjà persisté (id backend) doit porter son IRI @id pour être rattaché ;
    // un élément tout juste créé côté client (UUID temporaire) ne doit PAS en porter un —
    // ce serait une IRI vers une ressource qui n'existe pas.
    it('ajoute @id pour un indice existant, pas pour un indice tout juste créé', async () => {
        const avecDeuxIndices = {
            ...campagne,
            clues: [
                { id: '2', content: 'Indice existant', status: 'unsolved' },
                { id: 'temp-uuid-neuf', content: 'Nouvel indice', status: 'unsolved' },
            ],
        } as unknown as Campaign;

        await saveCampaign(avecDeuxIndices, ['clues']);
        const envoye = chargeUtile();
        const clues = envoye.clues as Array<{ '@id'?: string }>;
        expect(clues[0]['@id']).toBe('/api/clues/2');
        expect(clues[1]['@id']).toBeUndefined();
    });
});

describe('mapBackendToFrontend (via getCampaign) — dates et valeurs par défaut', () => {
    beforeEach(() => getOne.mockReset());

    it('convertit une date ISO valide et applique les défauts sur les champs manquants', async () => {
        getOne.mockResolvedValueOnce({
            id: 7,
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-02-20T10:00:00Z',
            clues: [{ id: 1, content: 'x', foundAt: '2026-03-01T00:00:00Z', status: 'solved' }],
        });

        const campagne = await getCampaign('7');
        expect(campagne).not.toBeNull();
        expect(campagne!.name).toBe('');
        expect(campagne!.description).toBe('');
        expect(campagne!.created_at).toBe(new Date('2026-01-15T10:00:00Z').getTime());
        expect(campagne!.updated_at).toBe(new Date('2026-02-20T10:00:00Z').getTime());
        expect(campagne!.clues![0].found_at).toBe('2026-03-01');
        expect(campagne!.quests).toEqual([]);
        expect(campagne!.sessions).toEqual([]);
    });

    it('replie une date de création invalide/absente sur "maintenant", pas sur une exception', async () => {
        const avant = Date.now();
        getOne.mockResolvedValueOnce({ id: 8, createdAt: 'pas-une-date', updatedAt: null });
        const campagne = await getCampaign('8');
        const apres = Date.now();

        expect(campagne!.created_at).toBeGreaterThanOrEqual(avant);
        expect(campagne!.created_at).toBeLessThanOrEqual(apres);
        expect(campagne!.updated_at).toBeGreaterThanOrEqual(avant);
    });

    it('replie found_at sur undefined quand la date est absente ou invalide, sans planter', async () => {
        getOne.mockResolvedValueOnce({
            id: 9,
            clues: [
                { id: 1, content: 'sans date', status: 'unsolved' },
                { id: 2, content: 'date invalide', status: 'unsolved', foundAt: 'nawak' },
            ],
        });
        const campagne = await getCampaign('9');
        expect(campagne!.clues![0].found_at).toBeUndefined();
        expect(campagne!.clues![1].found_at).toBeUndefined();
    });
});
