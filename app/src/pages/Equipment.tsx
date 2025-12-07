import React from 'react';
import weaponsData from '../data/Armes.json';
import armorsData from '../data/Armures.json';
import materialsData from '../data/Materiels.json';
import type { Weapon, Armor, Material } from '../types';
import { PageContainer, PageHeader, TabGroup, SearchBar, EmptyState } from '../components/common';
import { useSearch } from '../hooks';
import { Sword, Shield, Gem } from 'lucide-react';

const weapons = weaponsData as Weapon[];
const armors = armorsData as Armor[];
const materials = materialsData as Material[];

export const Equipment: React.FC = () => {
    const weaponSearch = useSearch(weapons, (w, term) => w.Nom.toLowerCase().includes(term.toLowerCase()));
    const armorSearch = useSearch(armors, (a, term) => a.Nom.toLowerCase().includes(term.toLowerCase()));
    const materialSearch = useSearch(materials, (m, term) => m.Nom.toLowerCase().includes(term.toLowerCase()));

    const tabs = [
        { id: 'weapons', label: 'Armes', icon: Sword },
        { id: 'armors', label: 'Armures', icon: Shield },
        { id: 'materials', label: 'Matériel', icon: Gem }
    ];

    return (
        <PageContainer>
            <PageHeader title="Équipement" />

            <TabGroup tabs={tabs}>
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
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-primary-300 font-display font-bold">Nom</th>
                                                    <th className="text-left p-4 text-primary-300 font-display font-bold">Type</th>
                                                    <th className="text-left p-4 text-primary-300 font-display font-bold">Dégâts</th>
                                                    <th className="text-left p-4 text-primary-300 font-display font-bold">Prix</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {weaponSearch.filteredItems.map((weapon, i) => (
                                                    <tr key={i} className="border-b border-white/5 hover:bg-stone-900/30 transition-colors">
                                                        <td className="p-4 text-stone-200 font-medium">{weapon.Nom}</td>
                                                        <td className="p-4 text-stone-400 text-sm">{weapon.Type}</td>
                                                        <td className="p-4 text-primary-400 font-mono">{weapon.Dégâts}</td>
                                                        <td className="p-4 text-yellow-500/90 font-mono">{weapon.Prix}</td>
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
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="text-left p-4 text-primary-300 font-display font-bold">Nom</th>
                                                    <th className="text-left p-4 text-primary-300 font-display font-bold">Type</th>
                                                    <th className="text-left p-4 text-primary-300 font-display font-bold">DEF</th>
                                                    <th className="text-left p-4 text-primary-300 font-display font-bold">Prix</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {armorSearch.filteredItems.map((armor, i) => (
                                                    <tr key={i} className="border-b border-white/5 hover:bg-stone-900/30 transition-colors">
                                                        <td className="p-4 text-stone-200 font-medium">{armor.Nom}</td>
                                                        <td className="p-4 text-stone-400 text-sm">{armor.Type}</td>
                                                        <td className="p-4 text-green-400 font-mono">{armor.DEF}</td>
                                                        <td className="p-4 text-yellow-500/90 font-mono">{armor.Prix}</td>
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
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {materialSearch.filteredItems.map((material, i) => (
                                            <div key={i} className="glass-panel p-4 rounded-xl border-white/5 hover:border-primary-500/30 transition-all">
                                                <h3 className="text-stone-200 font-semibold mb-1">{material.Nom}</h3>
                                                <p className="text-primary-400 font-mono text-sm">{material.Prix}</p>
                                            </div>
                                        ))}
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
