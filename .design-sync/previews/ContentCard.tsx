import React from 'react';
import { ContentCard, AuthorTag, Badge, imagePlaceholder } from 'app';
import { ChevronRight } from 'lucide-react';

/** La carte illustrée d'une liste de compendium. */
export const Illustree = () => (
    <div className="w-[320px]">
        <ContentCard
            onClick={() => {}}
            media={<img src={imagePlaceholder('Elfe sylvain')} alt="" className="w-full h-32 object-cover" />}
        >
            <h3 className="font-display font-bold text-lg text-stone-100">Elfe sylvain</h3>
            <p className="text-sm text-stone-400 mt-1">
                Gardiens des forêts anciennes, vifs et distants.
            </p>
        </ContentCard>
    </div>
);

/** Avec un pied : là où vivent les statistiques d'une créature. */
export const AvecPied = () => (
    <div className="w-[320px]">
        <ContentCard
            onClick={() => {}}
            media={<img src={imagePlaceholder('Roc')} alt="" className="w-full h-24 object-cover" />}
            footer={
                <div className="grid grid-cols-3 divide-x divide-white/5 text-center">
                    {[['DEF', '24'], ['FOR', '+12'], ['INIT', '14']].map(([k, v]) => (
                        <div key={k} className="py-2">
                            <div className="text-[11px] uppercase tracking-wider text-stone-500">{k}</div>
                            <div className="font-mono font-bold text-stone-200">{v}</div>
                        </div>
                    ))}
                </div>
            }
        >
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-bold text-lg text-stone-100">Roc</h3>
                <Badge variant="secondary" size="sm">Niv. 10</Badge>
            </div>
        </ContentCard>
    </div>
);

/** La variante communautaire : la même carte, plus l'étiquette d'auteur. */
export const Communautaire = () => (
    <div className="w-[320px]">
        <ContentCard
            onClick={() => {}}
            footer={<div className="px-5 py-3"><AuthorTag pseudo="Lyra" visibility="public" /></div>}
        >
            <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" size="sm">Sort</Badge>
            </div>
            <h3 className="font-display font-bold text-lg text-stone-100">Illusion parfaite</h3>
            <p className="text-sm text-stone-400 mt-1">
                Une image mouvante indiscernable du réel, tant que nul ne la touche.
            </p>
        </ContentCard>
    </div>
);

/** Sans action : une carte de lecture seule. */
export const NonCliquable = () => (
    <div className="w-[320px]">
        <ContentCard footer={<div className="px-5 py-3 text-[11px] uppercase tracking-wider text-stone-500">Séance du 12 mars</div>}>
            <h3 className="font-display font-bold text-lg text-stone-100">Les Ombres de Val-Gelé</h3>
            <p className="text-sm text-stone-400 mt-1">Un hiver interminable étouffe la vallée.</p>
            <div className="mt-3 flex items-center gap-1 text-sm text-primary-400">
                Reprendre <ChevronRight size={14} />
            </div>
        </ContentCard>
    </div>
);
