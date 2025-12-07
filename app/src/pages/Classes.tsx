import React, { useState, useMemo } from 'react';
import profilesData from '../data/profiles.json';
import type { Profile } from '../types/normalized';
import { PageContainer, PageHeader, Card, Badge, FilterPanel } from '../components/common';
import { useSearch } from '../hooks';

const profiles = profilesData as Profile[];

export const Classes: React.FC = () => {
    const [selectedHitDie, setSelectedHitDie] = useState<string>('all');
    const [selectedMagic, setSelectedMagic] = useState<string>('all');

    // Filter profiles based on selected filters
    const filteredByFilters = useMemo(() => {
        return profiles.filter(profile => {
            if (selectedHitDie !== 'all' && profile.hitDie !== selectedHitDie) {
                return false;
            }
            if (selectedMagic === 'yes' && !profile.magicModifier) {
                return false;
            }
            if (selectedMagic === 'no' && profile.magicModifier) {
                return false;
            }
            return true;
        });
    }, [selectedHitDie, selectedMagic]);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        filteredByFilters,
        (profile, term) => profile.name.toLowerCase().includes(term.toLowerCase())
    );

    const activeFiltersCount = [selectedHitDie, selectedMagic].filter(f => f !== 'all').length;

    return (
        <PageContainer>
            <PageHeader
                title="Classes"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une classe..."
                subtitle={`${filteredItems.length} classe${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            <FilterPanel
                hasActiveFilters={activeFiltersCount > 0}
                onClearFilters={() => {
                    setSelectedHitDie('all');
                    setSelectedMagic('all');
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Dé de vie
                        </label>
                        <select
                            value={selectedHitDie}
                            onChange={(e) => setSelectedHitDie(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Tous les dés</option>
                            <option value="1D4">d4</option>
                            <option value="1D6">d6</option>
                            <option value="1D8">d8</option>
                            <option value="1D10">d10</option>
                            <option value="1D12">d12</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Magie
                        </label>
                        <select
                            value={selectedMagic}
                            onChange={(e) => setSelectedMagic(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Toutes</option>
                            <option value="yes">Avec magie</option>
                            <option value="no">Sans magie</option>
                        </select>
                    </div>
                </div>
            </FilterPanel>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((profile) => (
                    <Card
                        key={profile.id}
                        to={`/classes/${profile.id}`}
                        image={{
                            src: `/assets/profils/${profile.name}.jpg`,
                            alt: profile.name
                        }}
                    >
                        <h3 className="text-xl font-display font-bold text-primary-300 mb-3 group-hover:text-primary-200 transition-colors">
                            {profile.name}
                        </h3>

                        {profile.description && (
                            <p className="text-sm text-stone-400 line-clamp-3 mb-4">
                                {profile.description}
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {profile.hitDie && (
                                <Badge variant="success" size="sm">
                                    DV: {profile.hitDie}
                                </Badge>
                            )}
                            {profile.magicModifier && (
                                <Badge variant="primary" size="sm">
                                    Magie
                                </Badge>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
