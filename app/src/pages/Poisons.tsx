import React, { useState, useEffect } from 'react';
import type { Poison } from '../types/normalized';
import { PageContainer, SearchToolbar, Loader, CompendiumTable } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';
import { COLONNES_TABLE, LABEL_NOM } from '../domain/tablesCompendium';

export const Poisons: React.FC = () => {
    const [poisons, setPoisons] = useState<Poison[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getPoisons()
            .then(setPoisons)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        poisons,
        (p, term) => (p.name + ' ' + (p.effectFail ?? '') + ' ' + (p.note ?? '')).toLowerCase().includes(term.toLowerCase()),
    );

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Rechercher un poison…"
                count={{ n: filteredItems.length, singulier: 'poison' }}
            />

            <CompendiumTable
                colonnes={COLONNES_TABLE.poison}
                labelNom={LABEL_NOM.poison}
                lignes={filteredItems}
                cle={p => p.id ?? p.name}
                nom={p => p.name}
            />

            <p className="text-[11px] text-stone-400 mt-3 italic">
                À la création d'un poison, le MJ choisit un type et une voie d'administration (ingestion, contact, blessure…). Un test de CON réussi réduit ou annule l'effet selon le type.
            </p>
        </PageContainer>
    );
};
