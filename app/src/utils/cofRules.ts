import type { CharacterVoieRef, VoieSource, MagicItem, ItemBonusTarget, Usage, UsagePeriod, Companion, CaracKey, ActiveState, Form, PlayState } from '../types/character';

export type Stats = {
  FOR: number; AGI: number; CON: number; INT: number; PER: number; CHA: number; VOL: number;
};

// --- Formes minimales des données de règles (compendium + voies d'un perso) ---
// Volontairement partielles : les données proviennent de l'API (typage souple) ; on ne
// décrit ici que les champs réellement lus par les calculs de règles. Les voies du perso
// sont désormais référencées par IRI (`CharacterVoieRef`) et résolues dans le compendium.
export interface CompendiumCapability {
  name?: string; rank?: number; description?: string; isSpell?: boolean;
  effect?: CapabilityEffect;
}
export interface CompendiumVoie { '@id'?: string; name?: string; capabilities?: CompendiumCapability[]; }
export interface CompendiumProfile { name?: string; voies?: CompendiumVoie[]; }
export interface CompendiumRace { availableVoies?: CompendiumVoie[]; }
export interface RaceModifier {
  type?: string; stat?: string | null; value: number; count?: number; options?: string[]; logic?: string;
}
export interface Protection { armor?: { def?: number }; shield?: { def?: number }; }

// COF2 : une caractéristique EST sa valeur de jeu (‑2 à +5). Contrairement à D&D, il n'y a
// ni score 3‑18 ni conversion : la valeur s'utilise directement partout (PV, DEF, Init, DR,
// PC, PM, attaques). Le « modificateur » d'une caractéristique est donc égal à sa valeur.
export const MIN_STAT = -2;
export const MAX_STAT = 5;

/** COF2 : la valeur de caractéristique est utilisée telle quelle (identité). */
export const calculateMod = (value: number): number => value;

// Séries de valeurs à répartir sur les 7 caractéristiques à la création (règles COF2,
// « Création du personnage » §4, « Valeur de base des caractéristiques »).
export const STAT_SERIES: Record<'polyvalent' | 'expert' | 'specialiste', number[]> = {
  polyvalent: [2, 2, 2, 1, 1, 0, -1],
  expert: [3, 2, 1, 1, 0, 0, -1],
  specialiste: [4, 2, 1, 0, 0, -1, -1],
};

// Migration des personnages créés avec l'ancien modèle « score D&D » : leurs `stats`
// étaient des scores (9‑14) et `modifiers` les valeurs COF. Si une stat dépasse la plage
// COF (> MAX_STAT), on considère le perso comme hérité et on réutilise ses `modifiers`
// (déjà les valeurs COF) comme nouvelles valeurs de caractéristiques.
export const migrateLegacyStats = (
  stats: Stats,
  modifiers?: Partial<Stats>,
): Stats => {
  const looksLegacy = Object.values(stats).some((v) => v > MAX_STAT);
  if (!looksLegacy || !modifiers) return stats;
  const out = { ...stats };
  (Object.keys(out) as (keyof Stats)[]).forEach((k) => {
    if (typeof modifiers[k] === 'number') out[k] = modifiers[k] as number;
  });
  return out;
};

export const PROFILE_FAMILIES: Record<string, { id: string; die: string; base: number }> = {
  Arquebusier: { id: 'aventuriers', die: 'd8', base: 2 },
  Barde: { id: 'aventuriers', die: 'd8', base: 2 },
  Rôdeur: { id: 'aventuriers', die: 'd8', base: 2 },
  Voleur: { id: 'aventuriers', die: 'd8', base: 2 },
  Barbare: { id: 'combattants', die: 'd10', base: 2 },
  Chevalier: { id: 'combattants', die: 'd10', base: 2 },
  Guerrier: { id: 'combattants', die: 'd10', base: 2 },
  Ensorceleur: { id: 'mages', die: 'd6', base: 2 },
  Forgesort: { id: 'mages', die: 'd6', base: 2 },
  Magicien: { id: 'mages', die: 'd6', base: 2 },
  Sorcier: { id: 'mages', die: 'd6', base: 2 },
  Druide: { id: 'mystiques', die: 'd8', base: 3 },
  Moine: { id: 'mystiques', die: 'd8', base: 3 },
  Prêtre: { id: 'mystiques', die: 'd8', base: 3 },
};

