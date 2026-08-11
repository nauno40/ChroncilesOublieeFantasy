import React, { useState, useMemo, useEffect } from 'react';
import type { Profile } from '../types/normalized';
import { PageContainer, SearchToolbar, ContentCard, CardMedia, CardStats, FilterPanel, SelectFiltre, GrilleFiltres, Loader } from '../components/common';
import { useSearch } from '../hooks';
import { invitRecherche, compteurDuType } from '../domain/compendium';
import { DataService } from '../services/dataService';

/**
 * Ce qu'une carte de classe montre en pied : les PV par niveau, la limite d'armure et la
 * caractéristique de magie. Trois chiffres qui décident d'un choix de profil, et qui
 * dormaient dans la donnée pendant qu'on n'affichait qu'un badge « Magie ».
 * `armorMaxDef` vaut -1 pour « aucune armure » (cf. AppFixtures).
 */
/**
 * Les seuls dés que COF2 emploie : le dé dépend de la FAMILLE (Aventuriers d8, Combattants
 * d10, Mages d6, Mystiques d8), pas du profil. Le filtre proposait aussi d4 et d12 — les
 * dés du magicien et du barbare de d20 — qui ne rendaient jamais rien.
 */
const DES_DE_VIE = ['1D6', '1D8', '1D10'];

const statsDeLaClasse = (profile: Profile) => {
    const stats: { label: string; value: React.ReactNode }[] = [];
    const de = profile.stats?.hitDie;
    if (de) stats.push({ label: 'Dé de vie', value: String(de).replace('1D', 'd') });
    else if (profile.stats?.hpPerLevel) stats.push({ label: 'PV/niv.', value: profile.stats.hpPerLevel });
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
            if (selectedHitDie !== 'all' && profile.stats?.hitDie !== selectedHitDie) {
                return false;
            }
            // `magicStat` est le champ servi (INT/CHA/PER) ; `magicModifier` ne l'a jamais
            // été, et le filtre ne rendait donc jamais rien sous « Avec magie ».
            if (selectedMagic === 'yes' && !profile.magicStat) {
                return false;
            }
            if (selectedMagic === 'no' && profile.magicStat) {
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
                placeholder={invitRecherche('classe')}
                count={{ n: filteredItems.length, ...compteurDuType('classe')! }}
            />

            <FilterPanel
                hasActiveFilters={activeFiltersCount > 0}
                onClearFilters={() => {
                    setSelectedHitDie('all');
                    setSelectedMagic('all');
                }}
            >
                <GrilleFiltres>
                    <SelectFiltre
                        label="Dé de vie" toutLabel="Tous les dés" value={selectedHitDie} onChange={setSelectedHitDie}
                        options={DES_DE_VIE.map(d => ({ value: d, label: d.replace('1D', 'd') }))}
                    />
                    <SelectFiltre
                        label="Magie" toutLabel="Toutes les classes" value={selectedMagic} onChange={setSelectedMagic}
                        options={[{ value: 'yes', label: 'Lanceurs de sorts' }, { value: 'no', label: 'Sans magie' }]}
                    />
                </GrilleFiltres>
            </FilterPanel>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((profile) => (
                    <ContentCard
                        key={profile.id}
                        to={`/classes/${profile.id}`}
                        media={<CardMedia src={profile.imageUrl || `/assets/profils/${profile.name}.jpg`} alt={profile.name} />}
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
