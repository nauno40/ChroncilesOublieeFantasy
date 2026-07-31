import type { Race, Profile, Voie, Capacity, Family } from '../../../types/normalized';
import type { RaceSheetVM, ProfileSheetVM, VoieSheetVM, CapaciteSheetVM, SheetVoieRef, SheetCapabilityRef, SheetLabelled, SheetFamily } from '../types';

/** Vide → undefined : une section sans contenu ne doit pas être rendue. */
const str = (v: unknown): string | undefined => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '' ? undefined : s;
};
const num = (v: unknown): number | undefined => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);
/** Vide/NULL → undefined : la majorité des capacités n'ont pas de `details`. */
const details = (v: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined =>
    v && Object.keys(v).length ? v : undefined;

const capRef = (c: Capacity): SheetCapabilityRef => ({
    id: str(c.id),
    rank: num(c.rank),
    name: c.name,
    description: str(c.description),
    isSpell: c.isSpell || undefined,
    limited: c.limited || undefined,
    active: c.active || undefined,
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

/** Intitulés des blocs de `Profile.masteries` — ordre et libellés de `ClassDetail.tsx:230-256`. */
const MASTERY_LABELS: Record<string, string> = {
    weapons: 'Armes',
    armors: 'Armures',
    shields: 'Boucliers',
    constraints: 'Contraintes',
};

/** `Profile.masteries` (objet weapons/armors/shields/constraints) → entrées libellées,
 * une par bloc renseigné, dans l'ordre où `ClassDetail.tsx` les rend. Un simple
 * `Object.values` perdrait l'intitulé et mélangerait armes et contraintes.
 */
const masteryList = (m: Profile['masteries']): SheetLabelled[] | undefined => {
    if (!m) return undefined;
    const out = Object.entries(MASTERY_LABELS)
        .map(([key, label]): SheetLabelled | undefined => {
            const value = str((m as Record<string, unknown>)[key]);
            return value !== undefined ? { label, value } : undefined;
        })
        .filter((e): e is SheetLabelled => e !== undefined);
    return out.length ? out : undefined;
};

/** Reprend telle quelle la logique de `ClassDetail.tsx` (`formatLoreKey`) : intitulé
 * lisible d'une clé de `Profile.lore` (ex. `terres_d_osgild` → `Terres d'Osgild`).
 */
const formatLoreKey = (key: string): string =>
    key
        .replace(/_/g, ' ')
        .replace(/\b([a-z])/, (match) => match.toUpperCase())
        .replace(/ D /g, " d'")
        .replace(/ L /g, " l'")
        .replace(/d osgild/i, "d'Osgild");

/** Valeur de `Profile.lore` → texte affichable. La valeur brute est tantôt une chaîne,
 * tantôt un tableau (`ClassDetail.tsx` les rend en liste à puces), tantôt un objet
 * imbriqué (rendu en sous-entrées clé/valeur) — jamais observé dans les fixtures
 * officielles à ce jour (une seule race a un tableau), mais géré pour ne rien perdre
 * si le compendium en ajoute. Aplati en texte multi-lignes (`SheetLabelled.value` est
 * une chaîne) ; la feuille l'affiche avec `whitespace-pre-line`.
 */
const loreValue = (v: unknown): string | undefined => {
    if (Array.isArray(v)) {
        const lines = v.map(x => String(x)).filter(Boolean);
        return lines.length ? lines.join('\n') : undefined;
    }
    if (v && typeof v === 'object') {
        const lines = Object.entries(v as Record<string, unknown>).map(([k, val]) => `${formatLoreKey(k)} : ${String(val)}`);
        return lines.length ? lines.join('\n') : undefined;
    }
    return str(v);
};

const loreList = (lore: Profile['lore']): SheetLabelled[] | undefined => {
    if (!lore) return undefined;
    const out = Object.entries(lore)
        .map(([key, v]): SheetLabelled | undefined => {
            const value = loreValue(v);
            return value !== undefined ? { label: formatLoreKey(key), value } : undefined;
        })
        .filter((e): e is SheetLabelled => e !== undefined);
    return out.length ? out : undefined;
};

/** « Famille des X » — sauf si `name` commence déjà par "Famille" (garde-fou anti-
 * répétition de `ClassDetail.tsx`). Exportée pour être réutilisée par `fromHomebrew.ts` :
 * le schéma communautaire ne capture qu'un nom de famille, mais ce nom doit rester
 * visible (sous-titre) même sans le reste de l'entité `Family`.
 */
export const familySubtitle = (name: string): string =>
    name.startsWith('Famille') ? name : `Famille des ${name}`;

/** `Profile.family` résolue (objet `Family`, pas l'IRI) → bloc famille du view-model. */
const familyRef = (f?: Family): SheetFamily | undefined => {
    if (!f?.name) return undefined;
    const luck = num(f.luckPoints);
    return {
        name: f.name,
        subtitle: familySubtitle(f.name),
        description: str(f.description),
        baseHp: num(f.baseHp),
        recoveryDie: str(f.recoveryDie),
        luckPoints: luck !== undefined && luck > 0 ? luck : undefined,
        manaStat: str(f.manaStat ?? undefined),
        bonus: str(f.specials ?? undefined),
    };
};

export const profileToVM = (p: Profile, voies?: Voie[], capacities?: Capacity[], family?: Family): ProfileSheetVM => ({
    name: p.name,
    description: str(p.description),
    image: str(p.imageUrl),
    family: familyRef(family ?? (typeof p.family === 'object' ? (p.family as Family) : undefined)),
    hitDie: str(p.hitDie),
    profileType: str(p.stats?.profileType),
    magicStat: str(p.magicStat),
    armorMaxDef: num(p.armorMaxDef),
    stats: profileStats(p.stats as Record<string, unknown> | undefined),
    startingEquipment: p.startingEquipment && p.startingEquipment.length ? p.startingEquipment : undefined,
    masteries: masteryList(p.masteries),
    weaponsAndArmor: p.masteries ? undefined : str(p.weaponsAndArmor),
    note: str(p.note),
    lore: loreList(p.lore),
    voies: refs(voies, capacities),
});

export const voieToVM = (v: Voie, caps?: Capacity[]): VoieSheetVM => ({
    name: v.name,
    description: str(v.description),
    category: str(v.type),
    details: details(v.details),
    capabilities: caps && caps.length
        ? [...caps]
            .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
            .map(capRef)
        : undefined,
});

export const capacityToVM = (c: Capacity, voieName?: string, voieId?: string): CapaciteSheetVM => ({
    name: c.name,
    description: str(c.description),
    rank: num(c.rank),
    isSpell: c.isSpell || undefined,
    limited: c.limited || undefined,
    active: c.active || undefined,
    details: details(c.details),
    voieName: str(voieName),
    voieId: str(voieId),
});
