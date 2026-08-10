/**
 * Lexique de l'interface : un concept, un nom, partout.
 *
 * L'audit de cohérence (docs/superpowers/specs/2026-08-08-coherence-interface-design.md)
 * a relevé six objets portant treize noms — la navigation disait « Races », la page de
 * type « Races », la Bibliothèque « Race / Peuple » et le formulaire « Peuple ». Ce
 * fichier fait autorité : navigation, titres de page, libellés de catégorie et cartes
 * d'outils s'y réfèrent au lieu de réécrire la chaîne sur place.
 *
 * **Casse : capitale au premier mot seulement.** Les petites capitales du thème sont une
 * affaire de CSS, pas de contenu — c'est ce qui permet de les changer sans toucher au
 * texte. Écrire « Suivi de Combat » ici figerait une décision typographique dans la
 * donnée.
 */
export const LEXIQUE = {
    /** COF2 dit « peuple ». « Race » est un import D&D, resté des premières fixtures. */
    peuples: 'Peuples',
    peuple: 'Peuple',
    classes: 'Classes',
    classe: 'Classe',
    voies: 'Voies',
    voie: 'Voie',
    capacites: 'Capacités & sorts',
    capacite: 'Capacité',
    /** Le sur-ensemble réel de la page : armes, armures ET matériel. */
    equipement: 'Équipement',
    creatures: 'Créatures',
    creature: 'Créature',
    /** Créatures créées par le meneur. « Monstre » n'existe nulle part ailleurs. */
    mesCreatures: 'Mes créatures',
    objetsMagiques: 'Objets magiques',
    etats: 'États préjudiciables',
    suiviCombat: 'Suivi de combat',
    des: 'Dés',
    ambiances: 'Ambiances',
    mesPersonnages: 'Mes personnages',
    mesCampagnes: 'Mes campagnes',
    bibliotheque: 'Bibliothèque',
    /** Onglets de source. « Mes créations » était déjà majoritaire (compendium). */
    sourceOfficiel: 'Officiel',
    sourceCommunaute: 'Communauté',
    sourceMiennes: 'Mes créations',
} as const;

export type CleLexique = keyof typeof LEXIQUE;
