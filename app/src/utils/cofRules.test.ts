import { describe, it, expect } from 'vitest';
import {
  calculateMod,
  getMaxArmorDef,
  computeModifiers,
  computeMaxHp,
  computeMaxHpByLevel,
  computeHybridMaxHp,
  computeRecoveryDie,
  computeLuckPoints,
  computeFinalStats,
  computeSpentPoints,
  computeManaPoints,
  computeCombatStats,
  migrateLegacyStats,
  capacityBudget,
  capacityCost,
  canAcquireRank,
  evolutiveDie,
  attackValue,
  computeLanguageSlots,
  resolveCapabilityEffect,
  aggregateResolvedBonuses,
  computeDamageReduction,
  FAMILY_BASE_HP,
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
    expect(computeLuckPoints('Barbare', mods.CHA, { name: "Voie de l'humain", rank: 1 })).toBe(2);
    const combat = computeCombatStats({
      voies: [],
      protection: { armor: { def: 0 }, shield: { def: 0 } },
      races: [], profiles: [], perMod: mods.PER, agiMod: mods.AGI, capabilityModifiers: {},
    });
    expect(combat.init).toBe(11);                            // 10 + PER(1)
    expect(attackValue(mods.FOR, 1)).toBe(4);                 // attaque contact = niveau + FOR
    expect(attackValue(mods.AGI, 1)).toBe(2);                 // attaque distance = niveau + AGI
  });

  it('Lhagva niveau 3 : PV cumulés = computeMaxHp(5, CON, 3) = 26', () => {
    const stats = { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 1 };
    const mods = computeModifiers(stats);
    // base combattants 5, CON +2 : 5×(3+1) + 2×3 = 26
    expect(computeMaxHp(5, mods.CON, 3)).toBe(26);
  });

  it('Ionas (ensorceleur/mage) : PV 7, DR 3 d6, PC 6, attaque magique +3', () => {
    const stats = { FOR: -2, AGI: 1, CON: 1, INT: 0, PER: 0, CHA: 4, VOL: 2 };
    const mods = computeModifiers(stats);
    expect(computeMaxHp(3, mods.CON)).toBe(7);               // mages base 3
    expect(computeRecoveryDie('Ensorceleur', mods.CON)).toBe('3 d6');
    expect(computeLuckPoints('Ensorceleur', mods.CHA)).toBe(6); // 2 + CHA(4)
    expect(attackValue(mods.VOL, 1)).toBe(3);                 // attaque magique = niveau + VOL
    expect(attackValue(mods.FOR, 1)).toBe(-1);                // attaque contact = niveau + FOR
    expect(attackValue(mods.AGI, 1)).toBe(2);                 // attaque distance = niveau + AGI
  });
});

describe('computeMaxHp par niveau', () => {
  it('niveau 1 = 2×base + CON (rétrocompat)', () => {
    expect(computeMaxHp(5, 2)).toBe(12);      // Lhagva niv.1 : combattants base 5, CON +2
    expect(computeMaxHp(6, 2)).toBe(14);
    expect(computeMaxHp(3, -1)).toBe(5);
  });
  it('cumule par niveau : base×(niveau+1) + CON×niveau', () => {
    expect(computeMaxHp(5, 2, 3)).toBe(5 * 4 + 2 * 3); // 26
    expect(computeMaxHp(3, 1, 5)).toBe(3 * 6 + 1 * 5); // 23
  });
  it('CON négatif reste rétroactif sur tous les niveaux', () => {
    expect(computeMaxHp(5, -1, 4)).toBe(5 * 5 - 1 * 4); // 21
  });
});

