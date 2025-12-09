import React from 'react';
import { PageContainer, PageHeader, SearchBar, EmptyState, TabGroup } from '../components/common';
import { useSearch } from '../hooks';
import { Sword, Shield, Gem } from 'lucide-react';
import { DataService } from '../services/dataService';

const weapons = DataService.getWeapons();
const armors = DataService.getArmors();
const materials = DataService.getMaterials();

import { useSearchParams } from 'react-router-dom';

export const Equipment: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'weapons';
    const initialQuery = searchParams.get('q') || '';

    const weaponSearch = useSearch(weapons, (w, term) => w.name.toLowerCase().includes(term.toLowerCase()), initialTab === 'weapons' ? initialQuery : '');
    const armorSearch = useSearch(armors, (a, term) => a.name.toLowerCase().includes(term.toLowerCase()), initialTab === 'armors' ? initialQuery : '');
    const materialSearch = useSearch(materials, (m, term) => m.name.toLowerCase().includes(term.toLowerCase()), initialTab === 'materials' ? initialQuery : '');

    const tabs = [
        { id: 'weapons', label: 'Armes', icon: Sword },
        { id: 'armors', label: 'Armures et Boucliers', icon: Shield },
        { id: 'materials', label: 'Matériel et Services', icon: Gem }
    ];

    const getDamageMod = (type: string) => {
        if (type.toLowerCase().includes('contact')) return '+ FOR';
        return '-';
    };

    return (
        <PageContainer>
            <PageHeader title="Équipement" />

            <TabGroup tabs={tabs} defaultTab={initialTab}>
                {(activeTab) => (
                    <>
                        {activeTab === 'weapons' && (
                            <div className="space-y-4">
                                <SearchBar
                                    value={weaponSearch.searchTerm}
                                    onChange={weaponSearch.setSearchTerm}
                                    placeholder="Rechercher une arme..."
                                />

                                {weaponSearch.filteredItems.length === 0 ? (
                                    <EmptyState message="Aucune arme trouvée" />
                                ) : (
                                    <div className="glass-panel rounded-xl overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-black/20">
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Nom</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Type</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Dégâts</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Mod.</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Critique</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Portée</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Rechargement</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Spécial</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap text-right">Prix</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {weaponSearch.filteredItems.map((weapon, i) => (
                                                    <tr key={i} className="hover:bg-primary-500/5 transition-colors">
                                                        <td className="p-4 text-stone-200 font-bold">{weapon.name}</td>
                                                        <td className="p-4 text-stone-400 text-sm whitespace-nowrap">{weapon.type}</td>
                                                        <td className="p-4 text-stone-300 font-mono text-sm">{weapon.damage}</td>
                                                        <td className="p-4 text-stone-400 font-mono text-sm">{getDamageMod(weapon.type)}</td>
                                                        <td className="p-4 text-stone-400 font-mono text-sm">{weapon.critical}</td>
                                                        <td className="p-4 text-stone-400 font-mono text-sm whitespace-nowrap">{weapon.range || '-'}</td>
                                                        <td className="p-4 text-stone-400 text-sm whitespace-nowrap">{weapon.reload || '-'}</td>
                                                        <td className="p-4 text-amber-400/80 text-xs italic">{weapon.requirements}</td>
                                                        <td className="p-4 text-yellow-500/90 font-mono text-sm text-right whitespace-nowrap">{weapon.price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'armors' && (
                            <div className="space-y-4">
                                <SearchBar
                                    value={armorSearch.searchTerm}
                                    onChange={armorSearch.setSearchTerm}
                                    placeholder="Rechercher une armure..."
                                />

                                {armorSearch.filteredItems.length === 0 ? (
                                    <EmptyState message="Aucune armure trouvée" />
                                ) : (
                                    <div className="glass-panel rounded-xl overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-black/20">
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Nom</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Type</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Défense</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Notes</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap text-right">Prix</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {armorSearch.filteredItems.map((armor, i) => (
                                                    <tr key={i} className="hover:bg-primary-500/5 transition-colors">
                                                        <td className="p-4 text-stone-200 font-bold">{armor.name}</td>
                                                        <td className="p-4 text-stone-400 text-sm whitespace-nowrap">{armor.type}</td>
                                                        <td className="p-4 text-primary-400 font-mono font-bold whitespace-nowrap">{armor.defense}</td>
                                                        <td className="p-4 text-stone-400 text-sm italic">{armor.comments}</td>
                                                        <td className="p-4 text-yellow-500/90 font-mono text-sm text-right whitespace-nowrap">{armor.price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'materials' && (
                            <div className="space-y-4">
                                <SearchBar
                                    value={materialSearch.searchTerm}
                                    onChange={materialSearch.setSearchTerm}
                                    placeholder="Rechercher du matériel..."
                                />
                                {materialSearch.filteredItems.length === 0 ? (
                                    <EmptyState message="Aucun matériel trouvé" />
                                ) : (
                                    <div className="glass-panel rounded-xl overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-black/20">
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Nom</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap">Notes</th>
                                                    <th className="p-4 text-primary-300 font-display font-bold whitespace-nowrap text-right">Prix</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {materialSearch.filteredItems.map((item, i) => (
                                                    <tr key={i} className="hover:bg-primary-500/5 transition-colors">
                                                        <td className="p-4 text-stone-200 font-bold">{item.name}</td>
                                                        <td className="p-4 text-stone-400 text-sm italic">{item.notes || '-'}</td>
                                                        <td className="p-4 text-yellow-500/90 font-mono text-sm text-right whitespace-nowrap">{item.price}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </TabGroup>
        </PageContainer>
    );
};
