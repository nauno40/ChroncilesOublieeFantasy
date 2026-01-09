import React from 'react';
import { PageContainer, PageHeader, TabGroup, SearchBar, ItemTable } from '../components/common';
import { useSearch } from '../hooks';
import { UtensilsCrossed, Home } from 'lucide-react';
import { DataService } from '../services/dataService';

import type { Food, Lodging } from '../types/normalized';

export const Provisions: React.FC = () => {
    const [foods, setFoods] = React.useState<Food[]>([]);
    const [lodgings, setLodgings] = React.useState<Lodging[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        Promise.all([
            DataService.getFoods(),
            DataService.getLodgings()
        ]).then(([f, l]) => {
            setFoods(f);
            setLodgings(l);
        }).finally(() => setLoading(false));
    }, []);

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
                    loading ? <div className="p-8 text-center text-primary-200">Chargement...</div> :
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
