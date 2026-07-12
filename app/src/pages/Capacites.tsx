import React, { useState, useMemo, useEffect } from 'react';
import type { Capacity, Profile, Voie } from '../types/normalized';
import { PageContainer, PageHeader, Card, Badge, FilterPanel } from '../components/common';
import { DataService } from '../services/dataService';

export const Capacites: React.FC = () => {
    const [capacites, setCapacites] = useState<Capacity[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [voies, setVoies] = useState<Voie[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            DataService.getCapabilities(),
            DataService.getProfiles(),
            DataService.getVoies()
        ])
            .then(([c, p, v]) => {
                // Helper to extract ID from various formats (IRI string, object with id, etc.)
                const getResourceId = (resource: any): string | null => {
                    if (!resource) return null;
                    if (typeof resource === 'object') {
                        return String(resource.id || resource['@id'] || '');
                    }
                    if (typeof resource === 'string') {
                        // Handle IRI like "/api/profiles/123" or just "123"
                        return resource.includes('/') ? resource.split('/').pop() || null : resource;
                    }
                    return String(resource);
                };

                // Normalize capabilities data
                const normalizedCapacites = c.map((item: any) => {
                    const voieId = item.voieId || getResourceId(item.voie);
                    const associatedVoie = v.find((voie: any) => String(voie.id) === voieId);

                    // Priority: Explicit profile -> Profile via Voie
                    let profileId = item.profileId || getResourceId(item.profile);
                    if (!profileId && associatedVoie) {
                        profileId = associatedVoie.profileId || getResourceId((associatedVoie as any).profile) || null;
                    }

                    return {
                        ...item,
                        profileId: profileId,
                        voieId: voieId,
                        id: String(item.id)
                    };
                });
                setCapacites(normalizedCapacites);
                setProfiles(p);
                setVoies(v);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const [selectedRank, setSelectedRank] = useState<string>('all');
    const [selectedProfile, setSelectedProfile] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all'); // all | spell | non-spell

    const [searchTerm, setSearchTerm] = useState('');

    // Un sort COF2 est signalé par un astérisque dans son nom (ou le flag isSpell de l'API).
    const isSpellCapacite = (c: Capacity): boolean => c.isSpell ?? c.name.includes('*');

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
            if (selectedType === 'spell' && !isSpellCapacite(capacite)) {
                return false;
            }
            if (selectedType === 'non-spell' && isSpellCapacite(capacite)) {
                return false;
            }

            // Apply Search
            if (searchTerm && !capacite.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            return true;
        });
    }, [capacites, selectedRank, selectedProfile, selectedType, searchTerm]);

    // Get unique profiles that have capacites
    const availableProfiles = useMemo(() => {
        const profileIds = new Set(capacites.map(c => c.profileId).filter(Boolean));
        return profiles
            .filter(p => profileIds.has(String(p.id)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [capacites, profiles]);

    const activeFiltersCount = [selectedRank, selectedProfile, selectedType].filter(f => f !== 'all').length;

    if (loading) return <PageContainer><div className="p-8 text-center text-primary-200">Chargement...</div></PageContainer>;

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
                    setSelectedType('all');
                }}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Type
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Toutes les capacités</option>
                            <option value="spell">Sorts uniquement</option>
                            <option value="non-spell">Hors sorts</option>
                        </select>
                    </div>
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
                            }}
                            className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-200 focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            <option value="all">Toutes les classes</option>
                            {availableProfiles.map(p => (
                                <option key={p.id} value={String(p.id)}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FilterPanel>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((capacite) => {
                    // Lookup profile and voie names
                    const profile = capacite.profileId ? profiles.find(p => String(p.id) === capacite.profileId) : null;
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
                                    {isSpellCapacite(capacite) && (
                                        <Badge variant="info">
                                            ✦ Sort
                                        </Badge>
                                    )}
                                    {isLimited && (
                                        <Badge variant="danger">
                                            Limité
                                        </Badge>
                                    )}
                                    {capacite.active && (
                                        <Badge variant="warning">
                                            Actif
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
