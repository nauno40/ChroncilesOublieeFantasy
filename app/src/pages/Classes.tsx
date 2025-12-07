import React from 'react';
import profilsData from '../data/Profils.json';
import type { Profile } from '../types';
import { PageContainer, PageHeader, Card, Badge } from '../components/common';
import { useSearch } from '../hooks';

const profils = profilsData as Profile[];

export const Classes: React.FC = () => {
    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        profils,
        (profil, term) => profil.Profil.toLowerCase().includes(term.toLowerCase())
    );

    return (
        <PageContainer>
            <PageHeader
                title="Classes"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une classe..."
                subtitle={`${filteredItems.length} classe${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((profil, index) => (
                    <Card
                        key={index}
                        to={`/classes/${index}`}
                        image={{
                            src: `/assets/profils/${profil.Profil}.jpg`,
                            alt: profil.Profil
                        }}
                    >
                        <h3 className="text-xl font-display font-bold text-primary-300 mb-3 group-hover:text-primary-200 transition-colors">
                            {profil.Profil}
                        </h3>

                        {profil.Description && (
                            <p className="text-sm text-stone-400 line-clamp-3 mb-4">
                                {profil.Description}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {profil["Dé de vie"] && (
                                <Badge variant="success" size="sm">
                                    DV: {profil["Dé de vie"]}
                                </Badge>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
