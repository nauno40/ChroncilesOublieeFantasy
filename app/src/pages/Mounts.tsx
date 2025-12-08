import React from 'react';
import mountsData from '../data/mounts.json';
import type { Mount } from '../types/normalized';
import { PageContainer, PageHeader } from '../components/common';
import { useSearch } from '../hooks';

const mounts = mountsData as Mount[];

export const Mounts: React.FC = () => {
    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        mounts,
        (mount, term) => mount.name.toLowerCase().includes(term.toLowerCase())
    );

    return (
        <PageContainer>
            <PageHeader
                title="Montures & Véhicules"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher une monture..."
                subtitle={`${filteredItems.length} monture${filteredItems.length > 1 ? 's' : ''} trouvée${filteredItems.length > 1 ? 's' : ''}`}
            />

            {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-stone-500">Aucune monture trouvée</div>
            ) : (
                <div className="glass-panel rounded-xl overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left p-4 text-primary-300 font-display font-bold w-full">Nom</th>
                                <th className="text-right p-4 text-primary-300 font-display font-bold whitespace-nowrap">Prix</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((mount, index) => (
                                <tr key={index} className="border-b border-white/5 hover:bg-stone-900/30 transition-colors">
                                    <td className="p-4 text-stone-200 font-medium">{mount.name}</td>
                                    <td className="p-4 text-yellow-500/90 font-mono text-right whitespace-nowrap">{mount.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </PageContainer>
    );
};
