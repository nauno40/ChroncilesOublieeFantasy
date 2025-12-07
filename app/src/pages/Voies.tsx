import React, { useState, useMemo } from 'react';
import voiesData from '../data/voies.json';
import profilesData from '../data/profiles.json';
import type { Voie, Profile } from '../types/normalized';
import { PageContainer, PageHeader, Card, Badge, FilterPanel } from '../components/common';
import { useSearch } from '../hooks';

const voies = voiesData as Voie[];
const profiles = profilesData as Profile[];

export const Voies: React.FC = () => {
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedProfile, setSelectedProfile] = useState<string>('all');

    // Filter voies based on selected filters
    const filteredByFilters = useMemo(() => {
        return voies.filter(voie => {
            if (selectedType !== 'all' && voie.type !== selectedType) {
                return false;
            }
            if (selectedProfile !== 'all' && voie.profileId !== selectedProfile) {
                return false;
            }
            return true;
        });
    }, [selectedType, selectedProfile]);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        filteredByFilters,
        (voie, term) => voie.name.toLowerCase().includes(term.toLowerCase())
    );

    // Get unique profiles that have voies
    const availableProfiles = useMemo(() => {
        const profileIds = new Set(voies.map(v => v.profileId).filter(Boolean));
        return profiles
            .filter(p => profileIds.has(p.id))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    const activeFiltersCount = [selectedType, selectedProfile].filter(f => f !== 'all').length;

    return (
        <PageContainer>
            <PageHeader
                title="Voies"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une voie..."
                subtitle={`${filteredItems.length} voie${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            <FilterPanel
                hasActiveFilters={activeFiltersCount > 0}
                onClearFilters={() => {
                    setSelectedType('all');
                    setSelectedProfile('all');
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Type
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Tous les types</option>
                            <option value="Personnage">Personnage</option>
                            <option value="Race">Race</option>
                            <option value="Créature">Créature</option>
                            <option value="Prestige">Prestige</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Classe
                        </label>
                        <select
                            value={selectedProfile}
                            onChange={(e) => setSelectedProfile(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Toutes les classes</option>
                            {availableProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FilterPanel>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((voie) => (
                    <Card
                        key={voie.id}
                        to={`/voies/${voie.id}`}
                    >
                        <h3 className="text-xl font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors mb-3">
                            {voie.name}
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="primary" size="sm">
                                {voie.type}
                            </Badge>
                            {voie.profileId && (
                                <Badge variant="secondary" size="sm">
                                    {profiles.find(p => p.id === voie.profileId)?.name}
                                </Badge>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