// DEF maximale de l'armure la plus lourde autorisée par les voies du profil (règles COF2,
// chapitres Profils + table « Armure »). Certaines capacités relèvent ces limites (barbare→
// chemise de mailles rang 2, guerrier→plaque rang 3, chevalier→plaque complète rang 3,
// prêtre d'une divinité guerrière→cotte de mailles) : géré au niveau des capacités, pas ici.
const ARMOR_CAP_BY_PROFILE: Record<string, number> = {
  // Aucune armure
  Magicien: 0, Ensorceleur: 0, Sorcier: 0, Moine: 0,
  // Cuir simple (+2)
  Forgesort: 2, Voleur: 2, Druide: 2,
  // Cuir renforcé (+3)
  Barde: 3, Rôdeur: 3, Barbare: 3,
  // Chemise de mailles (+4)
  Arquebusier: 4, Prêtre: 4,
  // Cotte de mailles (+5)
  Guerrier: 5,
  // Plaque (+6) ; plaque complète (+7) accessible via la capacité de rang 3 du chevalier
  Chevalier: 6,
};

export const getMaxArmorDef = (profileName: string): number =>
  ARMOR_CAP_BY_PROFILE[profileName] ?? 3;

export const computeModifiers = (stats: Stats): Stats => ({
  FOR: calculateMod(stats.FOR),
  AGI: calculateMod(stats.AGI),
  CON: calculateMod(stats.CON),
  INT: calculateMod(stats.INT),
  PER: calculateMod(stats.PER),
  CHA: calculateMod(stats.CHA),
  VOL: calculateMod(stats.VOL),
});

// Base de PV par famille (COF2) : aventuriers = 4, combattants = 5, mages = 3, mystiques = 4.
export const FAMILY_BASE_HP: Record<string, number> = {
  aventuriers: 4, combattants: 5, mages: 3, mystiques: 4,
};

// PV max cumulés par niveau (COF2, Progression) : baseHp × (niveau + 1) + CON × niveau.
// (Au niveau 1 : 2×baseHp + CON — la base est comptée une fois « en plus ».)
export const computeMaxHp = (baseHp: number, conMod: number, level = 1): number =>
  baseHp * (Math.max(1, level) + 1) + conMod * Math.max(1, level);

// PV max d'un personnage, hybride ou non (COF2 chap. 9). Le niveau 1 compte double et
// suit toujours le profil principal. Chaque niveau ≥ 2 rapporte la MOYENNE des PV de base
// des familles ayant financé ses capacités (annotation `hpByLevel` ; défaut = profil
// principal ; une capacité de voie de peuple compte comme la famille du profil principal).
// `Math.floor` reproduit l'arrondi alterné des demi-PV (deux demis consécutifs se soldent).
export const computeHybridMaxHp = (
  mainFamily: string,
  hpByLevel: Record<string, string[]> | undefined,
  conMod: number,
  level: number,
): number => {
  const lvl = Math.max(1, level);
  const basePV = (f: string): number => FAMILY_BASE_HP[f] ?? FAMILY_BASE_HP[mainFamily] ?? 0;
  let pvBase = 2 * basePV(mainFamily); // niveau 1 compte double
  for (let L = 2; L <= lvl; L++) {
    const fams = hpByLevel?.[String(L)];
    const list = fams && fams.length > 0 ? fams : [mainFamily];
    pvBase += list.reduce((s, f) => s + basePV(f), 0) / list.length;
  }
  return Math.floor(pvBase) + conMod * lvl;
};

export const computeRecoveryDie = (profileName: string | undefined, conMod: number): string => {
  if (!profileName) return '—';
  const family = PROFILE_FAMILIES[profileName];
  if (!family) return '—';
  let qty = family.base + conMod;
  if (qty < 0) qty = 0;
  return `${qty} ${family.die}`;
};

