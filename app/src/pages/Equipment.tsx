import React from 'react';
import weaponsData from '../data/weapons.json';
import armorsData from '../data/armors.json';
import materialsData from '../data/materials.json';
import type { Weapon, Armor, Material } from '../types/normalized';
import { PageContainer, PageHeader, TabGroup, SearchBar, EmptyState } from '../components/common';
import { useSearch } from '../hooks';
import { Sword, Shield, Gem } from 'lucide-react';

const weapons = weaponsData as Weapon[];
const armors = armorsData as Armor[];
const materials = materialsData as Material[];

const ItemTable = ({ items, emptyMessage }: { items: { name: string; price: string; id: string }[], emptyMessage: string }) => {
    if (items.length === 0) return <EmptyState message={emptyMessage} />;

    return (
        <div className="glass-panel rounded-xl overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-primary-300 font-display font-bold w-full">Nom</th>
                        <th className="text-right p-4 text-primary-300 font-display font-bold whitespace-nowrap">Prix</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-stone-900/30 transition-colors">
                            <td className="p-4 text-stone-200 font-medium">{item.name}</td>
                            <td className="p-4 text-yellow-500/90 font-mono text-right whitespace-nowrap">{item.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const Equipment: React.FC = () => {
    const weaponSearch = useSearch(weapons, (w, term) => w.name.toLowerCase().includes(term.toLowerCase()));
    const armorSearch = useSearch(armors, (a, term) => a.name.toLowerCase().includes(term.toLowerCase()));
    const materialSearch = useSearch(materials, (m, term) => m.name.toLowerCase().includes(term.toLowerCase()));

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
                                                        <td className="p-4 text-stone-200 font-medium">{weapon.name}</td>
                                                        <td className="p-4 text-stone-400 text-sm">{weapon.type}</td>
                                                        <td className="p-4 text-primary-400 font-mono">{weapon.damage}</td>
                                                        <td className="p-4 text-yellow-500/90 font-mono">{weapon.price}</td>
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
                                                        <td className="p-4 text-stone-200 font-medium">{armor.name}</td>
                                                        <td className="p-4 text-stone-400 text-sm">{armor.type}</td>
                                                        <td className="p-4 text-primary-400 font-mono">{armor.defense}</td>
                                                        <td className="p-4 text-yellow-500/90 font-mono">{armor.price}</td>
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
                                <ItemTable items={materialSearch.filteredItems} emptyMessage="Aucun matériel trouvé" />
                            </div>
                        )}
                    </>
                )}
            </TabGroup>
        </PageContainer>
    );
};

