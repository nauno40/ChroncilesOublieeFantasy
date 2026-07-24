import type { CaracKey } from '../../types/character';

export type Stats = {
  FOR: number; AGI: number; CON: number; INT: number; PER: number; CHA: number; VOL: number;
};

// --- Formes minimales des données de règles (compendium + voies d'un perso) ---
// Volontairement partielles : les données proviennent de l'API (typage souple) ; on ne
// décrit ici que les champs réellement lus par les calculs de règles. Les voies du perso
// sont désormais référencées par IRI (`CharacterVoieRef`) et résolues dans le compendium.
export interface CompendiumCapability {
  name?: string; rank?: number; description?: string; isSpell?: boolean;
  effect?: CapabilityEffect;
}
export interface CompendiumVoie { '@id'?: string; name?: string; capabilities?: CompendiumCapability[]; }
export interface CompendiumProfile { name?: string; voies?: CompendiumVoie[]; }
export interface CompendiumRace { availableVoies?: CompendiumVoie[]; }
export interface RaceModifier {
  type?: string; stat?: string | null; value: number; count?: number; options?: string[]; logic?: string;
}
// `armor.agiMax` : plafond d'AGI de l'armure (COF2, encombrement) — au-delà, l'AGI effective est réduite à cette valeur.
export interface Protection { armor?: { def?: number; agiMax?: number | null }; shield?: { def?: number }; }

// --- Interpréteur d'effets de capacité (spec §6.1/§6.2) ---
// Structure `effect` taguée décrivant un dé évolutif et/ou des bonus à cible
// (DM, init, def, PVmax, RD), chacun pouvant scaler à valeur fixe, par rang, ou
// par caractéristique. `resolveCapabilityEffect` est une fonction pure qui
// résout ces règles au niveau/rang courant du personnage.
export type BonusTarget = 'DM' | 'init' | 'def' | 'PVmax' | 'RD';
export interface CapabilityBonus {
  target: BonusTarget;
  scalesWith: 'fixed' | 'rank' | 'carac' | 'threshold';
  value?: number;        // scalesWith 'fixed'
  perRank?: number;      // scalesWith 'rank'
  carac?: keyof Stats;   // scalesWith 'carac'
  thresholds?: { minRank: number; value: number }[];  // scalesWith 'threshold' : palier de plus grand minRank ≤ rang
}
export interface CapabilityEffect {
  evolutiveDie?: { count: number };
  bonuses?: CapabilityBonus[];
  armorCap?: number;   // DEF max d'armure que cette capacité autorise (plafond relevé)
  caracTestBonus?: { carac: CaracKey; value: number };   // bonus fixe aux tests d'une carac
  choiceOptions?: {
    label: string;
    caracTestBonus?: { carac: CaracKey; value: number };   // #6a
    bonuses?: CapabilityBonus[];                             // #6b — bonus de combat de l'option
    armorCap?: number;                                       // #6b — plafond d'armure ouvert par l'option
  }[]; // choix structuré
}
export interface ResolvedEffect {
  dice?: string;
  bonuses: Partial<Record<BonusTarget, number>>;
  // Traçabilité des bonus liés à une carac, pour la déduplication non-cumul (§6.2).
  caracTargets?: { target: BonusTarget; carac: keyof Stats; value: number }[];
}

export type VoieKind = 'racial' | 'profile' | 'prestige';

export type AcquireResult = { ok: true } | { ok: false; reason: string };

export interface AcquireContext {
  level: number | undefined;
  isMageFamily: boolean;
  spentPoints: number;
  budget: number;
  hasOtherRank2: boolean; // un rang 2 est-il déjà pris dans une autre voie (bonus mage) ?
}

export interface RacialGrant {
  capabilityRank: number;      // rang de la capacité choix_capacite dans la voie de peuple
  allowedProfiles: string[];   // noms de profils autorisés ; ['*'] = tous
  allowsRank2: boolean;        // le peuple autorise une capacité de rang 2 à la place (Elfe haut, Humain) — non géré, affiché en note
}
