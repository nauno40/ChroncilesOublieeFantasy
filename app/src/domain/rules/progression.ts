import type { CharacterVoieRef, VoieSource } from '../../types/character';
import type { VoieKind, AcquireResult, AcquireContext } from './types';

// --- Progression : points de capacité, coûts et niveaux requis (COF2, chap. Progression) ---

// Niveau minimal requis pour acquérir une capacité d'un rang donné dans une voie normale.
// Rang 1→1, 2→2, 3→3, 4→5, 5→7 (les rangs 6-8 sont réservés aux voies de prestige).
export const RANK_REQUIRED_LEVEL: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 7, 6: 9, 7: 11, 8: 13 };
// Voies de prestige : les 5 rangs affichés (1..5) correspondent aux rangs réels 4..8.
export const PRESTIGE_RANK_REQUIRED_LEVEL: Record<number, number> = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 13 };

// Coût en points de capacité : 1 pour un rang 1-2, 2 pour un rang 3 ou plus.
export const capacityCost = (rank: number): number => (rank <= 2 ? 1 : 2);

// Budget total de points de capacité à un niveau : 2 par niveau. Le niveau 0 (création)
// équivaut au niveau 1. La capacité de rang 1 de la voie de peuple et la capacité de rang 2
// gratuite des mages ne sont pas décomptées (cf. computeSpentPoints).
export const capacityBudget = (level: number | undefined): number => 2 * Math.max(1, level || 0);

// Plafond de voies (COF2 §Progression) : 6 voies maximum EN PLUS de la voie de peuple ; la
// voie de prestige compte parmi les 6. On décompte donc toutes les voies non-peuple. Les
// capacités octroyées (source 'trait') ne sont pas des voies choisies : hors plafond aussi.
export const MAX_VOIES = 6;
export const countCappedVoies = (voies: CharacterVoieRef[] | undefined): number =>
  (voies ?? []).filter(v => v.source !== 'peuple' && v.source !== 'trait').length;
export const canAddVoie = (voies: CharacterVoieRef[] | undefined): boolean =>
  countCappedVoies(voies) < MAX_VOIES;

// Traduit la `source` d'une voie de personnage (modèle Phase 2) vers le `VoieKind`
// utilisé par les règles de coût/verrou. profil et hybride partagent les mêmes règles.
export const voieKindOf = (source: VoieSource): VoieKind =>
  source === 'peuple' ? 'racial' : source === 'prestige' ? 'prestige' : 'profile';

// Niveau à partir duquel un rang devient accessible (verrou structurel, hors budget).
// Tient compte de l'exception mage (rang 2 dès le niveau 1).
export const rankUnlockLevel = (rank: number, voieKind: VoieKind, isMageFamily: boolean): number => {
  if (voieKind === 'prestige') return PRESTIGE_RANK_REQUIRED_LEVEL[rank] ?? 99;
  if (rank === 2 && isMageFamily) return 1;
  return RANK_REQUIRED_LEVEL[rank] ?? 99;
};

// Coût d'une capacité selon la voie (rang 1 de peuple gratuit ; prestige = rang réel ≥ 4).
export const rankCost = (rank: number, voieKind: VoieKind): number => {
  if (voieKind === 'racial' && rank === 1) return 0;
  if (voieKind === 'prestige') return 2;
  return capacityCost(rank);
};

// Valide l'acquisition d'un rang : prérequis de rang, niveau minimal, puis budget.
export const canAcquireRank = (
  rank: number,
  prevRankOwned: boolean,
  voieKind: VoieKind,
  ctx: AcquireContext,
): AcquireResult => {
  if (rank > 1 && !prevRankOwned) return { ok: false, reason: 'Vous devez posséder le rang précédent.' };

  const effLevel = Math.max(1, ctx.level || 0);
  const prestige = voieKind === 'prestige';
  const actualRank = prestige ? rank + 3 : rank;
  // Exception mage : la capacité de rang 2 bonus est accessible dès le niveau 1.
  const mageRank2 = !prestige && rank === 2 && ctx.isMageFamily;
  const reqLevel = prestige ? PRESTIGE_RANK_REQUIRED_LEVEL[rank] : RANK_REQUIRED_LEVEL[rank];
  if (!mageRank2 && effLevel < (reqLevel ?? 99)) {
    return { ok: false, reason: `Niveau ${reqLevel} requis pour une capacité de rang ${actualRank}.` };
  }

  // La capacité de rang 2 gratuite des mages ne coûte rien (une seule fois).
  const cost = mageRank2 && !ctx.hasOtherRank2 ? 0 : rankCost(rank, voieKind);
  if (ctx.spentPoints + cost > ctx.budget) {
    return { ok: false, reason: 'Plus assez de points de capacité pour ce niveau.' };
  }
  return { ok: true };
};

// Total des points de capacité dépensés, tous niveaux confondus : somme des coûts de
// chaque rang acquis, hors rang 1 gratuit de la voie de peuple et hors rang 2 gratuit
// des mages (une seule fois).
export const computeSpentPoints = (
  voies: CharacterVoieRef[] | undefined,
  _level: number | undefined,
  isMageFamily: boolean,
): number => {
  let spent = 0;
  let mageFreeRank2Used = false;

  (voies ?? []).forEach((v) => {
    if (v.source === 'trait') return; // capacité octroyée : gratuite (hors budget)
    const voieKind = voieKindOf(v.source);
    for (let rank = 1; rank <= (v.rank || 0); rank++) {
      if (voieKind !== 'prestige' && rank === 2 && isMageFamily && !mageFreeRank2Used) {
        mageFreeRank2Used = true; // rang 2 gratuit du mage (une seule fois)
        continue;
      }
      spent += rankCost(rank, voieKind);
    }
  });
  return spent;
};

// Une capacité (à son rang) est-elle accordée par cette entrée de voie sur la fiche ?
// Cas général : tous les rangs jusqu'au rang courant (c.rank <= entry.rank).
// Entrée 'trait' (octroi de capacité de peuple) : EXACTEMENT la capacité du rang choisi —
// le trait n'accorde qu'UNE capacité (rang 1 ou 2), pas la voie jusqu'à ce rang.
export const isCapabilityGrantedByEntry = (capRank: number | undefined, entry: CharacterVoieRef): boolean => {
  const r = capRank ?? 0;
  if (r < 1) return false;
  return entry.source === 'trait' ? r === entry.rank : r <= entry.rank;
};
