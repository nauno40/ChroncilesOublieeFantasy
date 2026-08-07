import type { CharacterVoieRef } from '../../types/character';
import type { CompendiumCapability, CompendiumProfile } from './types';
import { isCapabilityGrantedByEntry } from './progression';

// --- Armure et capacités : ce qu'elle bride, ce qu'elle coûte (COF2, chap. 9 « Profils hybrides ») ---
//
// Une capacité garde TOUJOURS la restriction d'armure du profil dont elle est issue, même
// chez un personnage qui a le droit de porter plus lourd : « pas d'armure pour l'usage d'une
// capacité de moine, armure de cuir maximum pour une capacité de voleur ». Porter l'armure
// reste possible — c'est l'usage de la capacité qui tombe.
//
// Les SORTS font exception : ils restent lançables en armure trop lourde, au prix de points
// de mana supplémentaires (§ Magie et sorts du même chapitre).

/** Profil dont les sorts se lancent en n'importe quelle armure, sans surcoût (COF2 chap. 9). */
const PROFIL_SANS_SURCOUT = 'pretre';

const normaliser = (s: string): string =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** DEF d'armure autorisée par un profil. `-1` (aucune armure) et l'absence de valeur valent 0. */
export const profileAllowedDef = (armorMaxDef: number | null | undefined): number =>
    Math.max(0, armorMaxDef ?? 0);

/**
 * Surcoût en PM pour lancer un sort de ce profil avec l'armure portée.
 * « Le nombre de PM supplémentaires est égal au bonus de DEF de l'armure portée » — et pour
 * les profils qui autorisent déjà une armure (forgesort, druide, barde), seulement la
 * différence avec leur maximum. Une même soustraction couvre les deux cas : le maximum des
 * autres profils lanceurs vaut 0. Les sorts de prêtre ne coûtent jamais de supplément.
 * Le bonus magique d'une armure enchantée est explicitement hors du calcul : l'appelant
 * passe la DEF de base.
 */
export const manaSurcharge = (wornArmorDef: number, allowedDef: number, profileName: string): number => {
    if (normaliser(profileName) === PROFIL_SANS_SURCOUT) return 0;
    return Math.max(0, wornArmorDef - allowedDef);
};

/** Coût de base d'un sort en PM : son rang (COF2, Magie et sorts). */
export const spellManaCost = (rank: number | undefined): number => Math.max(0, rank ?? 0);

export interface SpellArmorCost {
    name: string;
    rank: number;
    /** Coût nominal du sort, en PM. */
    base: number;
    /** Coût réel sous l'armure portée : `base + surcharge` du profil. */
    total: number;
}

export interface ProfileArmorImpact {
    profileName: string;
    /** Plafond effectif du profil : sa limite, relevée par les capacités acquises qui l'ouvrent. */
    allowedDef: number;
    /** Supplément en PM dû à l'armure portée. Propriété du profil, pas du sort : identique
     *  pour tous ses sorts, d'où sa place ici plutôt que répétée sur chaque ligne. */
    surcharge: number;
    /** Capacités acquises (hors sorts) inutilisables tant que cette armure est portée. */
    blocked: string[];
    /** Sorts acquis dont le coût change à cause de l'armure. */
    spells: SpellArmorCost[];
}

/**
 * Ce que l'armure portée change, profil par profil : les capacités qu'elle bride et les
 * sorts qu'elle renchérit. Ne renvoie que les profils réellement touchés — un personnage
 * mono-profil dans son armure habituelle obtient une liste vide.
 *
 * Le plafond retenu pour un profil est sa limite relevée par ses PROPRES capacités acquises
 * (barbare rang 2, guerrier rang 3…) : une capacité de guerrier n'ouvre rien à un sort de
 * magicien.
 */
export const armorImpacts = (
    voies: CharacterVoieRef[] | undefined,
    profiles: CompendiumProfile[],
    wornArmorDef: number,
): ProfileArmorImpact[] => {
    if (wornArmorDef <= 0) return [];

    // Capacités acquises, regroupées par profil d'origine. Une voie de peuple ou de prestige
    // ne relève d'aucun profil : le livre ne lui associe aucune limite d'armure, on ne peut
    // donc rien en déduire — elle est ignorée plutôt que devinée.
    const parProfil = new Map<string, { profile: CompendiumProfile; caps: CompendiumCapability[] }>();

    (voies ?? []).forEach((entry) => {
        const profile = profiles.find(p => (p.voies ?? []).some(v => v['@id'] === entry.voie));
        if (!profile?.name) return;
        const voie = (profile.voies ?? []).find(v => v['@id'] === entry.voie);
        const acquises = (voie?.capabilities ?? []).filter(c => isCapabilityGrantedByEntry(c.rank, entry));
        if (acquises.length === 0) return;
        const bucket = parProfil.get(profile.name) ?? { profile, caps: [] };
        bucket.caps.push(...acquises);
        parProfil.set(profile.name, bucket);
    });

    const impacts: ProfileArmorImpact[] = [];
    parProfil.forEach(({ profile, caps }, profileName) => {
        const allowedDef = caps.reduce(
            (cap, c) => Math.max(cap, c.effect?.armorCap ?? 0),
            profileAllowedDef(profile.armorMaxDef),
        );
        if (wornArmorDef <= allowedDef) return;

        const surcharge = manaSurcharge(wornArmorDef, allowedDef, profileName);
        const blocked = caps.filter(c => !c.isSpell).map(c => c.name ?? '').filter(Boolean);
        const spells: SpellArmorCost[] = surcharge === 0 ? [] : caps
            .filter(c => c.isSpell)
            .map((c) => {
                const base = spellManaCost(c.rank);
                return { name: c.name ?? '', rank: c.rank ?? 0, base, total: base + surcharge };
            });

        if (blocked.length === 0 && spells.length === 0) return;
        impacts.push({ profileName, allowedDef, surcharge, blocked, spells });
    });
    return impacts;
};
