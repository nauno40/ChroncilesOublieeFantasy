import { describe, it, expect } from 'vitest';
import {
  calculateMod,
  getMaxArmorDef,
  computeModifiers,
  computeMaxHp,
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
