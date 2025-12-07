import React from 'react';
import voiesData from '../data/Voies.json';
import type { Path } from '../types';
import { PageContainer, PageHeader, Card, Badge } from '../components/common';
import { useSearch } from '../hooks';

const voies = voiesData as Path[];

export const Voies: React.FC = () => {
    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        voies,
        (voie, term) => voie.Voie.toLowerCase().includes(term.toLowerCase())
    );

    return (
        <PageContainer>
            <PageHeader
                title="Voies"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une voie..."
                subtitle={`${filteredItems.length} voie${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((voie, index) => (
                    <Card
                        key={index}
                        to={`/voies/${index}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors flex-1">
                                {voie.Voie}
                            </h3>
                            {voie.profil && (
                                <Badge variant="secondary" size="sm">
                                    {voie.profil}
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="primary" size="sm">
                                {voie.Type}
                            </Badge>
                        </div>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