export const computeLuckPoints = (
  profileName: string | undefined,
  chaMod: number,
  // Voie de peuple résolue (nom + rang) — le rang 1 « Diversité » de la Voie de
  // l'humain accorde +1 PC. Le nom est résolu depuis le compendium par l'appelant.
  racialVoie?: { name?: string; rank?: number },
): number => {
  let pc = 2 + chaMod;
  if (pc < 1) pc = 0;
  if (profileName && PROFILE_FAMILIES[profileName]?.id === 'aventuriers') pc += 1;
  if (racialVoie && racialVoie.name === "Voie de l'humain" && (racialVoie.rank ?? 0) >= 1) pc += 1;
  return pc;
};

export const computeFinalStats = (
  baseStats: Stats,
  raceModifiers: RaceModifier[] | undefined,
  racialBonusChoices: Record<string, string>,
): Stats => {
  const base = { ...baseStats };
  if (!raceModifiers) return base;

  raceModifiers.forEach((mod, idx) => {
    if (mod.type === 'fixed' && mod.stat) {
      base[mod.stat as keyof Stats] = (base[mod.stat as keyof Stats] || 0) + mod.value;
    } else if (mod.type === 'choice' && mod.options) {
      const choice = racialBonusChoices[`bonus_${idx}`];
      if (choice && mod.options.includes(choice)) {
        base[choice as keyof Stats] = (base[choice as keyof Stats] || 0) + mod.value;
      }
    } else if ((mod.type === 'special' && mod.stat === 'Lowest') || (mod.type === 'logic' && mod.logic === 'add_to_lowest')) {
      const count = mod.count || 1;
      for (let i = 0; i < count; i++) {
        let choiceKey = `bonus_${idx}_${i}`;
        let choice = racialBonusChoices[choiceKey];
        if (!choice && i === 0) {
          choiceKey = `bonus_${idx}`;
          choice = racialBonusChoices[choiceKey];
        }
        if (choice) {
          base[choice as keyof Stats] = (base[choice as keyof Stats] || 0) + mod.value;
        }
      }
    }
  });
  return base;
};

// --- Progression : points de capacité, coûts et niveaux requis (COF2, chap. Progression) ---

// Niveau minimal requis pour acquérir une capacité d'un rang donné dans une voie normale.
// Rang 1→1, 2→2, 3→3, 4→5, 5→7 (les rangs 6-8 sont réservés aux voies de prestige).
export const RANK_REQUIRED_LEVEL: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 7, 6: 9, 7: 11, 8: 13 };
// Voies de prestige : les 5 rangs affichés (1..5) correspondent aux rangs réels 4..8.
export const PRESTIGE_RANK_REQUIRED_LEVEL: Record<number, number> = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 13 };

// Coût en points de capacité : 1 pour un rang 1-2, 2 pour un rang 3 ou plus.
export const capacityCost = (rank: number): number => (rank <= 2 ? 1 : 2);

// Budget total de points de capacité à un niveau : 2 par niveau. Le niveau 0 (création)
// équivaut au niveau 1. La capacité de rang 1 de la voie de peuple et la capacité de rang 2
// gratuite des mages ne sont pas décomptées (cf. computeSpentPoints).
export const capacityBudget = (level: number | undefined): number => 2 * Math.max(1, level || 0);

// Dé évolutif « d4° » (COF2, Progression) : d4 aux niveaux 1-5, d6 à 6-8, d8 à 9-11,
// d10 à 12-14, d12 à partir de 15. Beaucoup de capacités infligent des DM en d4°.
export const evolutiveDie = (level: number | undefined): string => {
  const l = Math.max(1, level || 1);
  if (l >= 15) return 'd12';
  if (l >= 12) return 'd10';
  if (l >= 9) return 'd8';
  if (l >= 6) return 'd6';
  return 'd4';
};

// --- Interpréteur d'effets de capacité (spec §6.1/§6.2) ---
// Structure `effect` taguée décrivant un dé évolutif et/ou des bonus à cible
// (DM, init, def, PVmax, RD), chacun pouvant scaler à valeur fixe, par rang, ou
// par caractéristique. `resolveCapabilityEffect` est une fonction pure qui
// résout ces règles au niveau/rang courant du personnage.
export type BonusTarget = 'DM' | 'init' | 'def' | 'PVmax' | 'RD';
export interface CapabilityBonus {
  target: BonusTarget;
  scalesWith: 'fixed' | 'rank' | 'carac';
  value?: number;        // scalesWith 'fixed'
  perRank?: number;      // scalesWith 'rank'
  carac?: keyof Stats;   // scalesWith 'carac'
}
export interface CapabilityEffect {
  evolutiveDie?: { count: number };
  bonuses?: CapabilityBonus[];
}
export interface ResolvedEffect {
  dice?: string;
  bonuses: Partial<Record<BonusTarget, number>>;
  // Traçabilité des bonus liés à une carac, pour la déduplication non-cumul (§6.2).
  caracTargets?: { target: BonusTarget; carac: keyof Stats; value: number }[];
}

