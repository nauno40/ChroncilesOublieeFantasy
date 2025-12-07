import React from 'react';
import statesData from '../data/states.json';
import type { HarmfulState } from '../types/normalized';
import { PageContainer, PageHeader, Card } from '../components/common';
import { useSearch } from '../hooks';

const states = statesData as HarmfulState[];

export const States: React.FC = () => {
    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        states,
        (state, term) => state.name.toLowerCase().includes(term.toLowerCase())
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
                        {state.image && (
                            <img
                                src={`/assets/states/${state.image}`}
                                alt={state.name}
                                className="w-full h-48 object-cover"
                            />
                        )}

                        <h3 className="text-xl font-display font-bold text-primary-300 mb-3 group-hover:text-primary-200 transition-colors">
                            {state.name}
                        </h3>

                        <p className="text-sm text-stone-400 line-clamp-4">
                            {state.description}
                        </p>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
