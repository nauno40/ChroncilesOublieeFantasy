import { describe, it, expect, vi, beforeEach } from 'vitest';

const getAll = vi.fn<(...args: unknown[]) => Promise<unknown[]>>();
vi.mock('./api', () => ({ ApiService: { getAll: (...a: unknown[]) => getAll(...a) } }));

const { DataService } = await import('./dataService');

describe('DataService.getWeapons / getArmors — partage la collection equipment', () => {
    beforeEach(() => {
        getAll.mockReset();
        DataService.clearCache();
    });

    const equipement = [
        { id: '1', name: 'Épée longue', type: 'Arme' },
        { id: '2', name: 'Armure de plates', type: 'Armure lourde' },
        { id: '3', name: 'Bouclier rond', type: 'Bouclier' },
        { id: '4', name: 'Arc court', type: 'ARME À DISTANCE' },
    ];

    it('getWeapons exclut les armures et boucliers (comparaison insensible à la casse)', async () => {
        getAll.mockResolvedValueOnce(equipement);
        const armes = await DataService.getWeapons();
        expect(armes.map(a => a.id)).toEqual(['1', '4']);
    });

    it('getArmors ne garde que les armures et boucliers', async () => {
        getAll.mockResolvedValueOnce(equipement);
        const armures = await DataService.getArmors();
        expect(armures.map(a => a.id)).toEqual(['2', '3']);
    });

    it('un équipement sans type n’est jamais classé armure (ni erreur sur `.toLowerCase()`)', async () => {
        getAll.mockResolvedValueOnce([{ id: '5', name: 'Mystère' }]);
        const armes = await DataService.getWeapons();
        const armures = await DataService.getArmors();
        expect(armes.map(a => a.id)).toEqual(['5']);
        expect(armures).toEqual([]);
    });
});

describe('DataService — cache mémoire des collections (cachedGetAll)', () => {
    beforeEach(() => {
        getAll.mockReset();
        DataService.clearCache();
    });

    it('ne fait qu’un seul appel réseau pour deux lectures successives du même endpoint', async () => {
        getAll.mockResolvedValue([{ id: 1, name: 'Loup' }]);
        await DataService.getCreatures();
        await DataService.getCreatures();
        expect(getAll).toHaveBeenCalledTimes(1);
    });

    it('partage un seul appel réseau entre deux lectures concurrentes (mémoïse la Promise, pas juste le résultat)', async () => {
        let resolve!: (v: unknown[]) => void;
        getAll.mockReturnValueOnce(new Promise(r => { resolve = r; }));

        const p1 = DataService.getCreatures();
        const p2 = DataService.getCreatures();
        resolve([{ id: 1, name: 'Loup' }]);
        await Promise.all([p1, p2]);

        expect(getAll).toHaveBeenCalledTimes(1);
    });

    it('retire une requête échouée du cache pour qu’un nouvel essai puisse repartir', async () => {
        getAll.mockRejectedValueOnce(new Error('réseau HS'));
        await expect(DataService.getCreatures()).rejects.toThrow('réseau HS');

        getAll.mockResolvedValueOnce([{ id: 1, name: 'Loup' }]);
        const creatures = await DataService.getCreatures();
        expect(getAll).toHaveBeenCalledTimes(2);
        expect(creatures).toHaveLength(1);
    });

    it('renvoie une copie du tableau à chaque appel — un tri local ne corrompt pas l’entrée partagée', async () => {
        getAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
        const premier = await DataService.getCreatures();
        premier.reverse();
        const second = await DataService.getCreatures();
        expect(second.map((c: { id: number }) => c.id)).toEqual([1, 2]);
    });

    it('clearCache force un nouvel appel réseau', async () => {
        getAll.mockResolvedValue([{ id: 1 }]);
        await DataService.getCreatures();
        DataService.clearCache();
        await DataService.getCreatures();
        expect(getAll).toHaveBeenCalledTimes(2);
    });
});

describe('DataService.getAllEquipmentMap — répartition par onglet', () => {
    beforeEach(() => {
        getAll.mockReset();
        DataService.clearCache();
    });

    it('classe chaque objet dans le bon onglet (armes par défaut, armures/boucliers, montures/vivres)', async () => {
        getAll.mockResolvedValueOnce([
            { id: 1, name: 'Épée', type: 'Arme' },
            { id: 2, name: 'Cotte de mailles', type: 'Armure' },
            { id: 3, name: 'Bouclier', type: 'Petit bouclier' },
            { id: 4, name: 'Cheval', type: 'Mount' },
            { id: 5, name: 'Sans type' },
        ]);

        const map = await DataService.getAllEquipmentMap();
        expect(map.get('1')?.tab).toBe('weapons');
        expect(map.get('2')?.tab).toBe('armors');
        expect(map.get('3')?.tab).toBe('armors');
        expect(map.get('4')?.tab).toBe('provisions');
        expect(map.get('5')?.tab).toBe('weapons');
    });
});
