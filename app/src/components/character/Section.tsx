import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Props {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

/**
 * Section repliable regroupant plusieurs panneaux de la fiche. Dépliée par défaut ;
 * l'en-tête (chevron + titre) sert de bascule (natif `<details>`). Permet de désencombrer
 * la fiche en repliant les groupes non utilisés, sans masquer de contenu derrière des onglets.
 */
export const Section: React.FC<Props> = ({ title, defaultOpen = true, children }) => (
    <details open={defaultOpen} className="group space-y-4">
        <summary className="cursor-pointer list-none select-none flex items-center gap-2 py-1.5 text-sm font-display font-bold uppercase tracking-[0.15em] text-primary-400/80 border-b border-primary-500/10">
            <ChevronRight size={16} className="text-primary-500/60 transition-transform duration-200 group-open:rotate-90" />
            {title}
        </summary>
        <div className="space-y-6">{children}</div>
    </details>
);
