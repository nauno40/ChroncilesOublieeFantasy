/**
 * View-models des feuilles de présentation. Tous les champs sont optionnels sauf
 * `name` : une entrée communautaire est partiellement remplie et la feuille doit se
 * dégrader proprement. Un champ absent vaut `undefined` — jamais `null`, `""` ni `0`,
 * qui feraient afficher une section vide.
 */

export interface SheetVoieRef {
    id?: string;
    name: string;
    /** JSON libre de la voie, rendu tel quel par DynamicDetailsRenderer. */
    details?: Record<string, unknown>;
    capabilities?: SheetCapabilityRef[];
}

/**
 * Un modificateur de caractéristique tel que le compendium l'exprime réellement :
 * fixe (`stat` + `value`), au choix (`options` + `value`), ou formulé librement
 * (`description`). Un Record<string, number> perdrait les deux derniers cas.
 */
export interface SheetModifier {
    stat?: string;
    value?: number;
    options?: string[];
    description?: string;
}

export interface RaceSheetVM {
    name: string;
    description?: string;
    image?: string;
    modifiers?: SheetModifier[];
    speed?: string;
    minHeight?: number;
    maxHeight?: number;
    minWeight?: number;
    maxWeight?: number;
    startingAge?: number;
    lifeExpectancy?: number;
    abilities?: string;
    physicalTraits?: string;
    publicPerception?: string;
    roleplay?: string;
    typicalNames?: string;
    detailedDescription?: string;
    voies?: SheetVoieRef[];
}

/** Entrée libellée : l'officiel stocke maîtrises et lore en objets clé → texte
 * (`ClassDetail.tsx` fait `Object.entries(...)` et rend chaque paire avec son intitulé).
 * Un simple `string[]` perdrait l'intitulé et mélangerait par ex. « armes » et « contraintes ».
 */
export interface SheetLabelled {
    label: string;
    value: string;
}

/** Élément d'équipement de départ : item simple, choix entre alternatives, ou ensemble.
 * Récursif (`choice`/`set` contiennent eux-mêmes des `SheetEquipmentItem`) — reflète
 * `ProfileStartingEquipmentItem` du compendium, rendu par un renderItem récursif dans
 * `ClassDetail.tsx`. Une simple `string[]` perdrait la structure choix/ensemble.
 */
export interface SheetEquipmentItem {
    item?: string;
    stats?: string;
    examples?: string;
    choice?: (SheetEquipmentItem | string)[];
    set?: (SheetEquipmentItem | string)[];
}

/**
 * Famille de profil (Guerriers, Mages…) : une entité à part entière côté officiel, pas
 * une simple étiquette. `ClassDetail.tsx` en tire un sous-titre (« Famille des … »), des
 * stats de groupe (PV/niveau, dé de récupération, points de chance, carac. de magie de
 * repli) et deux blocs de texte (description, bonus de famille — ce dernier apparaît
 * deux fois dans la page officielle : sidebar ET onglet Légendes).
 */
export interface SheetFamily {
    name: string;
    /** "Famille des X" (ou `name` tel quel s'il commence déjà par "Famille") — calculé
     * une fois dans l'adaptateur, logique reprise telle quelle de `ClassDetail.tsx`. */
    subtitle?: string;
    description?: string;
    baseHp?: number;
    recoveryDie?: string;
    luckPoints?: number;
    manaStat?: string;
    /** `family.specials` — bloc "Bonus de Famille". */
    bonus?: string;
}

