import React, { useState, useMemo, useEffect } from 'react';
import type { Capacity, Profile, Voie } from '../types/normalized';
import { PageContainer, SearchToolbar, ContentCard, Badge, FilterPanel, SelectFiltre, GrilleFiltres, Loader } from '../components/common';
import { DataService } from '../services/dataService';
import { invitRecherche, compteurDuType } from '../domain/compendium';
import { idDepuisRef } from '../domain/iri';

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
                // Normalize capabilities data
                // La classe d'une capacité se lit sur le PROFIL, jamais sur la capacité ni
                // sur sa voie : l'API ne sert `profile` sur aucune des deux. Le code lisait
                // ces champs inexistants et ne pouvait donc produire que `null`.
                const classeParVoie = new Map<string, string>();
                for (const profil of p) {
                    for (const voie of profil.voies ?? []) {
                        const idVoie = idDepuisRef(voie);
                        if (idVoie) classeParVoie.set(idVoie, String(profil.id));
                    }
                }
                const normalizedCapacites = c.map((item) => {
                    const voieId = item.voieId || idDepuisRef(item.voie);
                    return {
                        ...item,
                        profileId: voieId ? classeParVoie.get(String(voieId)) ?? null : null,
                        voieId,
                        id: String(item.id),
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

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={invitRecherche('capacite')}
                count={{ n: filteredItems.length, ...compteurDuType('capacite')! }}
            />

            <FilterPanel
                hasActiveFilters={activeFiltersCount > 0}
                onClearFilters={() => {
                    setSelectedRank('all');
                    setSelectedProfile('all');
                    setSelectedType('all');
                }}
            >
                <GrilleFiltres>
                    <SelectFiltre
                        label="Type" toutLabel="Toutes les capacités" value={selectedType} onChange={setSelectedType}
                        options={[{ value: 'spell', label: 'Sorts uniquement' }, { value: 'non-spell', label: 'Hors sorts' }]}
                    />
                    <SelectFiltre
                        label="Rang" toutLabel="Tous les rangs" value={selectedRank} onChange={setSelectedRank}
                        options={[1, 2, 3, 4, 5].map(r => ({ value: String(r), label: `Rang ${r}` }))}
                    />
                    <SelectFiltre
                        label="Classe" toutLabel="Toutes les classes" value={selectedProfile} onChange={setSelectedProfile}
                        options={availableProfiles.map(pr => ({ value: String(pr.id), label: pr.name }))}
                    />
                </GrilleFiltres>
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
                        <ContentCard
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
                        </ContentCard>
                    );
                })}
            </div>
        </PageContainer>
    );
};
