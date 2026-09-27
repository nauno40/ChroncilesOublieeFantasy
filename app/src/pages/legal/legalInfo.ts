/**
 * Informations légales de l'exploitant du site, centralisées ici pour n'être saisies
 * qu'une fois — les trois pages légales (CGU, mentions légales, confidentialité) les
 * reprennent plutôt que de les répéter chacune à sa façon.
 *
 * Les champs marqués `[À COMPLÉTER]` sont des informations que seul l'exploitant peut
 * fournir (identité légale, adresse, hébergeur) — jamais inventées. Tant qu'un champ
 * porte cette valeur, le bandeau « brouillon » des pages légales reste justifié.
 */
export const LEGAL_INFO = {
    /** Nom à afficher (personne physique, association ou société). */
    exploitantNom: '[À COMPLÉTER]',
    /** Statut : "particulier", "association loi 1901", "société [forme]"… */
    exploitantStatut: '[À COMPLÉTER]',
    /**
     * Adresse postale. Pour un particulier n'agissant pas à titre professionnel, la loi
     * (LCEN, art. 6-III) permet de ne pas la publier et de la communiquer uniquement à
     * l'hébergeur, à charge pour lui de la transmettre sur réquisition judiciaire — à
     * évoquer avec l'hébergeur retenu si l'anonymat est souhaité.
     */
    adressePostale: '[À COMPLÉTER]',
    /** Adresse e-mail affichée publiquement pour les questions/réclamations. */
    contactEmail: '[À COMPLÉTER]',
    /** Nom et adresse de l'hébergeur (inconnu tant que le site n'est pas déployé en production). */
    hebergeurNom: '[À COMPLÉTER]',
    hebergeurAdresse: '[À COMPLÉTER]',
} as const;

/** Date d'écriture de ce brouillon — à mettre à jour à chaque révision du contenu. */
export const DERNIERE_MISE_A_JOUR = '27 septembre 2026';