export interface ProfileSheetVM {
    name: string;
    description?: string;
    image?: string;
    family?: SheetFamily;
    hitDie?: string;
    /** Titre du panneau "Statistiques Vitales" (`profile.stats.profileType`) ; repli
     * générique "Statistiques Vitales" géré par la feuille, pas par l'adaptateur. */
    profileType?: string;
    magicStat?: string;
    armorMaxDef?: number;
    /** Caractéristiques COF2 numériques (AGI, CON…) : sur la page officielle, ce sont
     * les entrées de `profile.stats` autres que les 4 métadonnées connues
     * (`profileType`/`hpPerLevel`/`hitDie`/`magicStat`), rendues génériquement dans le
     * panneau "Statistiques Vitales" (`ClassDetail.tsx:158-168`). Jamais peuplé côté
     * officiel dans les fixtures actuelles, mais c'est le porteur naturel des
     * caractéristiques de départ saisies côté communautaire (« Stats de départ »).
     */
    stats?: Record<string, number>;
    /**
     * Maîtrises libellées. L'officiel les rend une par une avec leur intitulé
     * (armes, armures, boucliers, contraintes) : un simple string[] perdrait
     * l'intitulé et mélangerait « armes » et « contraintes ». Les champs homebrew
     * `weaponsAuth`/`armorAuth` (sans équivalent structuré côté officiel) sont
     * projetés ici en entrées « Armes »/« Armures », plutôt que dans une carte à part
     * qui casserait l'iso avec la fiche officielle.
     */
    masteries?: SheetLabelled[];
    /** Repli texte de l'officiel, affiché quand les maîtrises structurées manquent. */
    weaponsAndArmor?: string;
    startingEquipment?: (SheetEquipmentItem | string)[];
    note?: string;
    /** Lore libellé : l'officiel le stocke en objet et le rend par entrées clé/valeur. */
    lore?: SheetLabelled[];
    voies?: SheetVoieRef[];
}

export interface SheetCapabilityRef {
    /** Identifiant stable de la capacité (compendium officiel uniquement — les
     * capacités communautaires n'ont pas d'identifiant propre). Sert de clé React
     * fiable ; à défaut, la feuille retombe sur une clé composée (`rank`-`name`). */
    id?: string;
    rank?: number;
    name: string;
    description?: string;
    isSpell?: boolean;
    /** Usage limité : l'officiel affiche un badge « L ». */
    limited?: boolean;
    /** Capacité active (par opposition à passive) : l'officiel affiche un badge « Actif ». */
    active?: boolean;
    /** JSON libre de la capacité, rendu tel quel par DynamicDetailsRenderer. */
    details?: Record<string, unknown>;
    /** Effet, en lignes libres — la forme sous laquelle une capacité communautaire
     * porte son contenu principal, là où l'officiel le met dans `description`. Sans
     * ce champ, une capacité communautaire s'affiche vide au sein de sa voie. */
    effect?: string[];
    /** Détails en lignes libres (schéma communautaire), pendant textuel de `details`. */
    detailLines?: string[];
}

export interface VoieSheetVM {
    name: string;
    description?: string;
    category?: string;
    maxRank?: number;
    profileName?: string;
    /** JSON libre de la voie (`Voie.details`), rendu par DynamicDetailsRenderer sous le
     * titre "Détails & Mécaniques" (`VoieDetail.tsx`). Côté communautaire, les lignes
     * libres du champ `details` (schéma homebrew) portent le même rôle — mécaniques de
     * la voie elle-même, pas liées à une capacité précise — et sont regroupées dans une
     * entrée générique par `homebrewToVoieVM`. Absent si le champ n'est pas renseigné :
     * la section disparaît alors entièrement, pas de titre orphelin. */
    details?: Record<string, unknown>;
    capabilities?: SheetCapabilityRef[];
}

export interface CapaciteSheetVM {
    name: string;
    description?: string;
    rank?: number;
    actionType?: string;
    isSpell?: boolean;
    limited?: boolean;
    /** Capacité active (par opposition à passive) : `CapaciteDetail.tsx` affiche un badge « Actif ». */
    active?: boolean;
    /** Lignes d'effet communautaires (schéma homebrew `effect`, type 'lines') — forme
     * différente du champ `effect` de l'entité officielle (données de moteur de règles,
     * jamais affichées). Rendu tel quel si présent, sans tester la provenance. */
    effect?: string[];
    /** JSON libre de la capacité officielle (`Capacity.details`), rendu par
     * DynamicDetailsRenderer. Forme différente de son homonyme communautaire : le schéma
     * homebrew produit des lignes (cf. `detailLines`), pas un objet — unifier les deux
     * relève d'un chantier ultérieur. */
    details?: Record<string, unknown>;
    /** Lignes de détail communautaires (schéma homebrew `details`, type 'lines'). */
    detailLines?: string[];
    voieName?: string;
    /** Identifiant de la voie, pour que le badge `voieName` soit un lien cliquable
     * (`CapaciteDetail.tsx` linke vers `/voies/:id`) — absent côté communautaire. */
    voieId?: string;
}
