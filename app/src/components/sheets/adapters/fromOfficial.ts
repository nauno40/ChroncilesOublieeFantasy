import type { Race, Profile, Voie, Capacity } from '../../../types/normalized';
import type { RaceSheetVM, ProfileSheetVM, VoieSheetVM, CapaciteSheetVM, SheetVoieRef } from '../types';

/** Vide → undefined : une section sans contenu ne doit pas être rendue. */
const str = (v: unknown): string | undefined => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '' ? undefined : s;
};
const num = (v: unknown): number | undefined => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);
const list = (v: unknown): string[] | undefined => {
    if (!Array.isArray(v)) return undefined;
    const out = v.map(x => (typeof x === 'string' ? x : JSON.stringify(x))).filter(Boolean);
    return out.length ? out : undefined;
};
const refs = (voies?: Voie[]): SheetVoieRef[] | undefined =>
    voies && voies.length ? voies.map(v => ({ id: String(v.id), name: v.name })) : undefined;

export const raceToVM = (race: Race, voies?: Voie[]): RaceSheetVM => ({
    name: race.name,
    description: str(race.description),
    image: str(race.image),
    modifiers: race.modifiers?.length
        ? Object.fromEntries(race.modifiers.filter(m => m.stat).map(m => [m.stat as string, m.value]))
        : undefined,
    minHeight: num(race.minHeight),
    maxHeight: num(race.maxHeight),
    minWeight: num(race.minWeight),
    maxWeight: num(race.maxWeight),
    startingAge: num(race.startingAge),
    lifeExpectancy: num(race.lifeExpectancy),
    abilities: str(race.abilities),
    physicalTraits: str(race.physicalTraits),
    publicPerception: str(race.publicPerception),
    roleplay: str(race.roleplay),
    typicalNames: str(race.typicalNames),
    detailedDescription: str(race.detailedDescription),
    voies: refs(voies),
});

export const profileToVM = (p: Profile, voies?: Voie[]): ProfileSheetVM => ({
    name: p.name,
    description: str(p.description),
    image: str(p.imageUrl),
    family: typeof p.family === 'string' ? str(p.family) : str((p.family as { name?: string } | undefined)?.name),
    hitDie: str(p.hitDie),
    magicStat: str(p.magicStat),
    armorMaxDef: num(p.armorMaxDef),
    stats: p.stats as Record<string, number> | undefined,
    startingEquipment: list(p.startingEquipment),
    masteries: p.masteries ? list(Object.values(p.masteries)) : undefined,
    note: str(p.note),
    voies: refs(voies),
});

export const voieToVM = (v: Voie, caps?: Capacity[]): VoieSheetVM => ({
    name: v.name,
    description: str(v.description),
    category: str(v.type),
    capabilities: caps && caps.length
        ? [...caps]
            .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
            .map(c => ({ rank: num(c.rank), name: c.name, description: str(c.description), isSpell: c.isSpell || undefined }))
        : undefined,
});

export const capacityToVM = (c: Capacity, voieName?: string): CapaciteSheetVM => ({
    name: c.name,
    description: str(c.description),
    rank: num(c.rank),
    isSpell: c.isSpell || undefined,
    limited: c.limited || undefined,
    voieName: str(voieName),
});
