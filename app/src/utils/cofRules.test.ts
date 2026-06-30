import { describe, it, expect } from 'vitest';
import {
  calculateMod,
  getMaxArmorDef,
  computeModifiers,
  computeMaxHp,
  computeRecoveryDie,
  computeLuckPoints,
  computeFinalStats,
  computeSpentPoints,
} from './cofRules';

describe('calculateMod', () => {
  it('is 0 at 10 and 11', () => {
    expect(calculateMod(10)).toBe(0);
    expect(calculateMod(11)).toBe(0);
  });
  it('handles positive and negative', () => {
    expect(calculateMod(14)).toBe(2);
    expect(calculateMod(13)).toBe(1);
    expect(calculateMod(8)).toBe(-1);
    expect(calculateMod(7)).toBe(-2);
  });
});

describe('getMaxArmorDef', () => {
  it('returns the documented caps by profile', () => {
    expect(getMaxArmorDef('Magicien')).toBe(0);
    expect(getMaxArmorDef('Voleur')).toBe(3);
    expect(getMaxArmorDef('Chevalier')).toBe(8);
    expect(getMaxArmorDef('Guerrier')).toBe(4);
    expect(getMaxArmorDef('Druide')).toBe(3); // default
  });
});

describe('computeModifiers', () => {
  it('maps each stat through calculateMod', () => {
    const mods = computeModifiers({ FOR: 14, AGI: 10, CON: 12, INT: 8, PER: 11, CHA: 7, VOL: 16 });
    expect(mods).toEqual({ FOR: 2, AGI: 0, CON: 1, INT: -1, PER: 0, CHA: -2, VOL: 3 });
  });
});

describe('computeMaxHp', () => {
  it('is baseHp*2 + conMod', () => {
    expect(computeMaxHp(6, 2)).toBe(14);
    expect(computeMaxHp(3, -1)).toBe(5);
  });
});

describe('computeRecoveryDie', () => {
  it('is "(base + conMod) die" for a known profile', () => {
    expect(computeRecoveryDie('Guerrier', 2)).toBe('4 d10'); // combattants base 2
    expect(computeRecoveryDie('Magicien', 0)).toBe('2 d6');  // mages base 2
  });
  it('clamps quantity at 0', () => {
    expect(computeRecoveryDie('Magicien', -3)).toBe('0 d6');
  });
  it('returns "—" for unknown/empty profile', () => {
    expect(computeRecoveryDie(undefined, 2)).toBe('—');
    expect(computeRecoveryDie('Inconnu', 2)).toBe('—');
  });
});

describe('computeLuckPoints', () => {
  it('is 2 + chaMod', () => {
    expect(computeLuckPoints('Magicien', 0)).toBe(2);
    expect(computeLuckPoints('Magicien', 1)).toBe(3);
  });
  it('adds +1 for the aventuriers family', () => {
    expect(computeLuckPoints('Barde', 1)).toBe(4); // 2 + 1 + 1
  });
  it('adds +1 for Voie de l\'humain rank 1', () => {
    expect(computeLuckPoints('Magicien', 0, { name: "Voie de l'humain", ranks: [true] })).toBe(3);
  });
  it('clamps below 1 to 0', () => {
    expect(computeLuckPoints('Magicien', -2)).toBe(0);
  });
});

describe('computeFinalStats', () => {
  const base = { FOR: 10, AGI: 10, CON: 10, INT: 10, PER: 10, CHA: 10, VOL: 10 };

  it('returns base unchanged when there are no modifiers', () => {
    expect(computeFinalStats(base, undefined, {})).toEqual(base);
  });
  it('applies a fixed racial modifier', () => {
    const r = computeFinalStats(base, [{ type: 'fixed', stat: 'FOR', value: 2 }], {});
    expect(r.FOR).toBe(12);
  });
  it('applies a chosen modifier when the choice matches an option', () => {
    const mods = [{ type: 'choice', stat: null, value: 1, options: ['AGI', 'PER'] }];
    const r = computeFinalStats(base, mods, { bonus_0: 'AGI' });
    expect(r.AGI).toBe(11);
  });
  it('applies add_to_lowest choices by index', () => {
    const mods = [{ type: 'logic', logic: 'add_to_lowest', value: 1, count: 1 }];
    const r = computeFinalStats(base, mods, { bonus_0_0: 'INT' });
    expect(r.INT).toBe(11);
  });
});

describe('computeSpentPoints', () => {
  it('is 0 when level is not 0', () => {
    expect(computeSpentPoints({}, 1, false)).toBe(0);
  });
  it('gives a free rank 1 on the racial voie', () => {
    const voies = { racial: { name: 'X', ranks: [true, false, false, false, false] }, profile: [] };
    expect(computeSpentPoints(voies, 0, false)).toBe(0); // rank 1 is free
  });
  it('counts a second racial rank for a non-mage', () => {
    const voies = { racial: { name: 'X', ranks: [true, true, false, false, false] }, profile: [] };
    expect(computeSpentPoints(voies, 0, false)).toBe(1);
  });
  it('gives a mage a free rank 2 (once)', () => {
    const voies = { racial: { name: 'X', ranks: [true, true, false, false, false] }, profile: [] };
    expect(computeSpentPoints(voies, 0, true)).toBe(0);
  });
  it('counts profile ranks', () => {
    const voies = {
      racial: { name: 'X', ranks: [false, false, false, false, false] },
      profile: [{ name: 'P', ranks: [true, true, false, false, false] }],
    };
    expect(computeSpentPoints(voies, 0, false)).toBe(2);
  });
});
