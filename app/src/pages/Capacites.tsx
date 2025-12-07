import React from 'react';
import capacitesData from '../data/Capacités.json';
import type { Capability } from '../types';
import { PageContainer, PageHeader, Card, Badge } from '../components/common';
import { useSearch } from '../hooks';

const capacites = capacitesData as Capability[];

export const Capacites: React.FC = () => {
    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        capacites,
        (capacite, term) => capacite.Nom.toLowerCase().includes(term.toLowerCase())
    );

    return (
        <PageContainer>
            <PageHeader
                title="Capacités"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une capacité..."
                subtitle={`${filteredItems.length} capacité${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((capacite, index) => (
                    <Card
                        key={index}
                        to={`/capacites/${index}`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors flex-1">
                                {capacite.Nom}
                            </h3>
                            {capacite.rang && (
                                <Badge variant="primary">
                                    Rang {capacite.rang}
                                </Badge>
                            )}
                        </div>

                        {capacite.Desc && (
                            <p className="text-sm text-stone-400 line-clamp-4 mb-3">
                                {capacite.Desc}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {capacite.Profile && (
                                <Badge variant="secondary" size="sm">
                                    {capacite.Profile}
                                </Badge>
                            )}
                            {capacite.Voie && (
                                <Badge variant="secondary" size="sm">
                                    {capacite.Voie}
                                </Badge>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
