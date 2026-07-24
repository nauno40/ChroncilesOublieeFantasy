import type { CapabilityEffect, ResolvedEffect, BonusTarget, Stats } from './types';

// Dé évolutif « d4° » (COF2, Progression) : d4 aux niveaux 1-5, d6 à 6-8, d8 à 9-11,
// d10 à 12-14, d12 à partir de 15. Beaucoup de capacités infligent des DM en d4°.
export const evolutiveDie = (level: number | undefined): string => {
  const l = Math.max(1, level || 1);
  if (l >= 15) return 'd12';
  if (l >= 12) return 'd10';
  if (l >= 9) return 'd8';
  if (l >= 6) return 'd6';
  return 'd4';
};

// Résout un effet structuré au niveau/rang courant (spec §6.2). Fonction pure.
export const resolveCapabilityEffect = (
  effect: CapabilityEffect | undefined,
  ctx: { level: number; rank: number; caracs: Stats },
): ResolvedEffect => {
  const out: ResolvedEffect = { bonuses: {} };
  if (!effect) return out;

  if (effect.evolutiveDie) {
    out.dice = `${effect.evolutiveDie.count}${evolutiveDie(ctx.level)}`;
  }
  const caracTargets: NonNullable<ResolvedEffect['caracTargets']> = [];
  (effect.bonuses ?? []).forEach((b) => {
    let val = 0;
    if (b.scalesWith === 'fixed') val = b.value ?? 0;
    else if (b.scalesWith === 'rank') val = (b.perRank ?? 0) * ctx.rank;
    else if (b.scalesWith === 'carac' && b.carac) {
      val = ctx.caracs[b.carac];
      caracTargets.push({ target: b.target, carac: b.carac, value: val });
    }
    else if (b.scalesWith === 'threshold') {
      let best = 0, bestRank = -1;
      for (const t of b.thresholds ?? []) {
        if (ctx.rank >= t.minRank && t.minRank > bestRank) { bestRank = t.minRank; best = t.value; }
      }
      val = best;
    }
    out.bonuses[b.target] = (out.bonuses[b.target] ?? 0) + val;
  });
  if (caracTargets.length) out.caracTargets = caracTargets;
  return out;
};

// Agrège plusieurs effets résolus en appliquant le non-cumul (§6.2) : un même
// couple (cible, caractéristique) n'est compté qu'une fois (on garde la valeur).
export const aggregateResolvedBonuses = (
  resolved: ResolvedEffect[],
): Partial<Record<BonusTarget, number>> => {
  const seenCarac = new Set<string>();
  const agg: Partial<Record<BonusTarget, number>> = {};

  resolved.forEach((r) => {
    const caracByTarget = new Map<BonusTarget, number>();
    (r.caracTargets ?? []).forEach((ct) => {
      const key = `${ct.target}:${ct.carac}`;
      if (seenCarac.has(key)) {
        // déjà appliqué par une autre capacité → retirer ce doublon du total de r
        caracByTarget.set(ct.target, (caracByTarget.get(ct.target) ?? 0) + ct.value);
      } else {
        seenCarac.add(key);
      }
    });
    (Object.keys(r.bonuses) as BonusTarget[]).forEach((t) => {
      const dup = caracByTarget.get(t) ?? 0;
      agg[t] = (agg[t] ?? 0) + (r.bonuses[t] ?? 0) - dup;
    });
  });
  return agg;
};
