import React, { useState, useMemo } from 'react';
import capacitesData from '../data/capacites.json';
import profilesData from '../data/profiles.json';
import voiesData from '../data/voies.json';
import type { Capacity, Profile, Voie } from '../types/normalized';
import { PageContainer, PageHeader, Card, Badge, FilterPanel } from '../components/common';

const capacites = capacitesData as Capacity[];
const profiles = profilesData as Profile[];
const voies = voiesData as Voie[];

export const Capacites: React.FC = () => {
    const [selectedRank, setSelectedRank] = useState<string>('all');
    const [selectedProfile, setSelectedProfile] = useState<string>('all');
    const [selectedVoie, setSelectedVoie] = useState<string>('all');

    const [searchTerm, setSearchTerm] = useState('');

    // Filter capacites based on selected filters and search term
    const filteredItems = useMemo(() => {
        return capacites.filter(capacite => {
            // Apply Filters
            if (selectedRank !== 'all' && capacite.rank !== parseInt(selectedRank)) {
                return false;
            }
            if (selectedProfile !== 'all' && capacite.profileId !== selectedProfile) {
                return false;
            }
            if (selectedVoie !== 'all' && capacite.voieId !== selectedVoie) {
                return false;
            }

            // Apply Search
            if (searchTerm && !capacite.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            return true;
        });
    }, [selectedRank, selectedProfile, selectedVoie, searchTerm]);

    // Get unique profiles and voies that have capacites
    const availableProfiles = useMemo(() => {
        const profileIds = new Set(capacites.map(c => c.profileId).filter(Boolean));
        return profiles
            .filter(p => profileIds.has(p.id))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    const availableVoies = useMemo(() => {
        let filteredVoies = voies;

        // Filter by selected profile if applicable
        if (selectedProfile !== 'all') {
            filteredVoies = filteredVoies.filter(v => v.profileId === selectedProfile);
        }

        const activeVoieIds = new Set(capacites.map(c => c.voieId).filter(Boolean));
        return filteredVoies
            .filter(v => activeVoieIds.has(v.id))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedProfile]);

    const activeFiltersCount = [selectedRank, selectedProfile, selectedVoie].filter(f => f !== 'all').length;

    return (
        <PageContainer>
            <PageHeader
                title="Capacités"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une capacité..."
                subtitle={`${filteredItems.length} capacité${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            <FilterPanel
                hasActiveFilters={activeFiltersCount > 0}
                onClearFilters={() => {
                    setSelectedRank('all');
                    setSelectedProfile('all');
                    setSelectedVoie('all');
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Rang
                        </label>
                        <select
                            value={selectedRank}
                            onChange={(e) => setSelectedRank(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Tous les rangs</option>
                            <option value="1">Rang 1</option>
                            <option value="2">Rang 2</option>
                            <option value="3">Rang 3</option>
                            <option value="4">Rang 4</option>
                            <option value="5">Rang 5</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Classe
                        </label>
                        <select
                            value={selectedProfile}
                            onChange={(e) => {
                                setSelectedProfile(e.target.value);
                                setSelectedVoie('all'); // Reset voie when profile changes
                            }}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Toutes les classes</option>
                            {availableProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Voie
                        </label>
                        <select
                            value={selectedVoie}
                            onChange={(e) => setSelectedVoie(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Toutes les voies</option>
                            {availableVoies.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FilterPanel>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((capacite) => {
                    // Lookup profile and voie names
                    const profile = capacite.profileId ? profiles.find(p => p.id === capacite.profileId) : null;
                    const voie = capacite.voieId ? voies.find(v => v.id === capacite.voieId) : null;

                    let displayName = capacite.name;
                    let isLimited = false;

                    // Clean asterisks
                    displayName = displayName.replace(/\*/g, '');

                    // Handle "(L)" or " L" suffix removal as per user request
                    if (displayName.includes('(L)')) {
                        isLimited = true;
                        displayName = displayName.replace('(L)', '').trim();
                    } else if (displayName.endsWith(' L')) {
                        isLimited = true;
                        displayName = displayName.slice(0, -2).trim();
                    }

                    return (
                        <Card
                            key={capacite.id}
                            to={`/capacites/${capacite.id}`}
                        >
                            <div className="flex flex-col gap-3 mb-3">
                                <h3 className="text-xl font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors">
                                    {displayName}
                                </h3>
                                <div className="flex gap-2 flex-wrap">
                                    {isLimited && (
                                        <Badge variant="danger">
                                            Limité
                                        </Badge>
                                    )}
                                    {capacite.active ? (
                                        <Badge variant="warning">
                                            Actif
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">
                                            Passif
                                        </Badge>
                                    )}
                                    {capacite.rank && (
                                        <Badge variant="primary">
                                            Rang {capacite.rank}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {capacite.description && (
                                <p className="text-sm text-stone-400 line-clamp-4 mb-3">
                                    {capacite.description}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {profile && (
                                    <Badge variant="secondary" size="sm">
                                        {profile.name}
                                    </Badge>
                                )}
                                {voie && (
                                    <Badge variant="secondary" size="sm">
                                        {voie.name}
                                    </Badge>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </PageContainer>
    );
};
