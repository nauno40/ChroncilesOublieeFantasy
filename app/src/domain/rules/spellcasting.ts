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

// --- Concentration accrue et brûlure de mana (COF2, chapitre « Magie et sorts ») ---

/**
 * Le sort se lance-t-il par une action d'attaque ?
 *
 * Lecture du libellé servi par le compendium, qui note la lettre entre parenthèses :
 * « Action (A)* », « Action Limitée (L)* », « Action (A) ou (L)* »… Un sort qui PEUT être
 * lancé en action d'attaque est éligible, même s'il offre aussi une autre option.
 *
 * Les 82 sorts officiels sans type d'action déclaré renvoient `false` : faute
 * d'information, on ne devine pas une éligibilité qui vaut 2 PM.
 */
export const estActionAttaque = (actionType: string | undefined | null): boolean =>
    /\(A\)/.test(actionType ?? '');

/**
 * Coût d'un sort avec l'option de concentration accrue.
 *
 * « Lorsqu'il utilise un sort qui nécessite une action d'attaque (A) pour être lancé, le
 * personnage peut se concentrer plus longtemps pour réduire le coût du sort de 2 PM : le
 * sort devient une action limitée (L). » Les sorts en (L), (M) ou (G) n'y ont pas droit.
 *
 * Le livre ne dit pas ce qu'il advient d'un sort de rang 1 dont le coût tomberait sous
 * zéro : le coût est borné à 0, lecture minimale et sans invention.
 */
export const coutAvecConcentration = (rank: number | undefined, actionType: string | undefined | null): number => {
    const base = spellManaCost(rank);
    return estActionAttaque(actionType) ? Math.max(0, base - 2) : base;
};

export interface BrulureDeMana {
    /** Les dés de récupération jetés, un par point de mana. */
    des: number[];
    /** PV perdus au total. Aucune RD ne s'y applique. */
    pvPerdus: number;
}

/**
 * Brûlure de mana : sacrifier des PV pour lancer un sort sans points de mana.
 *
 * « Pour chaque PM dépensé, il subit des DM égaux à son dé de récupération (DR) […] Aucune
 * RD ne s'applique à cette perte de PV. » Le dé dépend du profil principal, pas de l'école
 * de magie : un guerrier-magicien brûle des d10.
 */
export const brulureDeMana = (pm: number, facesDeRecuperation: number, rng: () => number = Math.random): BrulureDeMana => {
    const des: number[] = [];
    for (let i = 0; i < Math.max(0, pm); i++) des.push(Math.floor(rng() * facesDeRecuperation) + 1);
    return { des, pvPerdus: des.reduce((total, d) => total + d, 0) };
};

/** « Il est impossible d'utiliser la brûlure de mana pour lancer un sort de soins. » */
export const brulurePossible = (estSortDeSoins: boolean): boolean => !estSortDeSoins;
