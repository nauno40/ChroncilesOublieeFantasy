import React from 'react';
import { PageContainer, PageHeader, ItemTable } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';

import type { Mount } from '../types/normalized';

export const Mounts: React.FC = () => {
    const [mounts, setMounts] = React.useState<Mount[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        DataService.getMounts()
            .then(setMounts)
            .finally(() => setLoading(false));
    }, []);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        mounts,
        (mount, term) => mount.name.toLowerCase().includes(term.toLowerCase())
    );

    if (loading) return <PageContainer><div className="p-8 text-center text-primary-200">Chargement...</div></PageContainer>;

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
