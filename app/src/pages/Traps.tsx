import React, { useState, useEffect } from 'react';
import type { Trap } from '../types/normalized';
import { PageContainer, SearchToolbar, Loader, CompendiumTable } from '../components/common';
import { useSearch } from '../hooks';
import { invitRecherche, compteurDuType } from '../domain/compendium';
import { DataService } from '../services/dataService';
import { COLONNES_TABLE, LABEL_NOM } from '../domain/tablesCompendium';

export const Traps: React.FC = () => {
    const [traps, setTraps] = useState<Trap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getTraps()
            .then(setTraps)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        traps,
        (t, term) => (t.name + ' ' + (t.effect ?? '') + ' ' + (t.complement ?? '')).toLowerCase().includes(term.toLowerCase()),
    );

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={invitRecherche('piege')}
                count={{ n: filteredItems.length, ...compteurDuType('piege')! }}
            />

            <CompendiumTable
                colonnes={COLONNES_TABLE.piege}
                labelNom={LABEL_NOM.piege}
                lignes={filteredItems}
                cle={t => t.id ?? t.name}
                nom={t => t.name}
            />

            <p className="text-[11px] text-stone-400 mt-3 italic">
                « Détecter » / « Désamorcer » indiquent la difficulté des tests correspondants. Un « DM/2 sur test AGI » signifie que la victime subit la moitié des dommages si elle réussit un test d'AGI à la difficulté indiquée.
            </p>
        </PageContainer>
    );
};
