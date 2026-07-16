import { ApiService } from '../services/api';
import type { Campaign, Encounter } from '../types/campaign';

// Forme brute d'une rencontre côté API (relations/JSON non typés strictement).
interface RawEncounter {
    id?: number | string;
    name?: string;
    notes?: string;
    combatants?: unknown;
}

const RESOURCE = 'campaigns';

export const getCampaigns = async (): Promise<Campaign[]> => {
    try {
        const data = await ApiService.getAll<any>(RESOURCE);
        return data.map(mapBackendToFrontend);
    } catch (error) {
        console.error("Failed to fetch campaigns", error);
        return [];
    }
};

export const getCampaign = async (id: string): Promise<Campaign | null> => {
    try {
        const data = await ApiService.getOne<any>(RESOURCE, id);
        return mapBackendToFrontend(data);
    } catch (error) {
        console.error(`Failed to fetch campaign ${id}`, error);
        return null;
    }
};

export const saveCampaign = async (campaign: Campaign): Promise<Campaign> => {
    const backendData = mapFrontendToBackend(campaign);
    try {
        if (campaign.id && !campaign.id.includes('-')) { // Simple check if it's a backend ID (int) vs temp UUID
            // PATCH (mise à jour partielle) et non PUT : un PUT réinitialise les champs
            // hors payload (dont inviteCode, non exposé en écriture), ce qui pousse
            // CampaignStateProcessor à régénérer le code d'invitation → collision d'unicité.
            const data = await ApiService.patch<any>(RESOURCE, campaign.id, backendData);
            return mapBackendToFrontend(data);
        } else {
            // New campaign
            const data = await ApiService.post<any>(RESOURCE, backendData);
            return mapBackendToFrontend(data);
        }
    } catch (error) {
        console.error("Failed to save campaign", error);
        throw error;
    }
};

export const createCampaign = async (name: string, description: string): Promise<Campaign> => {
    const newCampaign = {
        name,
        description,
        quests: [],
        clues: [],
        sessions: [],
        notes: ''
    };
    try {
        const data = await ApiService.post<any>(RESOURCE, newCampaign);
        return mapBackendToFrontend(data);
    } catch (error) {
        console.error("Failed to create campaign", error);
        throw error;
    }
};

export const deleteCampaign = async (id: string): Promise<void> => {
    try {
        await ApiService.delete(RESOURCE, id);
    } catch (error) {
        console.error(`Failed to delete campaign ${id}`, error);
        throw error;
    }
};

// Mapping Helpers
const mapBackendToFrontend = (b: any): Campaign => {
    const parseDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return new Date().getTime();
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? new Date().getTime() : d.getTime();
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return undefined;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return undefined;
        return d.toISOString().split('T')[0];
    };

    return {
        id: b.id.toString(),
        name: b.name,
        description: b.description || '',
        created_at: parseDate(b.createdAt),
        updated_at: parseDate(b.updatedAt),
        characters: (b.characters || []).map((c: any) => ({
            id: (c.id || '').toString(),
            name: c.name || 'Sans nom',
            level: c.level || 1,
            race: c.race?.name || '',
            profile: c.profile?.name || '',
            caracs: c.caracs || {},
            playState: c.playState || {},
            characterVoies: c.characterVoies || []
        })),
        encounters: (b.encounters || []).map((e: RawEncounter) => ({
            id: String(e.id ?? ''),
            name: e.name || 'Rencontre',
            notes: e.notes || '',
            combatants: Array.isArray(e.combatants) ? e.combatants : []
        })),
        notes: b.notes || '',
        quests: (b.quests || []).map((q: any) => ({
            id: (q.id || '').toString(),
            title: q.title || 'Sans titre',
            description: q.description || '',
            type: q.type || 'main',
            status: q.status || 'active'
        })),
        clues: (b.clues || []).map((c: any) => ({
            id: (c.id || '').toString(),
            content: c.content || '',
            found_at: formatDate(c.foundAt),
            status: c.status || 'unsolved'
        })),
        sessions: (b.sessions || []).map((s: any) => ({
            id: (s.id || '').toString(),
            title: s.title || 'Session sans titre',
            date: formatDate(s.date) || new Date().toISOString().split('T')[0],
            duration: s.duration || '',
            level: s.level || '',
            summary: s.summary || ''
        }))
    };
};

const mapFrontendToBackend = (f: any): any => {
    const b: any = {
        name: f.name,
        description: f.description,
        notes: f.notes
    };

    const isBackendId = (id: string | number | undefined) => {
        if (!id) return false;
        const s = id.toString();
        return s !== '' && !s.includes('-');
    };

    if (f.quests) {
        b.quests = f.quests.map((q: any) => {
            const item: any = {
                title: q.title,
                description: q.description,
                type: q.type,
                status: q.status
            };
            if (isBackendId(q.id)) {
                item['@id'] = `/api/quests/${q.id}`;
            }
            return item;
        });
    }

    if (f.clues) {
        b.clues = f.clues.map((c: any) => {
            const item: any = {
                content: c.content,
                foundAt: c.found_at ? new Date(c.found_at).toISOString() : null,
                status: c.status
            };
            if (isBackendId(c.id)) {
                item['@id'] = `/api/clues/${c.id}`;
            }
            return item;
        });
    }

    if (f.sessions) {
        b.sessions = f.sessions.map((s: any) => {
            const item: any = {
                title: s.title,
                date: s.date ? new Date(s.date).toISOString() : new Date().toISOString(),
                duration: s.duration,
                level: s.level,
                summary: s.summary
            };
            if (isBackendId(s.id)) {
                item['@id'] = `/api/sessions/${s.id}`;
            }
            return item;
        });
    }

    if (f.encounters) {
        b.encounters = f.encounters.map((e: Encounter) => {
            const item: Record<string, unknown> = {
                name: e.name,
                notes: e.notes || null,
                combatants: e.combatants || []
            };
            if (isBackendId(e.id)) {
                item['@id'] = `/api/encounters/${e.id}`;
            }
            return item;
        });
    }

    // NB : on n'envoie PAS `characters` dans la sauvegarde de campagne. Les fiches
    // sont gérées via leur propre endpoint (rattachement/détachement = PATCH
    // characters/{id}). De plus, la campagne sérialise les persos avec `@id` mais
    // sans `id` (groupe character:read), donc les renvoyer ici en merge-patch
    // recréerait des personnages vides (name NOT NULL) au lieu de les rattacher.

    return b;
};
