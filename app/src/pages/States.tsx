import React, { useState, useEffect } from 'react';
import type { HarmfulState } from '../types/normalized';
import { PageContainer, PageHeader } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';

export const States: React.FC = () => {
    const [states, setStates] = useState<HarmfulState[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getStates()
            .then(setStates)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        states,
        (state, term) => state.name.toLowerCase().includes(term.toLowerCase())
    );

    if (loading) return <PageContainer><div className="p-8 text-center text-primary-200">Chargement...</div></PageContainer>;

    return (
        <PageContainer>
            <PageHeader
                title="États Préjudiciables"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher un état..."
                subtitle={`${filteredItems.length} état${filteredItems.length > 1 ? 's' : ''} trouvé${filteredItems.length > 1 ? 's' : ''}`}
            />

            <div className="flex flex-wrap gap-3">
                {filteredItems.map((state, index) => (
                    <div
                        key={index}
                        className="glass-panel rounded-xl p-4 border border-white/5 hover:border-primary-500/30 transition-all group flex items-center gap-3 min-w-[200px]"
                    >
                        {state.image && (
                            <div className="w-12 h-12 flex-shrink-0 bg-stone-900/50 rounded-lg p-2 border border-white/5">
                                <img
                                    src={`/assets/states/${state.image}`}
                                    alt={state.name}
                                    className="w-full h-full object-contain brightness-0 invert opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-display font-bold text-primary-300 mb-1 group-hover:text-primary-200 transition-colors">
                                {state.name}
                            </h3>
                            <p className="text-xs text-stone-400 line-clamp-2">
                                {state.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};
