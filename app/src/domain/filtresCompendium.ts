import type { OptionFiltre } from '../components/common/SelectFiltre';
import { LEXIQUE } from './lexique';
import { FAMILLES, familleDepuisNom } from './rules/health';

/**
 * Filtres d'une liste communautaire, par catégorie.
 *
 * Les pages officielles filtrent depuis toujours — par rang, par type de capacité, par
 * catégorie de voie — tandis que la liste communautaire n'offrait qu'une recherche par nom.
 * Passé quelques dizaines d'entrées, les deux onglets ne se parcouraient plus de la même
 * façon, ce qui est exactement l'écart que ce chantier corrige.
 *
 * Chaque filtre lit une clé du `data` communautaire (celles de `HOMEBREW_SCHEMAS`) et la
 * compare à la valeur choisie. `lit` permet de normaliser ce que l'auteur a saisi : le
 * schéma communautaire laisse souvent du texte libre là où l'officiel a une énumération.
 */
export interface FiltreCompendium {
    /** Clé de `entry.data` interrogée. */
    key: string;
    label: string;
    toutLabel: string;
    options: OptionFiltre[];
    /** Normalise la valeur saisie avant comparaison. Par défaut, la valeur telle quelle. */
    lit?: (valeur: unknown) => string;
}

/** Un rang de capacité, de 1 à 5 — les rangs d'une voie COF2. */
const RANGS: OptionFiltre[] = [1, 2, 3, 4, 5].map(r => ({ value: String(r), label: `Rang ${r}` }));

const oui = (v: unknown) => (v === true || v === 'true' ? 'spell' : 'non-spell');

export const FILTRES_COMMUNAUTAIRES: Record<string, FiltreCompendium[]> = {
    // Mêmes axes que la page officielle des capacités : nature et rang.
    capacite: [
        {
            key: 'isSpell', label: 'Type', toutLabel: 'Toutes les capacités', lit: oui,
            options: [{ value: 'spell', label: 'Sorts uniquement' }, { value: 'non-spell', label: 'Hors sorts' }],
        },
        { key: 'rank', label: 'Rang', toutLabel: 'Tous les rangs', options: RANGS, lit: v => String(v ?? '') },
    ],
    sort: [
        { key: 'rank', label: 'Rang', toutLabel: 'Tous les rangs', options: RANGS, lit: v => String(v ?? '') },
    ],
    classe: [
        // Même axe que la page officielle. Le schéma communautaire ne demande pas de dé —
        // il n'a pas à le demander : le livre le déduit de la famille, et la fiche
        // communautaire l'affiche déjà par ce chemin.
        {
            key: 'family', label: 'Dé de vie', toutLabel: 'Tous les dés',
            lit: v => FAMILLES[familleDepuisNom(typeof v === 'string' ? v : undefined) ?? '']?.recoveryDie ?? '',
            options: ['d6', 'd8', 'd10'].map(d => ({ value: d, label: d })),
        },
        {
            key: 'magicStat', label: 'Magie', toutLabel: 'Toutes les classes',
            lit: v => (v ? 'oui' : 'non'),
            options: [{ value: 'oui', label: 'Lanceurs de sorts' }, { value: 'non', label: 'Sans magie' }],
        },
    ],
};

/**
 * Pastilles de sous-type d'une liste communautaire — le pendant des pastilles de la page
 * officielle. Les voies s'y prêtent : leur type est UN critère, que l'officiel montre déjà
 * en pastilles plutôt qu'en panneau de filtres.
 *
 * `lit` normalise le texte libre du schéma communautaire ; l'identifiant est la valeur
 * comparée, et `all` ne filtre rien.
 */
export interface PastillesCommunautaires {
    key: string;
    options: { id: string; label: string }[];
    lit: (valeur: unknown) => string;
}

export const PASTILLES_COMMUNAUTAIRES: Record<string, PastillesCommunautaires> = {
    voie: {
        key: 'category',
        lit: v => String(v ?? '').toLowerCase().trim(),
        // Mêmes intitulés et même ordre que les pastilles officielles : « Personnage »
        // et non « Profil », que seul le placeholder du formulaire employait.
        options: [
            { id: 'all', label: 'Toutes' },
            { id: 'personnage', label: 'Personnage' },
            { id: 'peuple', label: LEXIQUE.peuple },
            { id: 'créature', label: LEXIQUE.creature },
            { id: 'prestige', label: 'Prestige' },
        ],
    },
};

/** Filtre une liste d'entrées communautaires selon les choix courants. */
export const appliquerFiltres = <T extends { data?: Record<string, unknown> | null }>(
    entries: T[],
    filtres: FiltreCompendium[],
    choix: Record<string, string>,
): T[] =>
    entries.filter(entry =>
        filtres.every(filtre => {
            const choisi = choix[filtre.key];
            if (!choisi || choisi === 'all') return true;
            const brut = (entry.data ?? {})[filtre.key];
            const valeur = filtre.lit ? filtre.lit(brut) : String(brut ?? '');
            return valeur === choisi;
        }));
