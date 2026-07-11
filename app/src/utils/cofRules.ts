export type Stats = {
  FOR: number; AGI: number; CON: number; INT: number; PER: number; CHA: number; VOL: number;
};

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

export const computeMaxHp = (baseHp: number, conMod: number): number => baseHp * 2 + conMod;

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
  racialVoie?: { name?: string; ranks?: boolean[] },
): number => {
  let pc = 2 + chaMod;
  if (pc < 1) pc = 0;
  if (profileName && PROFILE_FAMILIES[profileName]?.id === 'aventuriers') pc += 1;
  if (racialVoie && racialVoie.name === "Voie de l'humain" && racialVoie.ranks?.[0]) pc += 1;
  return pc;
};

export const computeFinalStats = (
  baseStats: Stats,
  raceModifiers: any[] | undefined,
  racialBonusChoices: Record<string, string>,
): Stats => {
  const base = { ...baseStats };
  if (!raceModifiers) return base;

  raceModifiers.forEach((mod: any, idx: number) => {
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

export type VoieKind = 'racial' | 'profile' | 'prestige';

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
export const computeSpentPoints = (voies: any, _level: number | undefined, isMageFamily: boolean): number => {
  let spent = 0;
  let mageFreeRank2Used = false;

  const addVoie = (ranks: boolean[] | undefined, voieKind: VoieKind): void => {
    ranks?.forEach((learned: boolean, idx: number) => {
      if (!learned) return;
      const rank = idx + 1;
      if (voieKind !== 'prestige' && rank === 2 && isMageFamily && !mageFreeRank2Used) {
        mageFreeRank2Used = true; // rang 2 gratuit du mage
        return;
      }
      spent += rankCost(rank, voieKind);
    });
  };

  addVoie(voies?.racial?.ranks, 'racial');
  voies?.profile?.forEach((p: { ranks?: boolean[] }) => addVoie(p?.ranks, 'profile'));
  voies?.prestige?.forEach((p: { ranks?: boolean[] }) => addVoie(p?.ranks, 'prestige'));
  return spent;
};

export const computeManaPoints = (voies: any, races: any[], profiles: any[], volMod: number): number => {
  const isSpell = (voieName: string, rank: number): boolean => {
    for (const race of races) {
      const v = race.availableVoies?.find((x: any) => x.name === voieName);
      const cap = v?.capabilities?.find((c: any) => c.rank === rank);
      if (cap?.isSpell) return true;
    }
    for (const profile of profiles) {
      const v = profile.voies?.find((x: any) => x.name === voieName);
      const cap = v?.capabilities?.find((c: any) => c.rank === rank);
      if (cap?.isSpell) return true;
    }
    return false;
  };

  let spellCount = 0;
  if (voies?.racial) {
    voies.racial.ranks?.forEach((learned: boolean, idx: number) => {
      if (learned && isSpell(voies.racial.name || '', idx + 1)) spellCount++;
    });
  }
  voies?.profile?.forEach((v: any) => {
    v.ranks?.forEach((learned: boolean, idx: number) => {
      if (learned && isSpell(v.name, idx + 1)) spellCount++;
    });
  });

  return spellCount > 0 ? volMod + spellCount : 0;
};

export const computeCombatStats = (args: {
  voies: any;
  protection: any;
  races: any[];
  profiles: any[];
  perMod: number;
  agiMod: number;
  capabilityModifiers: Record<string, (rank: number) => { init?: number; def?: number }>;
}): { init: number; def: number } => {
  const { voies, protection, races, profiles, perMod, agiMod, capabilityModifiers } = args;
  let init = 10 + perMod;
  let def = 10 + agiMod + (protection?.armor?.def || 0) + (protection?.shield?.def || 0);

  const applyBonus = (voieName: string, subRanks: boolean[]) => {
    if (!voieName) return;
    subRanks.forEach((learned, idx) => {
      if (!learned) return;
      const rank = idx + 1;
      let capName = '';
      const race = races.find((r: any) => r.availableVoies?.some((v: any) => v.name === voieName));
      if (race) {
        const v = race.availableVoies.find((v: any) => v.name === voieName);
        const c = v?.capabilities?.find((c: any) => c.rank === rank);
        if (c) capName = c.name;
      }
      if (!capName) {
        const profile = profiles.find((p: any) => p.voies?.some((v: any) => v.name === voieName));
        if (profile) {
          const v = profile.voies.find((v: any) => v.name === voieName);
          const c = v?.capabilities?.find((c: any) => c.rank === rank);
          if (c) capName = c.name;
        }
      }
      if (capName && capabilityModifiers[capName]) {
        const bonus = capabilityModifiers[capName](rank);
        if (bonus.init) init += bonus.init;
        if (bonus.def) def += bonus.def;
      }
    });
  };

  if (voies?.racial?.name && voies.racial.ranks) applyBonus(voies.racial.name, voies.racial.ranks);
  voies?.profile?.forEach((v: any) => {
    if (v.name && v.ranks) applyBonus(v.name, v.ranks);
  });

  return { init, def };
};
