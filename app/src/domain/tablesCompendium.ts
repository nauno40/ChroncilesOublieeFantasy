/**
 * Colonnes des types du compendium que l'on présente en **tableau**.
 *
 * Source unique, partagée par la page officielle et la liste communautaire. Les deux
 * décrivaient jusqu'ici les mêmes colonnes chacune de son côté : `Traps.tsx` intitulait
 * « Détecter » ce que la liste communautaire appelait « Détection », et l'équipement
 * communautaire n'affichait que 4 des 9 colonnes de la table officielle. Une entrée
 * communautaire doit avoir la même tête que son équivalent officiel — donc les mêmes
 * colonnes, dans le même ordre, sous les mêmes intitulés.
 *
 * Les `key` sont volontairement celles des entités normalisées du compendium ET celles
 * du schéma communautaire (`HOMEBREW_SCHEMAS`) : ce sont les mêmes noms de champ, ce qui
 * permet de lire les deux sources avec le même accesseur.
 */
export interface ColonneCompendium {
    key: string;
    label: string;
    align?: 'center' | 'right';
    /** Texte long : retour à la ligne autorisé, tronqué à deux lignes. */
    wrap?: boolean;
    /** Valeur chiffrée ou codifiée (difficulté, dégâts) : police à chasse fixe. */
    mono?: boolean;
    /** Colonne d'appoint (note, complément) : plus petite et plus discrète. */
    discret?: boolean;
}

export const COLONNES_TABLE: Record<'poison' | 'piege', ColonneCompendium[]> = {
    poison: [
        { key: 'effectFail', label: 'Effet — Échec (test de CON)', wrap: true },
        { key: 'effectSuccess', label: 'Effet — Réussite', wrap: true },
        { key: 'duration', label: 'Durée' },
        { key: 'delay', label: 'Délai' },
        { key: 'note', label: 'Note', wrap: true, discret: true },
    ],
    piege: [
        { key: 'detectDifficulty', label: 'Détecter', align: 'center', mono: true },
        { key: 'disarmDifficulty', label: 'Désamorcer', align: 'center', mono: true },
        { key: 'effect', label: 'Effet', wrap: true },
        { key: 'complement', label: 'Complément', wrap: true, discret: true },
    ],
};

/** Intitulé de la première colonne (le nom) — « Poison », « Piège »… */
export const LABEL_NOM: Record<'poison' | 'piege', string> = {
    poison: 'Poison',
    piege: 'Piège',
};
