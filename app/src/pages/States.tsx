import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HarmfulState } from '../types/normalized';
import { PageContainer, SearchToolbar, Loader, ContentCard } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';

export const States: React.FC = () => {
    const [states, setStates] = useState<HarmfulState[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        DataService.getStates()
            .then(setStates)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        states,
        (state, term) => state.name.toLowerCase().includes(term.toLowerCase()),
        searchParams.get('q') ?? ''
    );

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Rechercher un état…"
                count={{ n: filteredItems.length, singulier: 'état' }}
            />

            <div className="flex flex-wrap gap-3">
                {filteredItems.map((state, index) => (
                    <ContentCard
                        key={index}
                        mediaPosition="left"
                        className="min-w-[200px] max-w-[320px] flex-1"
                        media={state.image && (
                            <div className="w-12 h-12 flex-shrink-0 bg-stone-900/50 rounded-lg p-2 border border-white/5">
                                <img
                                    src={`/assets/states/${state.image}`}
                                    alt={state.name}
                                    className="w-full h-full object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                        )}
                    >
                        <h3 className="text-base font-display font-bold text-primary-300 mb-1 group-hover:text-primary-200 transition-colors">
                            {state.name}
                        </h3>
                        <p className="text-xs text-stone-400 line-clamp-2">
                            {state.description}
                        </p>
                    </ContentCard>
                ))}
            </div>
        </PageContainer>
    );
};
