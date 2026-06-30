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