// Résout un effet structuré au niveau/rang courant (spec §6.2). Fonction pure.
export const resolveCapabilityEffect = (
  effect: CapabilityEffect | undefined,
  ctx: { level: number; rank: number; caracs: Stats },
): ResolvedEffect => {
  const out: ResolvedEffect = { bonuses: {} };
  if (!effect) return out;

  if (effect.evolutiveDie) {
    out.dice = `${effect.evolutiveDie.count}${evolutiveDie(ctx.level)}`;
  }
  const caracTargets: NonNullable<ResolvedEffect['caracTargets']> = [];
  (effect.bonuses ?? []).forEach((b) => {
    let val = 0;
    if (b.scalesWith === 'fixed') val = b.value ?? 0;
    else if (b.scalesWith === 'rank') val = (b.perRank ?? 0) * ctx.rank;
    else if (b.scalesWith === 'carac' && b.carac) {
      val = ctx.caracs[b.carac];
      caracTargets.push({ target: b.target, carac: b.carac, value: val });
    }
    out.bonuses[b.target] = (out.bonuses[b.target] ?? 0) + val;
  });
  if (caracTargets.length) out.caracTargets = caracTargets;
  return out;
};

// Agrège plusieurs effets résolus en appliquant le non-cumul (§6.2) : un même
// couple (cible, caractéristique) n'est compté qu'une fois (on garde la valeur).
export const aggregateResolvedBonuses = (
  resolved: ResolvedEffect[],
): Partial<Record<BonusTarget, number>> => {
  const seenCarac = new Set<string>();
  const agg: Partial<Record<BonusTarget, number>> = {};

  resolved.forEach((r) => {
    const caracByTarget = new Map<BonusTarget, number>();
    (r.caracTargets ?? []).forEach((ct) => {
      const key = `${ct.target}:${ct.carac}`;
      if (seenCarac.has(key)) {
        // déjà appliqué par une autre capacité → retirer ce doublon du total de r
        caracByTarget.set(ct.target, (caracByTarget.get(ct.target) ?? 0) + ct.value);
      } else {
        seenCarac.add(key);
      }
    });
    (Object.keys(r.bonuses) as BonusTarget[]).forEach((t) => {
      const dup = caracByTarget.get(t) ?? 0;
      agg[t] = (agg[t] ?? 0) + (r.bonuses[t] ?? 0) - dup;
    });
  });
  return agg;
};

export type VoieKind = 'racial' | 'profile' | 'prestige';

// Traduit la `source` d'une voie de personnage (modèle Phase 2) vers le `VoieKind`
// utilisé par les règles de coût/verrou. profil et hybride partagent les mêmes règles.
export const voieKindOf = (source: VoieSource): VoieKind =>
  source === 'peuple' ? 'racial' : source === 'prestige' ? 'prestige' : 'profile';

// Niveau à partir duquel un rang devient accessible (verrou structurel, hors budget).
// Tient compte de l'exception mage (rang 2 dès le niveau 1).
export const rankUnlockLevel = (rank: number, voieKind: VoieKind, isMageFamily: boolean): number => {
  if (voieKind === 'prestige') return PRESTIGE_RANK_REQUIRED_LEVEL[rank] ?? 99;
  if (rank === 2 && isMageFamily) return 1;
  return RANK_REQUIRED_LEVEL[rank] ?? 99;
};
export type AcquireResult = { ok: true } | { ok: false; reason: string };

export interface AcquireContext {
  level: number | undefined;
  isMageFamily: boolean;
  spentPoints: number;
  budget: number;
  hasOtherRank2: boolean; // un rang 2 est-il déjà pris dans une autre voie (bonus mage) ?
}

