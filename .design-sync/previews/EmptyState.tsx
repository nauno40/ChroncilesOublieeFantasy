import React from 'react';
import { EmptyState } from 'app';
import { Users, Ghost, BookOpen } from 'lucide-react';

/** L'état vide par défaut : un message, rien d'autre. */
export const MessageSeul = () => (
    <EmptyState message="Aucune créature ne correspond à votre recherche." />
);

/** Avec titre et icône — l'état vide d'une collection encore jamais remplie. */
export const AvecTitre = () => (
    <EmptyState
        icon={Users}
        title="Aucun personnage"
        message="Créez votre premier héros pour le retrouver ici, prêt à jouer."
    />
);

/** Avec une action : la sortie de l'état vide est à portée de clic. */
export const AvecAction = () => (
    <EmptyState
        icon={BookOpen}
        title="Votre bibliothèque est vide"
        message="Créez un peuple, une classe, une voie ou un sort, puis partagez-le à la communauté."
        action={{ label: 'Créer un contenu', onClick: () => {} }}
    />
);

/** Une recherche sans résultat dans le bestiaire. */
export const RechercheSansResultat = () => (
    <EmptyState icon={Ghost} message="Aucun monstre de ce niveau dans le bestiaire." />
);
