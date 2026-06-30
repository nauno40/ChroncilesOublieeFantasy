import { describe, it, expect } from 'vitest';
import {
  calculateMod,
  getMaxArmorDef,
  computeModifiers,
  computeMaxHp,
  computeRecoveryDie,
  computeLuckPoints,
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
