import React from 'react';
import statesData from '../data/Etats.json';
import type { HarmfulState } from '../types';
import { PageContainer, PageHeader, Card } from '../components/common';
import { useSearch } from '../hooks';

const states = statesData as HarmfulState[];

export const States: React.FC = () => {
    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        states,
        (state, term) => state.Name.toLowerCase().includes(term.toLowerCase())
    );

    return (
        <PageContainer>
            <PageHeader
                title="États Préjudiciables"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher un état..."
                subtitle={`${filteredItems.length} état${filteredItems.length > 1 ? 's' : ''} trouvé${filteredItems.length > 1 ? 's' : ''}`}
            />

            <div className="grid md:grid-cols-2 gap-4">
                {filteredItems.map((state, index) => (
                    <Card key={index}>
                        <div className="flex items-start gap-4">
                            {state.Image && (
                                <div className="w-16 h-16 flex-shrink-0 bg-stone-900/50 rounded-xl p-3 border border-white/5">
                                    <img src={state.Image} alt={state.Name} className="w-full h-full object-contain opacity-70" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-display font-bold text-primary-300 mb-2">
                                    {state.Name}
                                </h3>
                                <p className="text-stone-300 text-sm leading-relaxed">
                                    {state.Description}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