// Coût d'une capacité selon la voie (rang 1 de peuple gratuit ; prestige = rang réel ≥ 4).
export const rankCost = (rank: number, voieKind: VoieKind): number => {
  if (voieKind === 'racial' && rank === 1) return 0;
  if (voieKind === 'prestige') return 2;
  return capacityCost(rank);
};

// Valide l'acquisition d'un rang : prérequis de rang, niveau minimal, puis budget.
export const canAcquireRank = (
  rank: number,
  prevRankOwned: boolean,
  voieKind: VoieKind,
  ctx: AcquireContext,
): AcquireResult => {
  if (rank > 1 && !prevRankOwned) return { ok: false, reason: 'Vous devez posséder le rang précédent.' };

  const effLevel = Math.max(1, ctx.level || 0);
  const prestige = voieKind === 'prestige';
  const actualRank = prestige ? rank + 3 : rank;
  // Exception mage : la capacité de rang 2 bonus est accessible dès le niveau 1.
  const mageRank2 = !prestige && rank === 2 && ctx.isMageFamily;
  const reqLevel = prestige ? PRESTIGE_RANK_REQUIRED_LEVEL[rank] : RANK_REQUIRED_LEVEL[rank];
  if (!mageRank2 && effLevel < (reqLevel ?? 99)) {
    return { ok: false, reason: `Niveau ${reqLevel} requis pour une capacité de rang ${actualRank}.` };
  }

  // La capacité de rang 2 gratuite des mages ne coûte rien (une seule fois).
  const cost = mageRank2 && !ctx.hasOtherRank2 ? 0 : rankCost(rank, voieKind);
  if (ctx.spentPoints + cost > ctx.budget) {
    return { ok: false, reason: 'Plus assez de points de capacité pour ce niveau.' };
  }
  return { ok: true };
};

// Total des points de capacité dépensés, tous niveaux confondus : somme des coûts de
// chaque rang acquis, hors rang 1 gratuit de la voie de peuple et hors rang 2 gratuit
// des mages (une seule fois).
export const computeSpentPoints = (
  voies: CharacterVoieRef[] | undefined,
  _level: number | undefined,
  isMageFamily: boolean,
): number => {
  let spent = 0;
  let mageFreeRank2Used = false;

  (voies ?? []).forEach((v) => {
    const voieKind = voieKindOf(v.source);
    for (let rank = 1; rank <= (v.rank || 0); rank++) {
      if (voieKind !== 'prestige' && rank === 2 && isMageFamily && !mageFreeRank2Used) {
        mageFreeRank2Used = true; // rang 2 gratuit du mage (une seule fois)
        continue;
      }
      spent += rankCost(rank, voieKind);
    }
  });
  return spent;
};

// PM = VOL + nombre de sorts connus (COF2, Magie et sorts). Le rang 4 « Perception
// héroïque » des voies druide/ensorceleur ajoute en plus la PER (d'où `perMod`).
export const computeManaPoints = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  volMod: number,
  perMod = 0,
): number => {
  // Résolution des voies du perso par IRI dans le compendium (peuple + profil).
  const byIri = new Map<string, CompendiumVoie>();
  for (const race of races) for (const v of race.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const profile of profiles) for (const v of profile.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);

  // Voies des profils druide/ensorceleur dont le rang 4 « Perception héroïque » ajoute la PER aux PM.
  const perManaIris = new Set<string>();
  for (const profile of profiles) {
    if (profile.name === 'Druide' || profile.name === 'Ensorceleur') {
      profile.voies?.forEach(v => v['@id'] && perManaIris.add(v['@id']));
    }
  }

  let spellCount = 0;
  let perBonus = false;
  (voies ?? []).forEach(entry => {
    // Parité : la magie de peuple/profil compte, pas les voies de prestige.
    if (entry.source === 'prestige') return;
    const v = byIri.get(entry.voie);
    if (!v) return;
    (v.capabilities ?? []).forEach(c => {
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank && c.isSpell) spellCount++;
    });
    if (entry.rank >= 4 && perManaIris.has(entry.voie)) {
      const r4 = (v.capabilities ?? []).find(c => c.rank === 4);
      if (/perception h[ée]ro[ïi]que/i.test(r4?.name || '')) perBonus = true;
    }
  });

  if (spellCount === 0) return 0;
  return volMod + spellCount + (perBonus ? perMod : 0);
};

