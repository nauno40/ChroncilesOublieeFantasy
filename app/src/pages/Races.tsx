import React from 'react';
import { DataService } from '../services/dataService';
import type { Race } from '../types/normalized';
import { PageContainer, SearchToolbar, Card, Loader } from '../components/common';
import { useSearch } from '../hooks';

export const Races: React.FC = () => {
    const [races, setRaces] = React.useState<Race[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        DataService.getRaces()
            .then(setRaces)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        races,
        (race, term) => race.name.toLowerCase().includes(term.toLowerCase())
    );

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <SearchToolbar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Rechercher un peuple…"
                count={{ n: filteredItems.length, singulier: 'peuple' }}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((race) => (
                    <Card
                        key={race.id}
                        to={`/races/${race.id}`}
                        image={{
                            src: race.image || `/assets/races/${race.name.toLowerCase()}.png.webp`,
                            alt: race.name
                        }}
                    >
                        <h3 className="text-xl font-display font-bold text-primary-300 mb-3 group-hover:text-primary-200 transition-colors">
                            {race.name}
                        </h3>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
