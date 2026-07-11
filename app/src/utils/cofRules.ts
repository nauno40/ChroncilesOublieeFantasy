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

export const computeSpentPoints = (voies: any, level: number | undefined, isMageFamily: boolean): number => {
  if (level !== 0) return 0;
  let count = 0;
  let mageRank2Found = false;

  if (voies?.racial?.ranks) {
    let racialRanks = voies.racial.ranks.filter(Boolean).length;
    if (voies.racial.ranks[0]) racialRanks = Math.max(0, racialRanks - 1);
    if (voies.racial.ranks[1] && isMageFamily && !mageRank2Found) {
      racialRanks = Math.max(0, racialRanks - 1);
      mageRank2Found = true;
    }
    count += racialRanks;
  }

  if (voies?.profile) {
    voies.profile.forEach((p: any) => {
      if (p.ranks) {
        let profileRanks = p.ranks.filter(Boolean).length;
        if (p.ranks[1] && isMageFamily && !mageRank2Found) {
          profileRanks = Math.max(0, profileRanks - 1);
          mageRank2Found = true;
        }
        count += profileRanks;
      }
    });
  }
  return count;
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
