import React from 'react';
import { PageContainer, PageHeader, TabGroup, SearchBar, ItemTable } from '../components/common';
import { useSearch } from '../hooks';
import { UtensilsCrossed, Home } from 'lucide-react';
import { DataService } from '../services/dataService';

const foods = DataService.getFoods();
const lodgings = DataService.getLodgings();

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
                                <ItemTable items={foodSearch.filteredItems} emptyMessage="Aucune nourriture trouvée" />
                            </div>
                        )}

                        {activeTab === 'lodging' && (
                            <div className="space-y-4">
                                <SearchBar
                                    value={lodgingSearch.searchTerm}
                                    onChange={lodgingSearch.setSearchTerm}
                                    placeholder="Rechercher un logement..."
                                />
                                <ItemTable items={lodgingSearch.filteredItems} emptyMessage="Aucun logement trouvé" />
                            </div>
                        )}
                    </>
                )}
            </TabGroup>
        </PageContainer>
    );
};
