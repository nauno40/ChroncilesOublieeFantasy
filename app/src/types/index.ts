export interface Field<T = string> {
    value: T;
    label?: string;
    format?: string;
    target_id?: string;
}

export interface CreatureData {
    name: string;
    test: string;
    dm: string;
    special: string | null;
    reach: string | null;
}

export interface CreatureAttackField extends Field {
    data: CreatureData[];
}

export interface CreatureCapability {
    target_id: string;
    label: string;
    rank: string;
    is_limited: string;
    is_magical: string;
    description: string;
    paths?: string;
}

export interface Creature {
    name: Field[];
    appearance: Field[];
    description: Field[];
    creature_family: Field[];
    environment: Field[];
    archetype: Field[];
    boss_type: Field[];
    boss_rank: Field[];
    level: Field[];
    category: Field[];
    size: Field[];
    str_mod: Field[];
    dex_mod: Field[];
    con_mod: Field[];
    int_mod: Field[];
    wis_mod: Field[];
    cha_mod: Field[];
    sup_abilities: Field[];
    defense: Field[];
    health_point: Field[];
    dmg_reduction: Field[];
    init: Field[];
    attacks: CreatureAttackField[];
    paths: Field[];
    special_capabilities: Field[];
    capabilities: CreatureCapability[];
    picture: (Field & { src?: string; alt?: string; width?: string; height?: string; creature_token_url?: string })[];
}

export interface Path {
    Voie: string;
    Type: string;
    profil: string;
    spell1: string;
    spell2: string;
    spell3: string;
    spell4: string;
    spell5: string;
    Note: string;
}

export interface Weapon {
    Nom: string;
    Type: string;
    Arme_de_jet: string;
    Portée: string;
    Rechargement: string;
    Critique: string;
    Dégâts: string;
    Dégâts_temporaires: string;
    Prix: string;
}

export interface Armor {
    Nom: string;
    Type: string;
    DEF: string;
    Prix: string;
    Comments: string;
}
