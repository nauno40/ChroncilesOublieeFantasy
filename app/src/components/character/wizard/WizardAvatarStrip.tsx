import React from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';
import { onImageError } from '../../common/imagePlaceholder';

export interface AvatarStripItem {
    iri: string;
    name: string;
    image: string;
}

interface Props {
    items: AvatarStripItem[];
    selectedIri: string;
    onSelect: (iri: string) => void;
}

/**
 * Bandeau horizontal de médaillons ronds pour choisir peuple/profil — remplace la grille de
 * cartes rectangulaires (bordées, en anneau) des phases 1-3 : plus proche de la référence
 * (Lands of Evershade), et plus compact — un simple défilement horizontal plutôt qu'une
 * grille qui repousse le reste de la page vers le bas.
 */
export const WizardAvatarStrip: React.FC<Props> = ({ items, selectedIri, onSelect }) => (
    <div className="flex gap-4 overflow-x-auto pb-1 -mx-5 px-5 md:-mx-8 md:px-8 no-scrollbar">
        {items.map(item => {
            const isSelected = item.iri === selectedIri;
            return (
                <button
                    key={item.iri}
                    type="button"
                    onClick={() => onSelect(item.iri)}
                    className="flex flex-col items-center gap-1.5 flex-none w-16 group"
                >
                    <span className={clsx(
                        'relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all',
                        isSelected ? 'border-primary-600' : 'border-stone-400/30 group-hover:border-stone-400/60',
                    )}>
                        <img
                            src={item.image}
                            onError={onImageError(item.name, 'card')}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        {isSelected && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-600 text-stone-950 flex items-center justify-center">
                                <Check size={12} strokeWidth={3} />
                            </span>
                        )}
                    </span>
                    <span className={clsx(
                        'text-[10px] uppercase tracking-wide truncate w-full text-center',
                        isSelected ? 'text-primary-700 font-bold' : 'text-stone-500',
                    )}>
                        {item.name}
                    </span>
                </button>
            );
        })}
    </div>
);
