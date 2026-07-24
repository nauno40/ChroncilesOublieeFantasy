import type { CharacterVoieRef, CaracKey } from '../../types/character';
import type { Protection, CompendiumRace, CompendiumProfile, CompendiumVoie, Stats, ResolvedEffect } from './types';
import { resolveCapabilityEffect, aggregateResolvedBonuses } from './effects';

export const computeCombatStats = (args: {
  voies: CharacterVoieRef[] | undefined;
  protection: Protection | undefined;
  races: CompendiumRace[];
  profiles: CompendiumProfile[];
  allVoies: CompendiumVoie[];
  perMod: number;
  agiMod: number;
  caracs: Stats;
  level: number;
}): { init: number; def: number } => {
  const { voies, protection, races, profiles, allVoies, perMod, agiMod, caracs, level } = args;
  const baseInit = 10 + perMod;
  const baseDef = 10 + agiMod + (protection?.armor?.def || 0) + (protection?.shield?.def || 0);

  // Résolution des voies du perso par IRI (peuple + profil + prestige), comme computeDamageReduction.
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  const resolved: ResolvedEffect[] = [];
  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank && c.effect) {
        resolved.push(resolveCapabilityEffect(c.effect, { level, rank: entry.rank, caracs }));
        // Bonus de combat de l'option choisie (#6b).
        const chosen = c.effect.choiceOptions?.find(o => o.label === entry.choices?.[String(c.rank)]);
        if (chosen?.bonuses) resolved.push(resolveCapabilityEffect({ bonuses: chosen.bonuses }, { level, rank: entry.rank, caracs }));
      }
    });
  });
  const agg = aggregateResolvedBonuses(resolved);
  return { init: baseInit + (agg.init ?? 0), def: baseDef + (agg.def ?? 0) };
};

// Valeur d'attaque COF2 : niveau (plafonné à 10) + caractéristique d'attaque
// (FOR au contact, AGI à distance, VOL/carac de magie en magie).
export const attackValue = (caracMod: number, level: number): number =>
  Math.min(Math.max(0, level), 10) + caracMod;

// Résout la caractéristique d'une attaque : substitution du joueur, sinon défaut COF2.
export const attackCarac = (
  target: 'contact' | 'distance',
  subs: { contact?: CaracKey; distance?: CaracKey } | undefined,
  defaultCarac: CaracKey,
): CaracKey => subs?.[target] ?? defaultCarac;

// Réduction de dommages (RD) : somme des bonus fixes target 'RD' des capacités
// acquises (rang ≤ rang de la voie). Les RD conditionnels restent en prose (§5).
export const computeDamageReduction = (
  voies: CharacterVoieRef[],
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
  caracs: Stats,
  level: number,
): number => {
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  const resolved: ResolvedEffect[] = [];
  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank && c.effect) {
        resolved.push(resolveCapabilityEffect(c.effect, { level, rank: entry.rank, caracs }));
      }
    });
  });
  return aggregateResolvedBonuses(resolved).RD ?? 0;
};

// Plafond de DEF d'armure effectif : base du profil, relevée par les capacités acquises
// portant effect.armorCap (ex. Chevalier « Autorité naturelle » → 7). Évalué au rang de voie.
export const resolveArmorCap = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
  baseArmorMaxDef: number,
): number => {
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  let cap = baseArmorMaxDef;
  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      if ((c.rank ?? 0) >= 1 && (c.rank ?? 0) <= entry.rank) {
        if (typeof c.effect?.armorCap === 'number') cap = Math.max(cap, c.effect.armorCap);
        // Plafond ouvert par l'option choisie (#6b).
        const chosen = c.effect?.choiceOptions?.find(o => o.label === entry.choices?.[String(c.rank)]);
        if (typeof chosen?.armorCap === 'number') cap = Math.max(cap, chosen.armorCap);
      }
    });
  });
  return cap;
};

// Bonus aux TESTS de caractéristique (jamais à la carac elle-même) apportés par les
// capacités acquises : effect.caracTestBonus (fixe) + option choisie de effect.choiceOptions.
export const resolveCaracTestBonuses = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
): Partial<Record<CaracKey, number>> => {
  const byIri = new Map<string, CompendiumVoie>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);

  const out: Partial<Record<CaracKey, number>> = {};
  const add = (carac: CaracKey, value: number) => { out[carac] = (out[carac] ?? 0) + value; };

  (voies ?? []).forEach((entry) => {
    const v = byIri.get(entry.voie);
    (v?.capabilities ?? []).forEach((c) => {
      const rank = c.rank ?? 0;
      if (rank < 1 || rank > entry.rank || !c.effect) return;
      if (c.effect.caracTestBonus) add(c.effect.caracTestBonus.carac, c.effect.caracTestBonus.value);
      if (c.effect.choiceOptions) {
        const chosen = entry.choices?.[String(rank)];
        const opt = c.effect.choiceOptions.find((o) => o.label === chosen);
        if (opt?.caracTestBonus) add(opt.caracTestBonus.carac, opt.caracTestBonus.value);
      }
    });
  });
  return out;
};
