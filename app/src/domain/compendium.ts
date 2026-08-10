import { BookOpen, GraduationCap, Sparkles, Zap, Package, Wand2, AlertCircle, Skull, Footprints, Ghost, type LucideIcon } from 'lucide-react';
import { LEXIQUE } from './lexique';

/**
 * Identité des pages de type du compendium : nom, icône, et ce qu'on vient y faire.
 *
 * Ces trois choses allaient jusqu'ici chacune de son côté — le nom écrit dans la route,
 * l'icône seulement dans la navigation, et le sous-titre absent ou occupé par un compteur
 * de résultats. Les réunir ici garantit qu'une page et son entrée de navigation portent le
 * même symbole et le même mot.
 *
 * **Le sous-titre dit la fonction de la page**, jamais un compte de résultats : ce compte
 * décrit le filtrage, il vit avec la recherche (cf. `SearchToolbar`).
 */
export interface TypeCompendium {
    titre: string;
    icone: LucideIcon;
    fonction: string;
    /**
     * Le nom d'UN élément du type. Il sert à deux choses que l'onglet officiel et l'onglet
     * communautaire écrivaient chacun de son côté : l'invite de recherche
     * (« Rechercher un peuple… ») et le compteur de résultats (« 8 peuples »).
     *
     * Sans lui, le communautaire disait « Rechercher… » et « 4 résultats » là où l'officiel
     * nommait le type — deux vocabulaires pour la même liste.
     */
    singulier: string;
    /** Pluriel, quand il ne s'obtient pas en ajoutant un « s » (matériel → matériels). */
    pluriel?: string;
    /** Article de l'invite : « un peuple », « une voie ». */
    article: 'un' | 'une';
}

/** Invite de recherche d'un type — la même des deux côtés. */
/**
 * Sous-types d'une page qui en porte (l'équipement) : c'est le sous-type qui nomme la
 * liste, des deux côtés — la page officielle dit déjà « Rechercher une arme… ».
 */
const SOUS_TYPES: Record<string, TypeCompendium> = {
    arme: { titre: 'Armes', singulier: 'Arme', article: 'une', icone: Package, fonction: '' },
    armure: { titre: 'Armures', singulier: 'Armure', article: 'une', icone: Package, fonction: '' },
    materiel: { titre: 'Matériel', singulier: 'Matériel', pluriel: 'matériels', article: 'un', icone: Package, fonction: '' },
};

const metaDuType = (categorie: string): TypeCompendium | undefined =>
    TYPES_COMPENDIUM[categorie] ?? SOUS_TYPES[categorie];

export const invitRecherche = (categorie: string): string => {
    const meta = metaDuType(categorie);
    return meta ? `Rechercher ${meta.article} ${meta.singulier.toLowerCase()}…` : 'Rechercher…';
};

/** Compteur de résultats d'un type, dans les mots du type. */
export const compteurDuType = (categorie: string): { singulier: string; pluriel?: string } | undefined => {
    const meta = metaDuType(categorie);
    return meta ? { singulier: meta.singulier.toLowerCase(), pluriel: meta.pluriel?.toLowerCase() } : undefined;
};

export const TYPES_COMPENDIUM: Record<string, TypeCompendium> = {
    race: {
        titre: LEXIQUE.peuples,
        singulier: LEXIQUE.peuple,
        article: 'un' as const,
        icone: BookOpen,
        fonction: 'Les peuples jouables, leurs modificateurs, leurs langues et leur voie.',
    },
    classe: {
        titre: LEXIQUE.classes,
        singulier: LEXIQUE.classe,
        article: 'une' as const,
        icone: GraduationCap,
        fonction: 'Les profils, leurs cinq voies, leurs armes et armures autorisées.',
    },
    voie: {
        titre: LEXIQUE.voies,
        singulier: LEXIQUE.voie,
        article: 'une' as const,
        icone: Sparkles,
        fonction: 'Les chemins de progression, rang par rang.',
    },
    capacite: {
        titre: LEXIQUE.capacites,
        singulier: LEXIQUE.capacite,
        article: 'une' as const,
        icone: Zap,
        fonction: 'Toutes les capacités et tous les sorts, avec leurs effets.',
    },
    equipement: {
        titre: LEXIQUE.equipement,
        singulier: 'Équipement',
        pluriel: 'équipements',
        article: 'un' as const,
        icone: Package,
        fonction: 'Armes, armures et matériel : caractéristiques et prix.',
    },
    'objet-magique': {
        titre: LEXIQUE.objetsMagiques,
        singulier: 'Objet magique',
        pluriel: 'objets magiques',
        article: 'un' as const,
        icone: Wand2,
        fonction: 'Les objets enchantés, leur puissance et leur valeur.',
    },
    etat: {
        titre: LEXIQUE.etats,
        singulier: 'État',
        article: 'un' as const,
        icone: AlertCircle,
        fonction: 'Ce que chaque état inflige, et ce qu’il empêche.',
    },
    poison: {
        titre: 'Poisons',
        singulier: 'Poison',
        article: 'un' as const,
        icone: Skull,
        fonction: 'Effets, durées et délais, selon la réussite du test.',
    },
    creature: {
        titre: LEXIQUE.creatures,
        singulier: LEXIQUE.creature,
        article: 'une' as const,
        icone: Ghost,
        fonction: 'Le bestiaire officiel, vos créatures et celles de la communauté.',
    },
    piege: {
        titre: 'Pièges',
        singulier: 'Piège',
        article: 'un' as const,
        icone: Footprints,
        fonction: 'Difficultés de détection et de désamorçage, et ce qu’ils déclenchent.',
    },
};
