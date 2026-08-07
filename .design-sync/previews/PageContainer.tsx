import React from 'react';
import { PageContainer, PageShell, ContentCard, Badge } from 'app';
import { BookOpen } from 'lucide-react';

/** Le gabarit d'une page : le conteneur pose la largeur et le rythme vertical,
 *  le reste s'y empile. C'est sa seule raison d'être — on ne le voit qu'habité. */
export const PageComplete = () => (
    <PageContainer>
        <PageShell title="Voies" subtitle="Les chemins de puissance et de maîtrise." icon={BookOpen} />
        <div className="grid grid-cols-2 gap-4">
            {[['Voie du feu', 'Magicien'], ['Voie de la rage', 'Barbare']].map(([nom, profil]) => (
                <ContentCard key={nom}>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display font-bold text-stone-100">{nom}</h3>
                        <Badge variant="secondary" size="sm">{profil}</Badge>
                    </div>
                </ContentCard>
            ))}
        </div>
    </PageContainer>
);
