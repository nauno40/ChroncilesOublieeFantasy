import React from 'react';
import { AuthorTag } from 'app';

/** La couleur de l'avatar dérive du pseudo : deux auteurs ne se confondent pas. */
export const PlusieursAuteurs = () => (
    <div className="flex flex-col gap-2">
        {['Lyra', 'Bjorn', 'Alice', 'nauno40'].map(p => <AuthorTag key={p} pseudo={p} />)}
    </div>
);

/** Avec la visibilité : ce qui est partagé et ce qui ne l'est pas. */
export const AvecVisibilite = () => (
    <div className="flex flex-col gap-2">
        <AuthorTag pseudo="Lyra" visibility="public" />
        <AuthorTag pseudo="Bjorn" visibility="private" />
    </div>
);

/** Les deux tailles, et l'auteur inconnu. */
export const TaillesEtAnonyme = () => (
    <div className="flex flex-col gap-2">
        <AuthorTag pseudo="Alice" size="sm" />
        <AuthorTag pseudo="Alice" size="md" />
        <AuthorTag pseudo={null} />
    </div>
);
