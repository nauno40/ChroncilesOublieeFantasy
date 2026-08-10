import React, { useState, useEffect } from 'react';
import type { Poison } from '../types/normalized';
import { PageContainer, SearchToolbar, Loader, CompendiumTable } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';
import { COLONNES_TABLE, LABEL_NOM } from '../domain/tablesCompendium';
import { DIF_ENDUIRE_ARME, DIF_RESISTER_POISON, DELAI_DEGRADATION, NOTE_PREMIERE_ATTAQUE } from '../domain/rules';

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
                {/* La note disait « un test de CON réussi réduit ou annule l'effet » sans
                    donner la difficulté ni la règle de l'arme enduite, pourtant la seule
                    que le livre détaille. */}
                Une victime mise en contact fait un test de CON difficulté {DIF_RESISTER_POISON}, que le MJ relève selon la
                virulence ; la colonne « Effet — Réussite » dit ce qu'elle subit malgré tout. Enduire une arme demande
                un test d’INT difficulté {DIF_ENDUIRE_ARME} : un échec gaspille la dose, un échec critique empoisonne le porteur.{' '}
                {NOTE_PREMIERE_ATTAQUE} Sur une créature morte, les composants se dégradent en {DELAI_DEGRADATION}.
            </p>
        </PageContainer>
    );
};
