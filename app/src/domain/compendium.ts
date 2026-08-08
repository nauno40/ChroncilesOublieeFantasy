import { BookOpen, GraduationCap, Sparkles, Zap, Package, Wand2, AlertCircle, Skull, Footprints, type LucideIcon } from 'lucide-react';
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
}

export const TYPES_COMPENDIUM: Record<string, TypeCompendium> = {
    race: {
        titre: LEXIQUE.peuples,
        icone: BookOpen,
        fonction: 'Les peuples jouables, leurs modificateurs, leurs langues et leur voie.',
    },
    classe: {
        titre: LEXIQUE.classes,
        icone: GraduationCap,
        fonction: 'Les profils, leurs cinq voies, leurs armes et armures autorisées.',
    },
    voie: {
        titre: LEXIQUE.voies,
        icone: Sparkles,
        fonction: 'Les chemins de progression, rang par rang.',
    },
    capacite: {
        titre: LEXIQUE.capacites,
        icone: Zap,
        fonction: 'Toutes les capacités et tous les sorts, avec leurs effets.',
    },
    equipement: {
        titre: LEXIQUE.equipement,
        icone: Package,
        fonction: 'Armes, armures et matériel : caractéristiques et prix.',
    },
    'objet-magique': {
        titre: LEXIQUE.objetsMagiques,
        icone: Wand2,
        fonction: 'Les objets enchantés, leur puissance et leur valeur.',
    },
    etat: {
        titre: LEXIQUE.etats,
        icone: AlertCircle,
        fonction: 'Ce que chaque état inflige, et ce qu’il empêche.',
    },
    poison: {
        titre: 'Poisons',
        icone: Skull,
        fonction: 'Effets, durées et délais, selon la réussite du test.',
    },
    piege: {
        titre: 'Pièges',
        icone: Footprints,
        fonction: 'Difficultés de détection et de désamorçage, et ce qu’ils déclenchent.',
    },
};