describe('computeMaxHpByLevel (hybride)', () => {
  it('somme les base par niveau + CON×niveau (famille uniforme = computeMaxHp)', () => {
    expect(computeMaxHpByLevel([5, 5, 5], 2)).toBe(computeMaxHp(5, 2, 3)); // 26
  });
  it('mélange de familles : niveaux 1-2 combattant (5), niveau 3 mage (3)', () => {
    // base initial (niv.1) = 5 ; puis (5+2) + (5+2) + (3+2) = 24 ; total 5 + ... -> voir formule
    // PV = baseHpPerLevel[0] + Σ(baseHpPerLevel[L] + CON) = 5 + (5+2)+(5+2)+(3+2) = 5+7+7+5 = 24
    expect(computeMaxHpByLevel([5, 5, 3], 2)).toBe(24);
  });
  it('FAMILY_BASE_HP : une famille combattants (5) donne le même PV que la formule non-hybride', () => {
    // barbare niv.2, CON +2 : override combattants sur les 2 niveaux == computeMaxHp(5,2,2)
    const perLevel = [FAMILY_BASE_HP.combattants, FAMILY_BASE_HP.combattants];
    expect(computeMaxHpByLevel(perLevel, 2)).toBe(computeMaxHp(5, 2, 2)); // 19
  });
});

