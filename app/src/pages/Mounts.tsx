import React from 'react';
import { PageContainer, PageHeader, ItemTable } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';

const mounts = DataService.getMounts();

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

            <ItemTable items={filteredItems} emptyMessage="Aucune monture trouvée" />
        </PageContainer>
    );
};