export const computeCombatStats = (args: {
  voies: CharacterVoieRef[] | undefined;
  protection: Protection | undefined;
  races: CompendiumRace[];
  profiles: CompendiumProfile[];
  perMod: number;
  agiMod: number;
  capabilityModifiers: Record<string, (rank: number) => { init?: number; def?: number }>;
}): { init: number; def: number } => {
  const { voies, protection, races, profiles, perMod, agiMod, capabilityModifiers } = args;
  let init = 10 + perMod;
  let def = 10 + agiMod + (protection?.armor?.def || 0) + (protection?.shield?.def || 0);

  // Résolution des voies du perso par IRI dans le compendium (peuple + profil).
  const byIri = new Map<string, CompendiumVoie>();
  for (const race of races) for (const v of race.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const profile of profiles) for (const v of profile.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);

  (voies ?? []).forEach(entry => {
    const v = byIri.get(entry.voie);
    if (!v) return;
    for (let rank = 1; rank <= entry.rank; rank++) {
      const cap = (v.capabilities ?? []).find(c => c.rank === rank);
      if (cap?.name && capabilityModifiers[cap.name]) {
        const bonus = capabilityModifiers[cap.name](rank);
        if (bonus.init) init += bonus.init;
        if (bonus.def) def += bonus.def;
      }
    }
  });

  return { init, def };
};

// Valeur d'attaque COF2 : niveau (plafonné à 10) + caractéristique d'attaque
// (FOR au contact, AGI à distance, VOL/carac de magie en magie).
export const attackValue = (caracMod: number, level: number): number =>
  Math.min(Math.max(0, level), 10) + caracMod;

// Langues (COF2, création) : +1 emplacement de langue par point positif d'INT ;
// personnage illettré si INT < 0. Les langues elles-mêmes sont choisies (playState).
export const computeLanguageSlots = (intMod: number): { slots: number; illiterate: boolean } => ({
  slots: Math.max(0, intMod),
  illiterate: intMod < 0,
});

// Compteur d'emplacements langues/talents (COF2 §Talent secondaire) : « Commun » est
// gratuit (base 1) ; chaque langue supplémentaire et chaque talent secondaire consomme
// un emplacement du budget partagé dérivé de l'INT. Indicatif — jamais bloquant.
export const computeLanguageUsage = (
  languages: string[] | undefined,
  talents: string[] | undefined,
  intMod: number,
): { used: number; available: number; illiterate: boolean } => {
  const { slots, illiterate } = computeLanguageSlots(intMod);
  return {
    used: Math.max(0, (languages?.length ?? 0) - 1) + (talents?.length ?? 0),
    available: slots,
    illiterate,
  };
};

// Réduction de dommages (RD) : somme des bonus fixes target 'RD' des capacités
// acquises (rang ≤ rang de la voie). Les RD conditionnels restent en prose (§5).
export const computeDamageReduction = (
  voies: CharacterVoieRef[],
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
  caracs: Stats,
  level: number,
): number => {
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  const resolved: ResolvedEffect[] = [];
  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank && c.effect) {
        resolved.push(resolveCapabilityEffect(c.effect, { level, rank: entry.rank, caracs }));
      }
    });
  });
  return aggregateResolvedBonuses(resolved).RD ?? 0;
};

// Somme les bonus des objets magiques ÉQUIPÉS par cible (piloté joueur, jamais persisté).
export const computeItemBonuses = (
  items: MagicItem[] | undefined,
): Record<ItemBonusTarget, number> => {
  const acc: Record<ItemBonusTarget, number> = { def: 0, init: 0, pv: 0, rd: 0, attaque: 0, dm: 0 };
  (items ?? []).forEach(it => {
    if (it.equipped && it.target in acc) acc[it.target] += it.value || 0;
  });
  return acc;
};

// Somme les bonus des états ACTIFS par cible (piloté joueur, jamais persisté).
export const computeActiveStateBonuses = (
  states: ActiveState[] | undefined,
): Record<ItemBonusTarget, number> => {
  const acc: Record<ItemBonusTarget, number> = { def: 0, init: 0, pv: 0, rd: 0, attaque: 0, dm: 0 };
  (states ?? []).forEach(s => { if (s.active && s.target in acc) acc[s.target] += s.value || 0; });
  return acc;
};

