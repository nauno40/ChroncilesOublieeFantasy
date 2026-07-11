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
  computeManaPoints,
  computeCombatStats,
  migrateLegacyStats,
} from './cofRules';

describe('calculateMod (COF2 : la valeur EST le modificateur)', () => {
  it('renvoie la valeur telle quelle (identité)', () => {
    expect(calculateMod(0)).toBe(0);
    expect(calculateMod(2)).toBe(2);
    expect(calculateMod(-1)).toBe(-1);
    expect(calculateMod(5)).toBe(5);
  });
});

describe('getMaxArmorDef', () => {
  it('returns the COF2 armor caps by profile (DEF max of heaviest allowed armor)', () => {
    // Aucune armure -> 0
    expect(getMaxArmorDef('Magicien')).toBe(0);
    expect(getMaxArmorDef('Ensorceleur')).toBe(0);
    expect(getMaxArmorDef('Sorcier')).toBe(0);
    expect(getMaxArmorDef('Moine')).toBe(0);
    // Cuir simple -> 2
    expect(getMaxArmorDef('Forgesort')).toBe(2);
    expect(getMaxArmorDef('Voleur')).toBe(2);
    expect(getMaxArmorDef('Druide')).toBe(2);
    // Cuir renforcé -> 3
    expect(getMaxArmorDef('Barde')).toBe(3);
    expect(getMaxArmorDef('Rôdeur')).toBe(3);
    expect(getMaxArmorDef('Barbare')).toBe(3);
    // Chemise de mailles -> 4
    expect(getMaxArmorDef('Arquebusier')).toBe(4);
    expect(getMaxArmorDef('Prêtre')).toBe(4);
    // Cotte de mailles -> 5
    expect(getMaxArmorDef('Guerrier')).toBe(5);
    // Plaque (+6) ; plaque complète (+7) via capacité rang 3
    expect(getMaxArmorDef('Chevalier')).toBe(6);
  });
});

describe('computeModifiers', () => {
  it('renvoie les valeurs de caractéristiques inchangées (identité COF2)', () => {
    const stats = { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 };
    expect(computeModifiers(stats)).toEqual(stats);
  });
});

describe('migrateLegacyStats', () => {
  it('convertit les persos hérités (scores 9-14) en valeurs COF via leurs modifiers', () => {
    const legacyStats = { FOR: 14, AGI: 10, CON: 12, INT: 8, PER: 11, CHA: 7, VOL: 16 };
    const legacyMods = { FOR: 2, AGI: 0, CON: 1, INT: -1, PER: 0, CHA: -2, VOL: 3 };
    expect(migrateLegacyStats(legacyStats, legacyMods)).toEqual(legacyMods);
  });
  it('laisse les valeurs COF (‑2..+5) intactes', () => {
    const cof = { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 };
    expect(migrateLegacyStats(cof, cof)).toEqual(cof);
  });
});

// Vérifie les valeurs dérivées de bout en bout contre les exemples chiffrés du livre
// (chapitre « Création du personnage »).
describe('exemples du livre (fidélité COF2)', () => {
  it('Lhagva (barbare) : PV 12, DR 4 d10, PC 2, Init 11, attaque contact +4', () => {
    const stats = { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 };
    const mods = computeModifiers(stats);
    expect(computeMaxHp(5, mods.CON)).toBe(12);              // combattants base 5
    expect(computeRecoveryDie('Barbare', mods.CON)).toBe('4 d10');
    // humaine : voie de l'humain rang 1 (Diversité) -> +1 PC
    expect(computeLuckPoints('Barbare', mods.CHA, { name: "Voie de l'humain", ranks: [true] })).toBe(2);
    const combat = computeCombatStats({
      voies: { racial: { name: '', ranks: [] }, profile: [] },
      protection: { armor: { def: 0 }, shield: { def: 0 } },
      races: [], profiles: [], perMod: mods.PER, agiMod: mods.AGI, capabilityModifiers: {},
    });
    expect(combat.init).toBe(11);                            // 10 + PER(1)
    expect(1 + mods.FOR).toBe(4);                            // attaque contact = niveau + FOR
  });

  it('Ionas (ensorceleur/mage) : PV 7, DR 3 d6, PC 6, attaque magique +3', () => {
    const stats = { FOR: -2, AGI: 1, CON: 1, INT: 0, PER: 0, CHA: 4, VOL: 2 };
    const mods = computeModifiers(stats);
    expect(computeMaxHp(3, mods.CON)).toBe(7);               // mages base 3
    expect(computeRecoveryDie('Ensorceleur', mods.CON)).toBe('3 d6');
    expect(computeLuckPoints('Ensorceleur', mods.CHA)).toBe(6); // 2 + CHA(4)
    expect(1 + mods.VOL).toBe(3);                            // attaque magique = niveau + VOL
    expect(1 + mods.FOR).toBe(-1);                           // attaque contact = niveau + FOR
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

const spellRace = [{
  availableVoies: [{ name: 'Voie magique', capabilities: [{ rank: 1, isSpell: true }] }],
}];

describe('computeManaPoints', () => {
  it('is 0 when no spells are learned', () => {
    const voies = { racial: { name: 'Voie magique', ranks: [false] }, profile: [] };
    expect(computeManaPoints(voies, spellRace, [], 3)).toBe(0);
  });
  it('is volMod + spellCount when spells are learned', () => {
    const voies = { racial: { name: 'Voie magique', ranks: [true] }, profile: [] };
    expect(computeManaPoints(voies, spellRace, [], 3)).toBe(4); // 3 + 1
  });
});

describe('computeCombatStats', () => {
  it('is base 10 + mods + protection with no capability bonuses', () => {
    const r = computeCombatStats({
      voies: { racial: { name: '', ranks: [] }, profile: [] },
      protection: { armor: { def: 3 }, shield: { def: 1 } },
      races: [], profiles: [], perMod: 2, agiMod: 1, capabilityModifiers: {},
    });
    expect(r.init).toBe(12); // 10 + 2
    expect(r.def).toBe(15);  // 10 + 1 + 3 + 1
  });
});
