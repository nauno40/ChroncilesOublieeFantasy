import type { Race, Profile, Voie, Capacity } from '../../../types/normalized';
import type { RaceSheetVM, ProfileSheetVM, VoieSheetVM, CapaciteSheetVM, SheetVoieRef, SheetCapabilityRef } from '../types';

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
/** Vide/NULL → undefined : la majorité des capacités n'ont pas de `details`. */
const details = (v: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined =>
    v && Object.keys(v).length ? v : undefined;

const capRef = (c: Capacity): SheetCapabilityRef => ({
    rank: num(c.rank),
    name: c.name,
    description: str(c.description),
    isSpell: c.isSpell || undefined,
    details: details(c.details),
});

/** Capacités d'une voie donnée : une capacité référence sa voie tantôt par IRI
 * (`/api/voies/123`), tantôt par identifiant brut (`voieId`) — même logique que
 * l'ancienne page RaceDetail.
 */
const capsOfVoie = (voieId: string, caps?: Capacity[]): SheetCapabilityRef[] | undefined => {
    const out = (caps ?? [])
        .filter(c => {
            const ref = c.voie || c.voieId;
            if (!ref) return false;
            return String(String(ref).split('/').pop()) === String(voieId);
        })
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map(capRef);
    return out.length ? out : undefined;
};

const refs = (voies?: Voie[], capacities?: Capacity[]): SheetVoieRef[] | undefined =>
    voies && voies.length
        ? voies.map(v => ({
            id: String(v.id),
            name: v.name,
            details: details(v.details),
            capabilities: capsOfVoie(String(v.id), capacities),
        }))
        : undefined;

/** Extrait caractéristiques COF2 numériques d'un Profile.stats, masquant les métadonnées.
 * Conserve 0 : c'est une valeur légitime de stat de départ (−2 à +5 en COF2).
 */
const profileStats = (stats: Record<string, unknown> | undefined): Record<string, number> | undefined => {
    if (!stats || typeof stats !== 'object') return undefined;
    const coafKeys = ['AGI', 'CON', 'FOR', 'PER', 'CHA', 'INT', 'VOL'];
    const out: Record<string, number> = {};
    for (const key of coafKeys) {
        const n = num((stats as Record<string, unknown>)[key]);
        if (n !== undefined) out[key] = n;
    }
    return Object.keys(out).length ? out : undefined;
};

export const raceToVM = (race: Race, voies?: Voie[], capacities?: Capacity[]): RaceSheetVM => ({
    name: race.name,
    description: str(race.description),
    image: str(race.image),
    modifiers: race.modifiers?.length
        ? race.modifiers.map(m => ({ stat: m.stat, value: m.value, options: m.options, description: m.description }))
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
    voies: refs(voies, capacities),
});

export const profileToVM = (p: Profile, voies?: Voie[]): ProfileSheetVM => ({
    name: p.name,
    description: str(p.description),
    image: str(p.imageUrl),
    family: typeof p.family === 'string' ? str(p.family) : str((p.family as { name?: string } | undefined)?.name),
    hitDie: str(p.hitDie),
    magicStat: str(p.magicStat),
    armorMaxDef: num(p.armorMaxDef),
    stats: profileStats(p.stats as Record<string, unknown> | undefined),
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
            .map(capRef)
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