describe('computeHybridMaxHp (PV hybrides fidèles, COF2 chap. 9)', () => {
  it('mono-famille : identique à la formule non-hybride (parité)', () => {
    // combattants base 5, CON +2, niveau 3
    expect(computeHybridMaxHp('combattants', {}, 2, 3)).toBe(computeMaxHp(5, 2, 3)); // 26
    expect(computeHybridMaxHp('mages', undefined, 0, 5)).toBe(computeMaxHp(3, 0, 5)); // 18
  });
  it('deux familles au même niveau : moyenne (livre : combattant+mage = 4)', () => {
    // niveau 2 financé par combattant (5) + mage (3) → moyenne 4 ; niveau 1 = 2×5
    expect(computeHybridMaxHp('combattants', { '2': ['combattants', 'mages'] }, 0, 2)).toBe(14); // floor(10 + 4)
  });
  it('arrondi alterné : 3,5 puis 3,5 → 3 puis 4', () => {
    // profil principal mage (3) ; niveaux 2 et 3 = mage(3) + aventurier(4) → moyenne 3,5 chacun
    const hp = (lvl: number, byLevel: Record<string, string[]>) => computeHybridMaxHp('mages', byLevel, 0, lvl);
    // niveau 2 : floor(2×3 + 3,5) = floor(9,5) = 9  (gain niveau 2 = 3)
    expect(hp(2, { '2': ['mages', 'aventuriers'] })).toBe(9);
    // niveau 3 : floor(6 + 3,5 + 3,5) = floor(13) = 13  (gain niveau 3 = 4)
    expect(hp(3, { '2': ['mages', 'aventuriers'], '3': ['mages', 'aventuriers'] })).toBe(13);
  });
  it('exception voie de peuple : la famille du profil principal dans la liste', () => {
    // guerrier (combattants 5) : peuple (→ combattants) + mage (3) → moyenne 4
    expect(computeHybridMaxHp('combattants', { '2': ['combattants', 'mages'] }, 0, 2)).toBe(14);
  });
  it('CON rétroactif sur tous les niveaux', () => {
    expect(computeHybridMaxHp('combattants', {}, -1, 4)).toBe(computeMaxHp(5, -1, 4)); // floor(2×5+5+5+5) - 4 = 25-4=21
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
    expect(computeLuckPoints('Magicien', 0, { name: "Voie de l'humain", rank: 1 })).toBe(3);
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
  it('vide = 0 point dépensé', () => {
    expect(computeSpentPoints([], 1, false)).toBe(0);
  });
  it('rang 1 de la voie de peuple gratuit', () => {
    const voies = [{ voie: '/api/voies/1', rank: 1, source: 'peuple' as const }];
    expect(computeSpentPoints(voies, 0, false)).toBe(0);
  });
  it('compte un second rang de voie de peuple pour un non-mage', () => {
    const voies = [{ voie: '/api/voies/1', rank: 2, source: 'peuple' as const }];
    expect(computeSpentPoints(voies, 0, false)).toBe(1);
  });
  it('offre un rang 2 gratuit au mage (une seule fois)', () => {
    const voies = [{ voie: '/api/voies/1', rank: 2, source: 'peuple' as const }];
    expect(computeSpentPoints(voies, 0, true)).toBe(0);
  });
  it('somme les coûts de rang de profil (rangs 1,2 = 1 pt, rang 3 = 2 pts)', () => {
    // rang cumulé 3 ⇒ rangs 1,2 (1 pt chacun) + rang 3 (2 pts) = 4
    const voies = [{ voie: '/api/voies/2', rank: 3, source: 'profil' as const }];
    expect(computeSpentPoints(voies, 5, false)).toBe(4);
  });
  it('somme les coûts sur plusieurs voies (IRI)', () => {
    const voies = [
      { voie: '/api/voies/1', rank: 2, source: 'profil' as const },  // 1+1 = 2
      { voie: '/api/voies/2', rank: 3, source: 'profil' as const },  // 1+1+2 = 4
    ];
    expect(computeSpentPoints(voies, 5, false)).toBe(6);
  });
  it('compte les rangs de prestige à 2 points chacun', () => {
    const voies = [{ voie: '/api/voies/3', rank: 2, source: 'prestige' as const }];
    expect(computeSpentPoints(voies, 7, false)).toBe(4);
  });
});

describe('evolutiveDie', () => {
  it('suit la table COF2 : d4 (1-5), d6 (6-8), d8 (9-11), d10 (12-14), d12 (15+)', () => {
    expect(evolutiveDie(1)).toBe('d4');
    expect(evolutiveDie(5)).toBe('d4');
    expect(evolutiveDie(6)).toBe('d6');
    expect(evolutiveDie(8)).toBe('d6');
    expect(evolutiveDie(9)).toBe('d8');
    expect(evolutiveDie(12)).toBe('d10');
    expect(evolutiveDie(15)).toBe('d12');
    expect(evolutiveDie(0)).toBe('d4'); // création
  });
});

describe('capacityBudget & capacityCost', () => {
  it('budget = 2 par niveau (création niv 0 = niv 1)', () => {
    expect(capacityBudget(0)).toBe(2);
    expect(capacityBudget(1)).toBe(2);
    expect(capacityBudget(5)).toBe(10);
  });
  it('coût : 1 pour rang 1-2, 2 pour rang 3+', () => {
    expect(capacityCost(1)).toBe(1);
    expect(capacityCost(2)).toBe(1);
    expect(capacityCost(3)).toBe(2);
    expect(capacityCost(5)).toBe(2);
  });
});

describe('canAcquireRank', () => {
  const ctx = (over: Partial<Parameters<typeof canAcquireRank>[3]> = {}) => ({
    level: 1, isMageFamily: false, spentPoints: 0, budget: 2, hasOtherRank2: false, ...over,
  });
  it('refuse un rang sans le rang précédent', () => {
    expect(canAcquireRank(2, false, 'profile', ctx({ level: 2 }))).toEqual({ ok: false, reason: expect.stringContaining('rang précédent') });
  });
  it('applique le tableau des niveaux requis (rang 3 → niveau 3)', () => {
    expect(canAcquireRank(3, true, 'profile', ctx({ level: 2, budget: 10 })).ok).toBe(false);
    expect(canAcquireRank(3, true, 'profile', ctx({ level: 3, budget: 10 })).ok).toBe(true);
  });
  it('rang 5 exige le niveau 7', () => {
    expect(canAcquireRank(5, true, 'profile', ctx({ level: 6, budget: 20 })).ok).toBe(false);
    expect(canAcquireRank(5, true, 'profile', ctx({ level: 7, budget: 20 })).ok).toBe(true);
  });
  it('exception mage : rang 2 accessible dès le niveau 1', () => {
    expect(canAcquireRank(2, true, 'profile', ctx({ level: 1, isMageFamily: true })).ok).toBe(true);
    // et gratuit si aucun autre rang 2 (budget serré de 1 pt)
    expect(canAcquireRank(2, true, 'profile', ctx({ level: 1, isMageFamily: true, spentPoints: 1, budget: 1 })).ok).toBe(true);
  });
  it('bloque le rang 2 non-mage au niveau 1', () => {
    expect(canAcquireRank(2, true, 'profile', ctx({ level: 1, budget: 10 })).ok).toBe(false);
  });
  it('refuse si le budget est dépassé', () => {
    expect(canAcquireRank(1, true, 'profile', ctx({ spentPoints: 2, budget: 2 })).ok).toBe(false);
  });
  it('prestige : rang affiché 1 (=rang 4) exige le niveau 5 et coûte 2', () => {
    expect(canAcquireRank(1, true, 'prestige', ctx({ level: 4, budget: 20 })).ok).toBe(false);
    expect(canAcquireRank(1, true, 'prestige', ctx({ level: 5, budget: 20 })).ok).toBe(true);
    expect(canAcquireRank(1, true, 'prestige', ctx({ level: 5, spentPoints: 9, budget: 10 })).ok).toBe(false);
  });
});

const spellRace = [{
  availableVoies: [{ '@id': '/api/voies/9', name: 'Voie magique', capabilities: [{ rank: 1, isSpell: true }] }],
}];

describe('computeManaPoints', () => {
  it('is 0 when no spells are learned', () => {
    const voies = [{ voie: '/api/voies/9', rank: 0, source: 'peuple' as const }];
    expect(computeManaPoints(voies, spellRace, [], 3)).toBe(0);
  });
  it('is volMod + spellCount when spells are learned', () => {
    const voies = [{ voie: '/api/voies/9', rank: 1, source: 'peuple' as const }];
    expect(computeManaPoints(voies, spellRace, [], 3)).toBe(4); // 3 + 1
  });
  it('ajoute la PER au rang 4 « Perception héroïque » d\'une voie druide/ensorceleur', () => {
    // Voie de druide dont le rang 1 est un sort et le rang 4 « Perception héroïque ».
    const druide = {
      name: 'Druide',
      voies: [{
        '@id': '/api/voies/50',
        name: 'Voie des fauves',
        capabilities: [
          { rank: 1, name: 'Sort mineur', isSpell: true },
          { rank: 4, name: 'Perception héroïque', isSpell: false },
        ],
      }],
    };
    const voies = [{ voie: '/api/voies/50', rank: 4, source: 'profil' as const }];
    // 1 sort + VOL 3 + PER 2 (grâce au rang 4)
    expect(computeManaPoints(voies, [], [druide], 3, 2)).toBe(6);
    // sans le rang 4, pas de bonus PER : 1 + 3 = 4
    const sansR4 = [{ voie: '/api/voies/50', rank: 1, source: 'profil' as const }];
    expect(computeManaPoints(sansR4, [], [druide], 3, 2)).toBe(4);
  });
});

describe('computeCombatStats', () => {
  it('is base 10 + mods + protection with no capability bonuses', () => {
    const r = computeCombatStats({
      voies: [],
      protection: { armor: { def: 3 }, shield: { def: 1 } },
      races: [], profiles: [], perMod: 2, agiMod: 1, capabilityModifiers: {},
    });
    expect(r.init).toBe(12); // 10 + 2
    expect(r.def).toBe(15);  // 10 + 1 + 3 + 1
  });
});

describe('attackValue (niveau plafonné à 10)', () => {
  it('niveau + carac sous le plafond', () => {
    expect(attackValue(3, 1)).toBe(4);   // Lhagva : niv.1 + FOR 3
    expect(attackValue(-2, 1)).toBe(-1); // Ionas contact
    expect(attackValue(2, 10)).toBe(12);
  });
  it('plafonne la part de niveau à 10', () => {
    expect(attackValue(2, 12)).toBe(12); // min(12,10)=10 + 2
    expect(attackValue(0, 20)).toBe(10);
  });
});

describe('computeLanguageSlots', () => {
  it('un emplacement de langue par point positif d\'INT', () => {
    expect(computeLanguageSlots(0)).toEqual({ slots: 0, illiterate: false });
    expect(computeLanguageSlots(2)).toEqual({ slots: 2, illiterate: false });
  });
  it('INT négatif : illettré, aucun emplacement', () => {
    expect(computeLanguageSlots(-1)).toEqual({ slots: 0, illiterate: true });
  });
});

describe('resolveCapabilityEffect', () => {
  const caracs = { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 2 };

  it('résout le dé évolutif au niveau courant', () => {
    const r = resolveCapabilityEffect({ evolutiveDie: { count: 2 } }, { level: 9, rank: 1, caracs });
    expect(r.dice).toBe('2d8'); // d8 à partir du niveau 9
    expect(r.bonuses).toEqual({});
  });
  it('résout un bonus fixe, par rang et par caractéristique', () => {
    const effect = { bonuses: [
      { target: 'init' as const, scalesWith: 'fixed' as const, value: 3 },
      { target: 'DM' as const, scalesWith: 'rank' as const, perRank: 1 },
      { target: 'PVmax' as const, scalesWith: 'carac' as const, carac: 'FOR' as const },
    ] };
    const r = resolveCapabilityEffect(effect, { level: 1, rank: 3, caracs });
    expect(r.bonuses).toEqual({ init: 3, DM: 3, PVmax: 3 }); // rank 3 → DM 3 ; FOR 3
  });
  it('effect vide → aucun dé, aucun bonus', () => {
    expect(resolveCapabilityEffect(undefined, { level: 1, rank: 1, caracs })).toEqual({ bonuses: {} });
  });
});

describe('aggregateResolvedBonuses (non-cumul)', () => {
  it('somme les bonus fixes/rang de même cible', () => {
    const agg = aggregateResolvedBonuses([{ bonuses: { def: 1 } }, { bonuses: { def: 2 } }]);
    expect(agg.def).toBe(3);
  });
  it('ne compte pas deux fois la même caractéristique sur la même cible', () => {
    // deux capacités ajoutent +FOR aux DM : une seule application (non-cumul §6.2)
    const agg = aggregateResolvedBonuses([
      { bonuses: { DM: 3 }, caracTargets: [{ target: 'DM', carac: 'FOR', value: 3 }] },
      { bonuses: { DM: 3 }, caracTargets: [{ target: 'DM', carac: 'FOR', value: 3 }] },
    ]);
    expect(agg.DM).toBe(3);
  });
});

describe('computeDamageReduction', () => {
  const caracs = { FOR: 3, AGI: 1, CON: 2, INT: 0, PER: 1, CHA: -1, VOL: 2 };
  it('somme les RD fixes des capacités acquises (rang atteint)', () => {
    const profiles = [{ name: 'Barbare', voies: [{
      '@id': '/api/voies/700', name: 'Voie de la Résistance',
      capabilities: [{ rank: 3, name: 'Peau d\'acier', effect: { bonuses: [{ target: 'RD' as const, scalesWith: 'fixed' as const, value: 3 }] } }],
    }] }];
    const voies = [{ voie: '/api/voies/700', rank: 3, source: 'profil' as const }];
    expect(computeDamageReduction(voies, [], profiles, [], caracs, 3)).toBe(3);
  });
  it('ignore les rangs non atteints', () => {
    const profiles = [{ name: 'Barbare', voies: [{
      '@id': '/api/voies/700', name: 'V',
      capabilities: [{ rank: 3, effect: { bonuses: [{ target: 'RD' as const, scalesWith: 'fixed' as const, value: 3 }] } }],
    }] }];
    const voies = [{ voie: '/api/voies/700', rank: 2, source: 'profil' as const }];
    expect(computeDamageReduction(voies, [], profiles, [], caracs, 3)).toBe(0);
  });
});
