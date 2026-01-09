import React from 'react';
import { DataService } from '../services/dataService';
import type { Race } from '../types/normalized';
import { PageContainer, PageHeader, Card } from '../components/common';
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

    // Map French race names to English image filenames because API data might rely on name convention
    const getRaceImageName = (raceName: string): string => {
        const mapping: Record<string, string> = {
            'Demi-elfe': 'elf_half.png.webp',
            'Elfe haut': 'elf_high.png.webp',
            'Elfe sylvain': 'elf_wood.png.webp',
            'Nain': 'dwarf.png.webp',
            'Halfelin': 'halfling.png.webp',
            'Humain': 'human.png.webp',
            'Gnome': 'gnome.png.webp',
            'Demi-orc': 'orc_half.png.webp'
        };
        return mapping[raceName] || `${raceName}.jpg`;
    };

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        races,
        (race, term) => race.name.toLowerCase().includes(term.toLowerCase())
    );

    if (loading) return <PageContainer><div className="p-8 text-center text-primary-200">Chargement...</div></PageContainer>;

    return (
        <PageContainer>
            <PageHeader
                title="Races"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une race..."
                subtitle={`${filteredItems.length} race${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((race) => (
                    <Card
                        key={race.id}
                        to={`/races/${race.id}`}
                        image={{
                            src: `/assets/races/${getRaceImageName(race.name)}`,
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
