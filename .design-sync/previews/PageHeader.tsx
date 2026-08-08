import React from 'react';
import { PageHeader } from 'app';
import { Ghost } from 'lucide-react';

/** L'en-tête historique, avec sa recherche intégrée. */
export const AvecRecherche = () => {
    const [q, setQ] = React.useState('');
    return (
        <PageHeader
            title="Créatures"
            icon={Ghost}
            subtitle="122 créatures trouvées"
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Rechercher une créature…"
        />
    );
};

/** Sans titre : quand la page est déjà coiffée par un PageShell. */
export const SansTitre = () => {
    const [q, setQ] = React.useState('gobelin');
    return <PageHeader subtitle="3 résultats" searchValue={q} onSearchChange={setQ} />;
};
