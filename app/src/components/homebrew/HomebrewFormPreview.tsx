import React from 'react';
import { RaceSheet, ProfileSheet, VoieSheet, CapaciteSheet } from '../sheets';
import type { ReferencesDeclaration } from './HomebrewFields';
import { homebrewToRaceVM, homebrewToProfileVM, homebrewToVoieVM, homebrewToCapaciteVM } from '../sheets/adapters/fromHomebrew';
import type { HomebrewEntry } from '../../services/homebrewService';
import type { ChildDraft } from '../../services/homebrewChildren';

interface HomebrewFormPreviewProps {
    category: string;
    name: string;
    description: string;
    data: Record<string, unknown>;
    /** Brouillons de capacités en cours de saisie (catégorie 'voie' uniquement) — pour
     * que l'aperçu affiche la voie avec ses capacités, exactement comme la fiche de
     * consultation (`HomebrewDetail`). Ignoré pour toute autre catégorie. */
    drafts?: ChildDraft[];
    /** Références de déclaration, transmises aux feuilles : sans elles l'aperçu
     *  n'afficherait pas les pastilles, contredisant sa promesse d'être le rendu réel. */
    references?: ReferencesDeclaration;
}

/**
 * Aperçu « fiche telle qu'un lecteur la verra », rendu pendant la saisie du formulaire.
 * Fabrique une entrée provisoire (jamais enregistrée — les champs absents du type
 * `HomebrewEntry` prennent des valeurs neutres) et la fait passer par le même adaptateur
 * + la même feuille partagée que la page de consultation (`HomebrewDetail`) : ce qui
 * s'affiche ici est exactement ce que verra un lecteur, par construction — pas une
 * imitation du rendu.
 *
 * Ni bandeau propriétaire (`header`) ni lien de retour (`backTo`/`backLabel`) : ce sont
 * des éléments de la page de consultation, pas de la fiche elle-même.
 *
 * Les six catégories sans feuille dédiée (poison, piège, état préjudiciable, équipement,
 * objet magique, autre) n'ont pas d'aperçu : limite assumée par la conception.
 */
export const HomebrewFormPreview: React.FC<HomebrewFormPreviewProps> = ({ category, name, description, data, drafts, references }) => {
    const entry: HomebrewEntry = {
        id: 0,
        category,
        name,
        description: description || null,
        visibility: 'private',
        data,
        authorId: 0,
        authorPseudo: null,
        createdAt: '',
        updatedAt: '',
    };

    if (category === 'race') return <RaceSheet references={references} vm={homebrewToRaceVM(entry)} />;
    if (category === 'classe') return <ProfileSheet references={references} vm={homebrewToProfileVM(entry)} />;
    if (category === 'voie') {
        // Un brouillon n'a pas encore d'identifiant serveur tant qu'il n'est pas
        // enregistré : sans conséquence pour l'aperçu, `VoieSheet` retombe sur une clé
        // rang+nom (cf. VoieSheet.tsx). Les autres champs qu'un brouillon ne porte pas
        // (description, visibilité, auteur…) prennent les mêmes valeurs neutres que
        // `entry` ci-dessus — jamais lues par `homebrewToCapaciteVM` au-delà de `name`/
        // `description`/`data`/`category`.
        const enfants: HomebrewEntry[] = (drafts ?? []).map(brouillon => ({
            id: brouillon.id ?? 0,
            category: brouillon.category,
            name: brouillon.name,
            description: null,
            visibility: 'private',
            data: brouillon.data,
            authorId: 0,
            authorPseudo: null,
            createdAt: '',
            updatedAt: '',
        }));
        return <VoieSheet references={references} vm={homebrewToVoieVM(entry, enfants)} />;
    }
    if (category === 'capacite' || category === 'sort') return <CapaciteSheet references={references} vm={homebrewToCapaciteVM(entry)} />;

    return null; // catégories hors HOMEBREW_SHEET_CATEGORIES : pas de feuille dédiée
};
