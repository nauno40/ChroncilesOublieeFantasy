export type Stats = {
  FOR: number; AGI: number; CON: number; INT: number; PER: number; CHA: number; VOL: number;
};

export const calculateMod = (value: number): number => Math.floor((value - 10) / 2);

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

export const getMaxArmorDef = (profileName: string): number => {
  if (['Magicien', 'Ensorceleur', 'Forgesort', 'Sorcier'].includes(profileName)) return 0;
  if (['Voleur', 'Rôdeur', 'Barde', 'Barbare'].includes(profileName)) return 3;
  if (profileName === 'Chevalier') return 8;
  if (['Guerrier', 'Prêtre'].includes(profileName)) return 4;
  return 3;
};

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
