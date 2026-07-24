import type { PlayState } from '../../types/character';
import { resetUsages } from './mechanics';

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
