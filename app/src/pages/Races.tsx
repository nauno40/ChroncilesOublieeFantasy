import React from 'react';
import { DataService } from '../services/dataService';
import type { Race } from '../types/normalized';
import { PageContainer, SearchToolbar, ContentCard, CardMedia, CardStats, Loader } from '../components/common';
import { useSearch } from '../hooks';

/**
 * Ce qu'une carte de peuple montre en pied : ses modificateurs fixes, puis sa vitesse.
 * Les modificateurs « au choix » sont écartés — ils ne prennent leur valeur qu'à la
 * création d'un personnage, et une carte de liste n'a rien à en dire.
 */
const statsDuPeuple = (race: Race) => {
    const fixes = (race.modifiers ?? [])
        .filter(m => m.type === 'fixed' && m.stat)
        .slice(0, 3)
        .map(m => ({ label: m.stat as string, value: `${m.value > 0 ? '+' : ''}${m.value}` }));
    return race.speed ? [...fixes.slice(0, 3), { label: 'Vitesse', value: race.speed.replace('/tour', '') }] : fixes;
};

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
                    <ContentCard
                        key={race.id}
                        to={`/races/${race.id}`}
                        media={<CardMedia src={race.image || `/assets/races/${race.name.toLowerCase()}.png.webp`} alt={race.name} />}
                        footer={<CardStats stats={statsDuPeuple(race)} />}
                    >
                        <h3 className="text-xl font-display font-bold text-primary-300 group-hover:text-primary-200 transition-colors">
                            {race.name}
                        </h3>
                    </ContentCard>
                ))}
            </div>
        </PageContainer>
    );
};
