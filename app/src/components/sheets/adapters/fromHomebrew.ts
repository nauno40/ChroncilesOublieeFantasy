import type { HomebrewEntry } from '../../../services/homebrewService';
import type { RaceSheetVM, ProfileSheetVM, VoieSheetVM, CapaciteSheetVM, SheetModifier, SheetLabelled } from '../types';
import { familySubtitle } from './fromOfficial';
import { str, num } from './shared';

/**
 * Projection de `entry.data` (JSON libre, clés définies par services/homebrewSchemas.ts)
 * vers les view-models. Toute valeur vide devient `undefined` pour que la feuille
 * masque la section correspondante.
 */
const d = (e: HomebrewEntry): Record<string, unknown> => (e.data ?? {}) as Record<string, unknown>;

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

/** Convertit un bloc de caractéristiques en liste de SheetModifier (pour race homebrew).
 * Un modificateur de race ne peut pas valoir 0 : on écarte les 0.
 */
const toModifierList = (c?: Record<string, number>): SheetModifier[] | undefined => {
    if (!c) return undefined;
    const out = Object.entries(c).map(([stat, value]) => ({ stat, value }));
    return out.length ? out : undefined;
};

/** Extrait caractéristiques numériques d'un bloc (pour stats de classe homebrew).
 * Conserve 0 : c'est une valeur légitime de stat de départ (−2 à +5 en COF2).
 */
const caracsForStats = (v: unknown): Record<string, number> | undefined => {
    if (!v || typeof v !== 'object') return undefined;
    const out: Record<string, number> = {};
    for (const [k, raw] of Object.entries(v as Record<string, unknown>)) {
        const n = num(raw);
        if (n !== undefined) out[k] = n;
    }
    return Object.keys(out).length ? out : undefined;
};

export const homebrewToRaceVM = (e: HomebrewEntry): RaceSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        image: str(data.image),
        modifiers: toModifierList(caracs(data.modifiers)),
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

/** Le schéma homebrew capture maîtrises et lore en simples lignes libres (`type: 'lines'`),
 * sans intitulé par entrée (contrairement à l'officiel : objet weapons/armors/shields/
 * constraints pour les maîtrises, objet clé/valeur pour le lore — cf. fromOfficial.ts).
 * Chaque ligne devient une entrée sans label plutôt qu'un `string[]` à plat, pour rester
 * compatible avec le rendu par entrées de `ProfileSheet` sans perdre le découpage en blocs.
 */
const unlabelled = (v: unknown): SheetLabelled[] | undefined => {
    const lines = list(v);
    return lines?.map(value => ({ label: '', value }));
};

/** Projette les lignes d'un champ homebrew (`weaponsAuth`/`armorAuth`) en une entrée
 * libellée unique, avec l'intitulé que l'officiel utilise pour le même concept
 * (`masteries.weapons` → "Armes", `masteries.armors` → "Armures" — cf. `MASTERY_LABELS`
 * dans `fromOfficial.ts`). Pas de carte séparée : une carte supplémentaire côté
 * communautaire casserait l'iso officiel/communautaire (seul écart autorisé, le
 * bandeau propriétaire) — ces champs rejoignent donc la carte "Maîtrises" existante.
 */
const labelledLines = (label: string, v: unknown): SheetLabelled | undefined => {
    const lines = list(v);
    return lines?.length ? { label, value: lines.join(', ') } : undefined;
};

export const homebrewToProfileVM = (e: HomebrewEntry): ProfileSheetVM => {
    const data = d(e);
    const familyName = str(data.family);
    const masteries = [
        labelledLines('Armes', data.weaponsAuth),
        labelledLines('Armures', data.armorAuth),
        ...(unlabelled(data.masteries) ?? []),
    ].filter((m): m is SheetLabelled => m !== undefined);
    return {
        name: e.name,
        description: str(e.description),
        image: str(data.image),
        // Le schéma communautaire ne capture qu'un nom de famille (ni description, ni
        // bonus) : le sous-titre reste calculé pour ne pas rendre ce nom invisible
        // (cf. fromOfficial.ts:familySubtitle, même garde-fou anti-répétition).
        family: familyName ? { name: familyName, subtitle: familySubtitle(familyName) } : undefined,
        magicStat: str(data.magicStat),
        armorMaxDef: num(data.armorMaxDef),
        stats: caracsForStats(data.stats),
        startingEquipment: list(data.startingEquipment),
        masteries: masteries.length ? masteries : undefined,
        note: str(data.note),
        lore: unlabelled(data.lore),
    };
};

/** Regroupe les lignes libres « mécaniques de la voie » (schéma communautaire
 * `details`, type 'lines') sous une entrée `mecaniques_*` consommée par
 * `DynamicDetailsRenderer` — même convention que l'officiel (ex.
 * `Profils/Voleur.json:mecaniques_specifiques`). Sans intitulé propre par ligne côté
 * saisie libre (contrairement au JSON officiel, où chaque clé est un nom de mécanique),
 * chaque ligne prend son index comme clé au rendu.
 */
const voieMechanics = (v: unknown): Record<string, unknown> | undefined => {
    const lines = list(v);
    return lines ? { mecaniques_voie: lines } : undefined;
};

export const homebrewToVoieVM = (e: HomebrewEntry, children?: HomebrewEntry[]): VoieSheetVM => {
    const data = d(e);
    return {
        name: e.name,
        description: str(e.description),
        category: str(data.category),
        maxRank: num(data.maxRank),
        // Mécaniques propres de la voie (pas liées à une capacité précise) : `details`
        // retrouve son rôle propre — celui du `Voie.details` officiel, rendu par
        // DynamicDetailsRenderer — et cesse d'être transformé en pseudo-capacités.
        details: voieMechanics(data.details),
        // Capacités réelles de la voie : des entrées à part entière portant un
        // `parent` (cf. HomebrewChild/ChildDraft), plus des lignes de texte libre.
        // Projetées avec la même fonction qu'une capacité autonome
        // (`homebrewToCapaciteVM`), jamais réécrite ici ; triées par rang croissant,
        // comme `voieToVM` (adaptateur officiel).
        capabilities: children?.length
            ? [...children]
                .sort((a, b) => (num(d(a).rank) ?? 0) - (num(d(b).rank) ?? 0))
                .map(homebrewToCapaciteVM)
            : undefined,
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
        // Schéma homebrew : lignes libres (type 'lines'), forme différente du `details`
        // officiel (objet JSON, cf. fromOfficial.ts) — la fiche rend les deux sans tester
        // la provenance.
        detailLines: list(data.details),
    };
};
