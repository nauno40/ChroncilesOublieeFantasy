import { ApiService } from './api';

export type HomebrewVisibility = 'private' | 'public';

export interface HomebrewEntry {
    id: number;
    category: string;
    name: string;
    description: string | null;
    visibility: HomebrewVisibility;
    /** Champs structurés propres à la catégorie (cf. homebrewSchemas). */
    data: Record<string, unknown> | null;
    authorId: number;
    authorPseudo: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface HomebrewInput {
    category: string;
    name: string;
    description: string;
    visibility: HomebrewVisibility;
    data?: Record<string, unknown> | null;
}

/** Catégories de contenu homebrew (miroir des types du compendium). */
export const HOMEBREW_CATEGORIES: { value: string; label: string }[] = [
    { value: 'sort', label: 'Sort' },
    { value: 'capacite', label: 'Capacité' },
    { value: 'race', label: 'Race / Peuple' },
    { value: 'classe', label: 'Classe / Profil' },
    { value: 'voie', label: 'Voie' },
    { value: 'objet-magique', label: 'Objet magique' },
    { value: 'equipement', label: 'Équipement' },
    // Les créatures ont leur propre espace partageable (« Mes Monstres ») : pas de doublon ici.
    { value: 'poison', label: 'Poison' },
    { value: 'piege', label: 'Piège' },
    { value: 'etat', label: 'État préjudiciable' },
    { value: 'autre', label: 'Autre' },
];

export const categoryLabel = (value: string): string =>
    HOMEBREW_CATEGORIES.find(c => c.value === value)?.label ?? value;

/**
 * Valide qu'une valeur candidate (ex. paramètre de requête `retour`) désigne bien un
 * chemin interne au site, pour éviter toute redirection ouverte.
 *
 * Un filtrage par préfixes (`startsWith('/') && !startsWith('//')`) est fragile : il
 * laisse passer des formes comme `/\exemple.tld`, que les navigateurs interprètent
 * comme `//exemple.tld` (l'antislash vaut barre oblique dans la partie autorité d'une
 * URL) — donc une redirection hors site. La seule approche robuste est de laisser le
 * navigateur résoudre l'URL puis comparer son origine à celle du site.
 *
 * Renvoie le chemin (pathname + search + hash) si la valeur résout vers la même
 * origine que le site, sinon `null`.
 *
 * `origine` est injectable (par défaut `window.location.origin`) pour rester testable
 * en environnement Node, sans DOM — le paramètre par défaut n'est évalué que si
 * l'appelant ne le fournit pas.
 */
export const cheminInterne = (valeur: string | null, origine: string = window.location.origin): string | null => {
    if (!valeur) return null;
    try {
        const url = new URL(valeur, origine);
        if (url.origin !== origine) return null;
        return url.pathname + url.search + url.hash;
    } catch {
        return null;
    }
};

/** Page de la catégorie (liste) vers laquelle revenir après suppression/duplication/enregistrement. */
export const categoryPath = (category: string): string => {
    if (category === 'race') return '/races';
    if (category === 'classe') return '/classes';
    if (category === 'voie') return '/voies';
    if (category === 'capacite' || category === 'sort') return '/capacites';
    return '/bibliotheque';
};

export const HomebrewService = {
    // Renvoie les entrées visibles : les miennes (privées + publiques) + les publiques d'autrui.
    getAll: () => ApiService.getAll<HomebrewEntry>('homebrew_entries?pagination=false&itemsPerPage=500'),
    getById: (id: number | string) => ApiService.getOne<HomebrewEntry>('homebrew_entries', id),
    create: (data: HomebrewInput) => ApiService.post<HomebrewEntry>('homebrew_entries', data),
    update: (id: number, data: Partial<HomebrewInput>) => ApiService.patch<HomebrewEntry>('homebrew_entries', id, data),
    remove: (id: number) => ApiService.delete('homebrew_entries', id),
};
