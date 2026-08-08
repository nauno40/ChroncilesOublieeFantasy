import React from 'react';
import { Search } from 'lucide-react';

export interface ChipFiltre {
    id: string;
    label: string;
}

interface SearchToolbarProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    /**
     * Nombre de résultats après filtrage. Il vit ici et pas dans le sous-titre de la page :
     * il décrit ce que la recherche a retenu, pas ce que la page sert à faire.
     */
    count?: { n: number; singulier: string; pluriel?: string };
    /** Sous-types de la page (Armes / Armures / Matériel, catégories de la Bibliothèque).
     *  Chercher et restreindre sont la même intention : les deux vivent dans cette barre. */
    chips?: ChipFiltre[];
    chipActif?: string;
    onChipChange?: (id: string) => void;
    /** Action principale de la page (« Nouveau »), à droite du champ. */
    action?: React.ReactNode;
    /** Filtres avancés, rendus sous la barre (ex. <FilterPanel/>). */
    filters?: React.ReactNode;
    className?: string;
}

/**
 * Barre de recherche unique des pages de liste : champ, sous-types, action principale et
 * compteur de résultats — une seule disposition partout.
 *
 * Elle existe parce que la recherche prenait quatre formes selon l'écran : panneau avec
 * compteur au-dessus, panneau avec bouton de filtres, champ nu sous des onglets, ou champ
 * flanqué d'un bouton et suivi de pastilles. Le lecteur devait réapprendre la page à chaque
 * fois.
 */
export const SearchToolbar: React.FC<SearchToolbarProps> = ({
    value, onChange, placeholder, count, chips, chipActif, onChipChange, action, filters, className,
}) => {
    const libelleCount = count
        ? `${count.n} ${count.n > 1 ? (count.pluriel ?? `${count.singulier}s`) : count.singulier}`
        : null;

    return (
        <div className={`space-y-3 ${className ?? ''}`}>
            <div className="flex flex-wrap items-center gap-3">
                <label className="relative flex-1 min-w-[220px]">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                    <input
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        placeholder={placeholder ?? 'Rechercher…'}
                        className="w-full bg-stone-900/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-stone-100 placeholder-stone-500 outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/40 transition-all"
                    />
                </label>
                {action && <div className="shrink-0">{action}</div>}
            </div>

            {chips && chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {chips.map(c => (
                        <button
                            key={c.id}
                            onClick={() => onChipChange?.(c.id)}
                            className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border transition-all ${
                                chipActif === c.id
                                    ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                                    : 'bg-stone-900/40 text-stone-500 border-white/5 hover:text-stone-300'
                            }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            )}

            {filters}

            {libelleCount && <p className="text-[11px] uppercase tracking-wider text-stone-500">{libelleCount}</p>}
        </div>
    );
};
