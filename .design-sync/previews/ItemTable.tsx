import React from 'react';
import { ItemTable } from 'app';

/** La table d'objets : nom et prix. */
export const Equipement = () => (
    <div className="w-[520px]">
        <ItemTable
            emptyMessage="Aucun objet."
            items={[
                { id: '1', name: 'Épée longue', price: '15 po' },
                { id: '2', name: 'Arc court', price: '25 po' },
                { id: '3', name: 'Cotte de mailles', price: '75 po' },
                { id: '4', name: 'Torche', price: '1 pc' },
            ]}
        />
    </div>
);

/** Vide : la table délègue son état vide à EmptyState. */
export const Vide = () => (
    <div className="w-[520px]"><ItemTable items={[]} emptyMessage="Aucune provision dans ce village." /></div>
);
