// Modèle de personnage — forme backend (refonte Phase 2, cf. spec §4).
// Le sac `data` (stats/modifiers dupliqués, voies par nom, valeurs dérivées stockées)
// est remplacé par trois racines : `caracs` (valeurs de base), `playState` (état de
// jeu mutable) et `characterVoies` (voies référencées par IRI). Les valeurs dérivées
// (PV max, DEF, Init, PC, PM, dé de récup.) ne sont PLUS stockées : elles se calculent
// à l'affichage (cofRules).

export type CaracKey = 'AGI' | 'CON' | 'FOR' | 'PER' | 'CHA' | 'INT' | 'VOL';
export type Caracs = Record<CaracKey, number>; // valeurs de base ‑2..+5

export type VoieSource = 'profil' | 'peuple' | 'prestige' | 'hybride';

/** Référence d'une voie acquise par un personnage : IRI compendium + nb de rangs. */
export interface CharacterVoieRef {
    voie: string;            // IRI compendium, ex. "/api/voies/2191"
    rank: number;            // nb de rangs acquis (0..maxRank) ; rank N ⇒ capacités 1..N
    source: VoieSource;
    choices?: Record<string, unknown>;
}

export interface CharacterWeapon { name: string; atkMod: number; dmg: string; special: string; }

export type ItemBonusTarget = 'def' | 'init' | 'pv' | 'rd' | 'attaque' | 'dm';
export interface MagicItem {
    name: string;
    target: ItemBonusTarget;
    value: number;
    equipped: boolean;
}

export type UsagePeriod = 'jour' | 'combat' | 'round' | 'autre';
export interface Usage {
    name: string;
    max: number;
    used: number;
    per: UsagePeriod;
}

export interface Companion {
    name: string;
    ref?: string;                          // IRI créature bestiaire (si issu du compendium)
    hp: { current: number; max: number };
    def: number;
    init: number;
    notes?: string;
}

export interface ActiveState {
    name: string;
    group?: string;                        // groupe d'exclusion (une seule active par groupe)
    active: boolean;
    target: ItemBonusTarget;               // def | init | pv | rd | attaque | dm
    value: number;
}

/** État de jeu mutable — seuls les `current`/choix du joueur y sont persistés. */
export interface PlayState {
    hp: { current: number };
    mana: { current: number };
    luck: { current: number };
    recovery: { used: number };
    money: { po?: number; pa: number; pc?: number };
    equipment: string[];
    rp: { ideal: string; flaw: string; secret?: string; notes?: string };
    languages: string[];
    talents?: string[];                                             // talents secondaires (partagent le budget des langues)
    physical?: { age?: string; height?: string; weight?: string }; // saisie libre (physique)
    // PV hybrides (COF2 chap. 9) : familles finançant chaque niveau 2..N (1 ou 2 par
    // niveau ; voie de peuple ⇒ famille du profil principal). Absent/vide ⇒ profil principal.
    hpByLevel?: Record<string, string[]>;
    // Équipement de protection et armes — état de jeu (parité Phase 2).
    protection: { armor: { name: string; def: number }; shield: { name: string; def: number } };
    weapons: CharacterWeapon[];
    magicItems?: MagicItem[];              // objets à bonus mécaniques (équipés ⇒ dérivation)
    usages?: Usage[];                      // suivi des capacités à usage limité (aide de table)
    companions?: Companion[];              // roster de compagnons / invocations / montures
    // Substitution de caractéristique par attaque (COF2 §7 #5). Absent ⇒ défauts FOR/AGI.
    caracSubstitutions?: { contact?: CaracKey; distance?: CaracKey };
    activeStates?: ActiveState[];          // buffs/postures activables (bonus quand actifs)
}

export interface Character {
    id?: number;
    name: string;
    level: number;
    race?: string | { '@id': string; id: number; name: string };
    profile?: string | { '@id': string; id: number; name: string };
    caracs: Caracs;
    playState: PlayState;
    characterVoies: CharacterVoieRef[];
    campaignId?: number;
    createdAt?: string;
    updatedAt?: string;
}
