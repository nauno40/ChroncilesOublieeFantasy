import React, { useState, useMemo, useEffect } from 'react';
import type { Voie, Profile } from '../types/normalized';
import { PageContainer, SearchToolbar, ContentCard, Badge, Loader } from '../components/common';
import { useSearch } from '../hooks';
import { invitRecherche, compteurDuType } from '../domain/compendium';
import { DataService } from '../services/dataService';
import { User, Users, Skull, Crown, Filter, Scroll, Search, X } from 'lucide-react';
import { LEXIQUE } from '../domain/lexique';

/** Types de voie proposés en pastilles. L'identifiant reste la valeur des données ;
 *  l'intitulé suit le lexique — COF2 dit « peuple », pas « race ». */
const TYPES_VOIE = [
    { id: 'all', label: 'Toutes' },
    { id: 'Personnage', label: 'Personnage' },
    { id: 'Race', label: LEXIQUE.peuple },
    { id: 'Créature', label: 'Créature' },
    { id: 'Prestige', label: 'Prestige' },
];


export const Voies: React.FC = () => {
    const [voies, setVoies] = useState<Voie[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            DataService.getVoies(),
            DataService.getProfiles()
        ])
            .then(([v, p]) => {
                const normalizedVoies = v.map((item: any) => ({
                    ...item,
                    type: item.type || item.category || (item.profile ? 'Personnage' : 'Autre'),
                    profileId: item.profileId || (item.profile ? String(item.profile).split('/').pop() : null),
                    id: String(item.id)
                }));
                setVoies(normalizedVoies);
                setProfiles(p);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedProfile, setSelectedProfile] = useState<string>('all');

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
    }, [voies, selectedType, selectedProfile]);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        filteredByFilters,
        (voie, term) => voie.name.toLowerCase().includes(term.toLowerCase())
    );

    const availableProfiles = useMemo(() => {
        const profileIds = new Set(voies.map(v => v.profileId).filter(Boolean));
        return profiles
            .filter(p => profileIds.has(String(p.id)))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [voies, profiles]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Personnage': return User;
            case 'Race': return Users;
            case 'Créature': return Skull;
            case 'Prestige': return Crown;
            default: return Scroll;
        }
    };

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            {/* Même barre que les autres pages de liste : le type de voie devient une
                pastille, le filtre par classe passe en filtre avancé sous la barre. */}
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={invitRecherche('voie')}
                count={{ n: filteredItems.length, ...compteurDuType('voie')! }}
                chips={TYPES_VOIE}
                chipActif={selectedType}
                onChipChange={setSelectedType}
                filters={(
                    <div className="flex items-center gap-2">
                        <div className="relative group w-full lg:w-64">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-hover:text-primary-400 transition-colors" size={14} />
                            <select
                                aria-label="Filtrer par classe"
                                value={selectedProfile}
                                onChange={(e) => setSelectedProfile(e.target.value)}
                                className="w-full pl-9 pr-8 py-1.5 bg-stone-900/50 border border-stone-700 rounded-lg text-stone-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Toutes les classes</option>
                                {availableProfiles.map(p => (
                                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        {(selectedType !== 'all' || selectedProfile !== 'all') && (
                            <button
                                onClick={() => { setSelectedType('all'); setSelectedProfile('all'); }}
                                aria-label="Réinitialiser les filtres"
                                className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}
            />

            {/* Grille de résultats : même coquille de carte que le reste du compendium. */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((voie) => {
                    const profileName = voie.profileId ? profiles.find(p => String(p.id) === voie.profileId)?.name : null;
                    const TypeIcon = getTypeIcon(voie.type);

                    return (
                        <ContentCard
                            key={voie.id}
                            to={`/voies/${voie.id}`}
                            className="h-full"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="text-stone-400">
                                    <TypeIcon size={18} />
                                </div>
                                {profileName && (
                                    <Badge variant="outline" size="sm" className="max-w-[120px] truncate">
                                        {profileName}
                                    </Badge>
                                )}
                            </div>

                            <h3 className="text-lg font-display font-bold text-primary-200 mb-2 group-hover:text-primary-100 transition-colors">
                                {voie.name}
                            </h3>

                            {voie.description && (
                                <p className="text-stone-400 text-xs leading-relaxed line-clamp-3 mb-4 flex-grow">
                                    {voie.description}
                                </p>
                            )}
                            {!voie.description && <div className="flex-grow" />}

                            <div className="flex items-center gap-1 mt-auto pt-3 border-t border-white/5 opacity-60 group-hover:opacity-100 transition-opacity">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                                ))}
                                <span className="ml-auto text-xs text-primary-400">Consulter</span>
                            </div>
                        </ContentCard>
                    );
                })}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-20 animate-fade-in">
                    <div className="w-16 h-16 bg-stone-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-800">
                        <Search size={24} className="text-stone-400" />
                    </div>
                    <h3 className="text-lg font-display text-stone-300 mb-2">Aucune voie trouvée</h3>
                    <p className="text-sm text-stone-400">Essayez de modifier vos filtres de recherche</p>
                </div>
            )}
        </PageContainer>
    );
};