// (Dés)active un état ; en activant un état d'un `group`, désactive les autres du même groupe.
export const activateState = (
  states: ActiveState[] | undefined,
  idx: number,
  active: boolean,
): ActiveState[] => {
  const list = states ?? [];
  const grp = list[idx]?.group;
  return list.map((s, i) => {
    if (i === idx) return { ...s, active };
    if (active && grp && s.group === grp) return { ...s, active: false }; // exclusion de groupe
    return s;
  });
};

// Remet `used` à 0 pour les usages dont la période figure dans `periods` (repos/reset).
// Pur : renvoie une nouvelle liste, ne mute pas l'entrée d'origine.
export const resetUsages = (
  usages: Usage[] | undefined,
  periods: UsagePeriod[],
): Usage[] => (usages ?? []).map(u => (periods.includes(u.per) ? { ...u, used: 0 } : u));

// Pré-remplit un compagnon depuis une créature du bestiaire (nom, PV, DEF, Init, IRI).
export const companionFromCreature = (
  c: { id?: number; name?: string; hp?: number; def?: number; init?: number },
): Companion => ({
  name: c.name ?? '',
  ref: c.id != null ? `/api/creatures/${c.id}` : undefined,
  hp: { current: c.hp ?? 0, max: c.hp ?? 0 },
  def: c.def ?? 0,
  init: c.init ?? 0,
});

// Pré-remplit une forme depuis une créature du bestiaire (réutilise companionFromCreature).
export const formFromCreature = (
  c: { id?: number; name?: string; hp?: number; def?: number; init?: number },
): Form => ({ ...companionFromCreature(c), active: false });

// (Dés)active une forme ; en activer une désactive toutes les autres (exclusivité globale).
export const activateForm = (
  forms: Form[] | undefined,
  idx: number,
  active: boolean,
): Form[] =>
  (forms ?? []).map((f, i) => (i === idx ? { ...f, active } : active ? { ...f, active: false } : f));

// Résout la caractéristique d'une attaque : substitution du joueur, sinon défaut COF2.
export const attackCarac = (
  target: 'contact' | 'distance',
  subs: { contact?: CaracKey; distance?: CaracKey } | undefined,
  defaultCarac: CaracKey,
): CaracKey => subs?.[target] ?? defaultCarac;

// Nombre de dés de récupération (DR) et faces du dé, dérivés du profil (COF2).
export const recoveryDice = (
  profileName: string | undefined,
  conMod: number,
): { total: number; sides: number } => {
  const family = profileName ? PROFILE_FAMILIES[profileName] : undefined;
  if (!family) return { total: 0, sides: 0 };
  return { total: Math.max(0, family.base + conMod), sides: parseInt(family.die.slice(1), 10) || 0 };
};

// Soin d'un repos court : dé de récup. lancé + ½ niveau (arrondi inférieur).
export const shortRestHeal = (dieRoll: number, level: number): number =>
  dieRoll + Math.floor((level || 0) / 2);

// Applique un repos court : soigne (plafonné maxHp), dépense 1 DR (plafonné total),
// réinitialise les usages combat/round. Pur.
export const applyShortRest = (
  ps: PlayState,
  opts: { heal: number; maxHp: number; drTotal: number },
): PlayState => ({
  ...ps,
  hp: { ...ps.hp, current: Math.min(opts.maxHp, ps.hp.current + opts.heal) },
  recovery: { ...ps.recovery, used: Math.min(opts.drTotal, (ps.recovery.used || 0) + 1) },
  usages: resetUsages(ps.usages, ['combat', 'round']),
});

// Applique un repos long : PV & PM au max, DR régénérés, usages jour/combat/round reset. Pur.
export const applyLongRest = (
  ps: PlayState,
  opts: { maxHp: number; maxMana: number },
): PlayState => ({
  ...ps,
  hp: { ...ps.hp, current: opts.maxHp },
  mana: { ...ps.mana, current: opts.maxMana },
  recovery: { ...ps.recovery, used: 0 },
  usages: resetUsages(ps.usages, ['jour', 'combat', 'round']),
});
