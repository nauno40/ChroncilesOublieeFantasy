import React from 'react';
import foodData from '../data/food.json';
import lodgingData from '../data/lodging.json';
import type { Food, Lodging } from '../types/normalized';
import { PageContainer, PageHeader, TabGroup, SearchBar, Card, Badge, EmptyState } from '../components/common';
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
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {foodSearch.filteredItems.map((food, i) => (
                                            <Card key={i}>
                                                <div className="flex items-start justify-between">
                                                    <h3 className="text-lg font-display font-bold text-stone-200 flex-1">
                                                        {food.name}
                                                    </h3>
                                                    {food.price && (
                                                        <Badge variant="warning" size="sm">
                                                            {food.price}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
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
                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {lodgingSearch.filteredItems.map((lodging, i) => (
                                            <Card key={i}>
                                                <div className="flex items-start justify-between">
                                                    <h3 className="text-lg font-display font-bold text-stone-200 flex-1">
                                                        {lodging.name}
                                                    </h3>
                                                    {lodging.price && (
                                                        <Badge variant="warning" size="sm">
                                                            {lodging.price}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Card>
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
