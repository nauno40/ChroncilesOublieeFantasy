import React from 'react';
import { PageShell, SourceTabs, Badge } from 'app';
import { BookOpen, Users, Plus } from 'lucide-react';

/** L'en-tête d'une page de compendium : titre, sous-titre, icône. */
export const Compendium = () => (
    <PageShell
        title="Peuples"
        subtitle="Les huit peuples jouables, leurs modificateurs et leurs voies."
        icon={BookOpen}
    />
);

/** Avec la barre de source — la disposition de toutes les pages de type. */
export const AvecSourceEtRecherche = () => {
    const [source, setSource] = React.useState<'official' | 'community' | 'mine'>('official');
    const [q, setQ] = React.useState('');
    return (
        <PageShell
            title="Créatures"
            subtitle="Le bestiaire officiel et celui de la communauté."
            icon={BookOpen}
            tabs={
                <SourceTabs
                    value={source}
                    onChange={setSource}
                    tabs={[
                        { id: 'official', label: 'Officiel' },
                        { id: 'community', label: 'Communauté' },
                        { id: 'mine', label: 'Mes créations' },
                    ]}
                />
            }
            search={{ value: q, onChange: setQ, placeholder: 'Rechercher une créature…' }}
        />
    );
};

/** Avec une action principale — les pages où l'on crée du contenu. */
export const AvecAction = () => (
    <PageShell
        title="Mes personnages"
        subtitle="Vos héros : fiches complètes, jouables à la table."
        icon={Users}
        actions={
            <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm px-4 py-3 rounded-xl transition-all">
                <Plus size={16} /> Nouveau personnage
            </button>
        }
    />
);

/** Titre seul — l'écran d'un outil, sans filtre ni recherche. */
export const TitreSeul = () => (
    <PageShell title="Suivi de combat" subtitle="Initiative, tours et points de vie." icon={BookOpen}
        actions={<Badge variant="warning">Round 3</Badge>} />
);
