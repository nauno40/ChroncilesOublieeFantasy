import type { Stats, RaceModifier } from './types';

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

export const computeModifiers = (stats: Stats): Stats => ({
  FOR: calculateMod(stats.FOR),
  AGI: calculateMod(stats.AGI),
  CON: calculateMod(stats.CON),
  INT: calculateMod(stats.INT),
  PER: calculateMod(stats.PER),
  CHA: calculateMod(stats.CHA),
  VOL: calculateMod(stats.VOL),
});

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
