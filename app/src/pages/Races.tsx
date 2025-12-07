import React from 'react';
import racesData from '../data/Races.json';
import type { Race } from '../types';
import { PageContainer, PageHeader, Card } from '../components/common';
import { useSearch } from '../hooks';

const races = racesData as Race[];

// Map French race names to English image filenames
const getRaceImageName = (raceName: string): string => {
    const mapping: Record<string, string> = {
        'Demi-elfe': 'elf_half.png.webp',
        'Elfe, haut': 'elf_high.png.webp',
        'Elfe, sylvain': 'elf_wood.png.webp',
        'Nain': 'dwarf.png.webp',
        'Halfelin': 'halfling.png.webp',
        'Humain': 'human.png.webp',
        'Gnome': 'gnome.png.webp',
        'Demi-orque': 'orc_half.png.webp'
    };
    return mapping[raceName] || `${raceName}.jpg`;
};

export const Races: React.FC = () => {
    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        races,
        (race, term) => race.Title.toLowerCase().includes(term.toLowerCase())
    );

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
                {filteredItems.map((race, index) => (
                    <Card
                        key={index}
                        to={`/races/${index}`}
                        image={{
                            src: `/assets/races/${getRaceImageName(race.Title)}`,
                            alt: race.Title
                        }}
                    >
                        <h3 className="text-xl font-display font-bold text-primary-300 mb-3 group-hover:text-primary-200 transition-colors">
                            {race.Title}
                        </h3>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
};
