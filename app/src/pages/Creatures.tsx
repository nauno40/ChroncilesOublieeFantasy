import React, { useState } from 'react';
import { Bestiary } from './Bestiary';
import { CustomMonsters } from './CustomMonsters';
import { Ghost } from 'lucide-react';
import { PageContainer, PageShell, SourceTabs } from '../components/common';
import { LEXIQUE } from '../domain/lexique';

/**
 * Page « Créatures » unifiée (compendium communautaire) : en-tête PageShell + filtre
 * source réunissant le bestiaire officiel (Bestiary) et les créatures maison /
 * communautaires (CustomMonsters, encapsulé).
 */
type Source = 'official' | 'community' | 'mine';

const SOURCES: { id: Source; label: string }[] = [
    { id: 'official', label: LEXIQUE.sourceOfficiel },
    { id: 'community', label: LEXIQUE.sourceCommunaute },
    { id: 'mine', label: LEXIQUE.sourceMiennes },
];

export const Creatures: React.FC = () => {
    const [source, setSource] = useState<Source>('official');

    return (
        <div>
            <PageContainer>
                <PageShell
                    title={LEXIQUE.creatures}
                    subtitle="Le bestiaire officiel, vos créatures et celles de la communauté."
                    icon={Ghost}
                    tabs={<SourceTabs tabs={SOURCES} value={source} onChange={setSource} />}
                    className="mb-0"
                />
            </PageContainer>

            {/* Bestiary et CustomMonsters apportent chacun leur propre conteneur. */}
            {source === 'official' ? (
                <Bestiary />
            ) : (
                <CustomMonsters
                    embedded
                    tab={source === 'mine' ? 'mine' : 'community'}
                    onTabChange={t => setSource(t === 'mine' ? 'mine' : 'community')}
                />
            )}
        </div>
    );
};
