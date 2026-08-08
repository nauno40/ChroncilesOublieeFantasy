import React from 'react';
import { SearchBar } from 'app';

/** Vide : le texte d'invite dit ce qu'on cherche. */
export const Vide = () => {
    const [v, setV] = React.useState('');
    return <div className="w-[420px]"><SearchBar value={v} onChange={setV} placeholder="Rechercher une créature…" /></div>;
};

/** Remplie : la valeur saisie et le bouton d'effacement. */
export const Remplie = () => {
    const [v, setV] = React.useState('gobelin');
    return <div className="w-[420px]"><SearchBar value={v} onChange={setV} placeholder="Rechercher une créature…" /></div>;
};
