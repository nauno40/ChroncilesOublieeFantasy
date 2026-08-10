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
    /** Bonus chiffré : affiché préfixé d'un « + » (DEF d'armure). */
    plus?: boolean;
    /** Accent sémantique de la colonne, repris des tables officielles de l'équipement. */
    ton?: 'prix' | 'special' | 'def';
}

/** Modificateur de dégâts : les armes de contact ajoutent la FOR (COF2). Dérivé du type,
 *  ce n'est pas un champ stocké — les deux sources le calculent, donc ici, une seule fois. */
export const modDegats = (type: string | undefined): string =>
    type && type.toLowerCase().includes('contact') ? '+ FOR' : '—';

export type TypeTabulaire = 'poison' | 'piege' | 'arme' | 'armure' | 'materiel' | 'objet-magique';

export const COLONNES_TABLE: Record<TypeTabulaire, ColonneCompendium[]> = {
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
    // Les trois sous-types de la page Équipement. Une entrée communautaire n'a pas les
    // mêmes noms de champ pour tout : `properties` (une liste) y tient le rôle de
    // `requirements` / `comments` / `notes` officiels. C'est l'accesseur de la liste
    // communautaire qui fait la traduction — les colonnes, elles, restent les mêmes.
    arme: [
        { key: 'type', label: 'Type' },
        { key: 'damage', label: 'Dégâts', mono: true },
        { key: 'mod', label: 'Mod.', mono: true },
        { key: 'critical', label: 'Critique', mono: true },
        { key: 'range', label: 'Portée', mono: true },
        { key: 'reload', label: 'Rechargement' },
        { key: 'requirements', label: 'Spécial', wrap: true, ton: 'special' },
        { key: 'price', label: 'Prix', align: 'right', mono: true, ton: 'prix' },
    ],
    armure: [
        { key: 'type', label: 'Type' },
        { key: 'acBonus', label: 'Défense', mono: true, plus: true, ton: 'def' },
        { key: 'comments', label: 'Notes', wrap: true },
        { key: 'price', label: 'Prix', align: 'right', mono: true, ton: 'prix' },
    ],
    materiel: [
        { key: 'notes', label: 'Notes', wrap: true },
        { key: 'price', label: 'Prix', align: 'right', mono: true, ton: 'prix' },
    ],
    // Objets magiques. Les règles nomment leurs objets à l'intérieur des tables de tirage
    // et ne leur donnent ni propriétés ni prix : ces deux colonnes restent vides côté
    // officiel, et le prix se calcule avec l'évaluateur du générateur, resté dans les
    // outils du MJ.
    'objet-magique': [
        { key: 'type', label: 'Type' },
        { key: 'rarity', label: 'Rareté' },
        { key: 'properties', label: 'Propriétés', wrap: true },
        { key: 'price', label: 'Prix', align: 'right', mono: true, ton: 'prix' },
    ],
};

/** Intitulé de la première colonne (le nom) — « Poison », « Piège »… */
export const LABEL_NOM: Record<TypeTabulaire, string> = {
    poison: 'Poison',
    piege: 'Piège',
    arme: 'Nom',
    armure: 'Nom',
    materiel: 'Nom',
    'objet-magique': 'Objet',
};

/**
 * Sous-type d'une entrée d'équipement, officielle ou communautaire.
 *
 * La page officielle range en armures ce dont le `type` est « Bouclier » ou « Corps » ;
 * une entrée communautaire saisit son type en texte libre, mais renseigne `acBonus` pour
 * une protection et `damage` pour une arme. Les deux règles cohabitent ici pour que les
 * mêmes pastilles Armes / Armures / Matériel s'appliquent aux deux sources.
 */
export const sousTypeEquipement = (item: { type?: unknown; damage?: unknown; acBonus?: unknown }): 'arme' | 'armure' | 'materiel' => {
    const type = String(item.type ?? '').toLowerCase();
    if (['bouclier', 'corps'].includes(type) || /armure|bouclier|protection/.test(type)) return 'armure';
    // Un bonus de DEF nul ne fait pas une armure : c'est la valeur que laisse un champ
    // numérique jamais renseigné, pas une protection.
    if (Number(item.acBonus) > 0) return 'armure';
    if (item.damage !== undefined && item.damage !== null && item.damage !== '') return 'arme';
    if (/arme|épée|dague|arc|hache|masse|lance/.test(type)) return 'arme';
    return 'materiel';
};
