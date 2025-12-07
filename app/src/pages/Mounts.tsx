import React from 'react';
import mountsData from '../data/Montures.json';
import type { Mount } from '../types';
import { PageContainer, PageHeader, Card, Badge } from '../components/common';
import { useSearch } from '../hooks';

const mounts = mountsData as Mount[];

export const Mounts: React.FC = () => {
    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        mounts,
        (mount, term) => mount.Nom.toLowerCase().includes(term.toLowerCase())
    );

    return (
        <PageContainer>
            <PageHeader
                title="Montures & Véhicules"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une monture..."
                subtitle={`${filteredItems.length} monture${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((mount, index) => (
                    <Card key={index}>
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors flex-1">
                                {mount.Nom}
                            </h3>
                            {mount.Prix && (
                                <Badge variant="warning" size="sm">
                                    {mount.Prix}
                                </Badge>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
