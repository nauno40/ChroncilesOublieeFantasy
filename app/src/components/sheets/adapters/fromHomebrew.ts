import type { HomebrewEntry } from '../../../services/homebrewService';
import type { RaceSheetVM, ProfileSheetVM, VoieSheetVM, CapaciteSheetVM } from '../types';

/**
 * Projection de `entry.data` (JSON libre, clés définies par services/homebrewSchemas.ts)
 * vers les view-models. Toute valeur vide devient `undefined` pour que la feuille
 * masque la section correspondante.
 */
const d = (e: HomebrewEntry): Record<string, unknown> => (e.data ?? {}) as Record<string, unknown>;

const str = (v: unknown): string | undefined => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '' ? undefined : s;
};
const num = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    return Number.isNaN(n) ? undefined : n;
};
const bool = (v: unknown): boolean | undefined => (v === true ? true : undefined);
const list = (v: unknown): string[] | undefined => {
    if (Array.isArray(v)) {
        const out = v.map(x => (typeof x === 'string' ? x.trim() : String(x))).filter(Boolean);
        return out.length ? out : undefined;
    }
    const s = str(v);
    return s ? s.split('\n').map(l => l.trim()).filter(Boolean) : undefined;
};
const caracs = (v: unknown): Record<string, number> | undefined => {
    if (!v || typeof v !== 'object') return undefined;
    const out: Record<string, number> = {};
    for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
        const n = num(raw);
        if (n !== undefined && n !== 0) out[k] = n;
    }
    return Object.keys(out).length ? out : undefined;
};

export const homebrewToRaceVM = (e: HomebrewEntry): RaceSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        image: str(data.image),
        modifiers: caracs(data.modifiers),
        speed: str(data.speed),
        minHeight: num(data.minHeight),
        maxHeight: num(data.maxHeight),
        minWeight: num(data.minWeight),
        maxWeight: num(data.maxWeight),
        startingAge: num(data.startingAge),
        lifeExpectancy: num(data.lifeExpectancy),
        abilities: str(data.abilities),
        physicalTraits: str(data.physicalTraits),
        publicPerception: str(data.publicPerception),
        roleplay: str(data.roleplay),
        typicalNames: str(data.typicalNames),
        detailedDescription: str(data.detailedDescription),
    };
};

export const homebrewToProfileVM = (e: HomebrewEntry): ProfileSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        image: str(data.image),
        family: str(data.family),
        magicStat: str(data.magicStat),
        armorMaxDef: num(data.armorMaxDef),
        stats: caracs(data.stats),
        weaponsAuth: list(data.weaponsAuth),
        armorAuth: list(data.armorAuth),
        startingEquipment: list(data.startingEquipment),
        masteries: list(data.masteries),
        note: str(data.note),
        lore: list(data.lore),
    };
};

export const homebrewToVoieVM = (e: HomebrewEntry): VoieSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        category: str(data.category),
        maxRank: num(data.maxRank),
        capabilities: list(data.details)?.map(l => ({ name: l })),
    };
};

export const homebrewToCapaciteVM = (e: HomebrewEntry): CapaciteSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        rank: num(data.rank),
        actionType: str(data.actionType),
        isSpell: e.category === 'sort' ? true : bool(data.isSpell),
        limited: bool(data.limited),
        effect: list(data.effect),
        details: list(data.details),
    };
};
