import React from 'react';
import { RaceSheet, ProfileSheet, VoieSheet, CapaciteSheet } from '../sheets';
import { homebrewToRaceVM, homebrewToProfileVM, homebrewToVoieVM, homebrewToCapaciteVM } from '../sheets/adapters/fromHomebrew';
import type { HomebrewEntry } from '../../services/homebrewService';

interface HomebrewFormPreviewProps {
    category: string;
    name: string;
    description: string;
    data: Record<string, unknown>;
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
export const HomebrewFormPreview: React.FC<HomebrewFormPreviewProps> = ({ category, name, description, data }) => {
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

    if (category === 'race') return <RaceSheet vm={homebrewToRaceVM(entry)} />;
    if (category === 'classe') return <ProfileSheet vm={homebrewToProfileVM(entry)} />;
    if (category === 'voie') return <VoieSheet vm={homebrewToVoieVM(entry)} />;
    if (category === 'capacite' || category === 'sort') return <CapaciteSheet vm={homebrewToCapaciteVM(entry)} />;

    return null; // catégories hors HOMEBREW_SHEET_CATEGORIES : pas de feuille dédiée
};
