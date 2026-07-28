import React from 'react';
import { Search, type LucideIcon } from 'lucide-react';

/**
 * En-tête de page unifié du design system : titre + sous-titre + actions, avec des
 * emplacements optionnels pour une recherche et une barre d'onglets/filtres. Remplace
 * les variantes ad hoc (PageHeader, en-têtes bespoke). Règle : une seule « tête » par
 * écran. À placer en haut du contenu, dans le PageContainer de la page.
 */
interface PageShellProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    /** Barre d'onglets / filtres source (ex. <SourceTabs/>). Rendue sous le titre. */
    tabs?: React.ReactNode;
    search?: { value: string; onChange: (v: string) => void; placeholder?: string };
    className?: string;
}

export const PageShell: React.FC<PageShellProps> = ({ title, subtitle, icon: Icon, actions, tabs, search, className }) => (
    <div className={`mb-6 space-y-4 ${className ?? ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white drop-shadow-sm flex items-center gap-3">
                    {Icon && <Icon className="text-primary-400/90 shrink-0" size={28} />}
                    <span className="truncate">{title}</span>
                </h1>
                {subtitle && <p className="text-stone-400 mt-1.5 text-sm max-w-2xl">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>

        {search && (
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                    value={search.value}
                    onChange={e => search.onChange(e.target.value)}
                    placeholder={search.placeholder ?? 'Rechercher…'}
                    className="w-full bg-stone-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-stone-100 placeholder-stone-500 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/40 transition-all"
                />
            </div>
        )}

        {tabs && <div className="flex flex-wrap gap-2">{tabs}</div>}
    </div>
);
