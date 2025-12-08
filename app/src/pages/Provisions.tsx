import React from 'react';
import foodData from '../data/food.json';
import lodgingData from '../data/lodging.json';
import type { Food, Lodging } from '../types/normalized';
import { PageContainer, PageHeader, TabGroup, SearchBar, EmptyState } from '../components/common';
import { useSearch } from '../hooks';
import { UtensilsCrossed, Home } from 'lucide-react';

const foods = foodData as Food[];
const lodgings = lodgingData as Lodging[];

export const Provisions: React.FC = () => {
    const foodSearch = useSearch(foods, (f, term) => f.name.toLowerCase().includes(term.toLowerCase()));
    const lodgingSearch = useSearch(lodgings, (l, term) => l.name.toLowerCase().includes(term.toLowerCase()));

    const tabs = [
        { id: 'food', label: 'Nourriture', icon: UtensilsCrossed },
        { id: 'lodging', label: 'Logement', icon: Home }
    ];

    const renderTable = (items: { name: string; price: string }[]) => (
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

    return (
        <PageContainer>
            <PageHeader title="Provisions" />

            <TabGroup tabs={tabs}>
                {(activeTab) => (
                    <>
                        {activeTab === 'food' && (
                            <div className="space-y-4">
                                <SearchBar
                                    value={foodSearch.searchTerm}
                                    onChange={foodSearch.setSearchTerm}
                                    placeholder="Rechercher de la nourriture..."
                                />

                                {foodSearch.filteredItems.length === 0 ? (
                                    <EmptyState message="Aucune nourriture trouvée" />
                                ) : (
                                    renderTable(foodSearch.filteredItems)
                                )}
                            </div>
                        )}

                        {activeTab === 'lodging' && (
                            <div className="space-y-4">
                                <SearchBar
                                    value={lodgingSearch.searchTerm}
                                    onChange={lodgingSearch.setSearchTerm}
                                    placeholder="Rechercher un logement..."
                                />

                                {lodgingSearch.filteredItems.length === 0 ? (
                                    <EmptyState message="Aucun logement trouvé" />
                                ) : (
                                    renderTable(lodgingSearch.filteredItems)
                                )}
                            </div>
                        )}
                    </>
                )}
            </TabGroup>
        </PageContainer>
    );
};
