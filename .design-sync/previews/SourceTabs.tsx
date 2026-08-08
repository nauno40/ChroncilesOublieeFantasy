import React from 'react';
import { SourceTabs } from 'app';

/** Le filtre de source du compendium — trois sources, la première active. */
export const TroisSources = () => {
    const [value, setValue] = React.useState<'official' | 'community' | 'mine'>('official');
    return (
        <div className="flex gap-2">
            <SourceTabs
                value={value}
                onChange={setValue}
                tabs={[
                    { id: 'official', label: 'Officiel' },
                    { id: 'community', label: 'Communauté' },
                    { id: 'mine', label: 'Mes créations' },
                ]}
            />
        </div>
    );
};

/** Sélection sur un onglet du milieu : l'état actif se lit sans ambiguïté. */
export const SelectionAilleurs = () => {
    const [value, setValue] = React.useState<'official' | 'community' | 'mine'>('community');
    return (
        <div className="flex gap-2">
            <SourceTabs
                value={value}
                onChange={setValue}
                tabs={[
                    { id: 'official', label: 'Officiel' },
                    { id: 'community', label: 'Communauté' },
                    { id: 'mine', label: 'Mes créations' },
                ]}
            />
        </div>
    );
};

/** Deux sources — la Bibliothèque, qui n'a pas de contenu officiel. */
export const DeuxSources = () => {
    const [value, setValue] = React.useState<'mine' | 'community'>('mine');
    return (
        <div className="flex gap-2">
            <SourceTabs
                value={value}
                onChange={setValue}
                tabs={[{ id: 'mine', label: 'Mes créations' }, { id: 'community', label: 'Communauté' }]}
            />
        </div>
    );
};
