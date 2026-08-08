import React, { useState, useMemo, useEffect } from 'react';
import type { Profile } from '../types/normalized';
import { PageContainer, SearchToolbar, ContentCard, CardStats, FilterPanel, Loader, onImageError } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';

/**
 * Ce qu'une carte de classe montre en pied : les PV par niveau, la limite d'armure et la
 * caractéristique de magie. Trois chiffres qui décident d'un choix de profil, et qui
 * dormaient dans la donnée pendant qu'on n'affichait qu'un badge « Magie ».
 * `armorMaxDef` vaut -1 pour « aucune armure » (cf. AppFixtures).
 */
const statsDeLaClasse = (profile: Profile) => {
    const stats: { label: string; value: React.ReactNode }[] = [];
    // Les PV par niveau viennent de la famille de profil : c'est ce que l'API sert dans la
    // liste (le dé de vie, lui, n'y figure pas).
    if (profile.stats?.hpPerLevel) stats.push({ label: 'PV/niv.', value: profile.stats.hpPerLevel });
    if (profile.armorMaxDef !== undefined && profile.armorMaxDef !== null) {
        stats.push({ label: 'Armure', value: profile.armorMaxDef < 0 ? 'aucune' : `DEF +${profile.armorMaxDef}` });
    }
    if (profile.magicStat) stats.push({ label: 'Magie', value: profile.magicStat });
    return stats;
};

export const Classes: React.FC = () => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getProfiles()
            .then(setProfiles)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

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
    }, [profiles, selectedHitDie, selectedMagic]);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        filteredByFilters,
        (profile, term) => profile.name.toLowerCase().includes(term.toLowerCase())
    );

    const activeFiltersCount = [selectedHitDie, selectedMagic].filter(f => f !== 'all').length;

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Rechercher une classe…"
                count={{ n: filteredItems.length, singulier: 'classe' }}
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
                        <select aria-label="Dé de vie"
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
                        <select aria-label="Magie"
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
                    <ContentCard
                        key={profile.id}
                        to={`/classes/${profile.id}`}
                        media={
                            <img
                                src={profile.imageUrl || `/assets/profils/${profile.name}.jpg`}
                                alt={profile.name}
                                onError={onImageError(profile.name)}
                                className="w-full h-48 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                            />
                        }
                        footer={<CardStats stats={statsDeLaClasse(profile)} />}
                    >
                        <h3 className="text-xl font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors">
                            {profile.name}
                        </h3>
                        {profile.description && (
                            <p className="text-sm text-stone-400 line-clamp-3 mt-1">
                                {profile.description}
                            </p>
                        )}
                    </ContentCard>
                ))}
            </div>
        </PageContainer>
    );
};
