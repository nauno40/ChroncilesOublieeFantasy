import React from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useToggle } from '../../hooks';
import clsx from 'clsx';

interface FilterPanelProps {
    children: React.ReactNode;
    hasActiveFilters?: boolean;
    onClearFilters?: () => void;
    defaultOpen?: boolean;
    className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
    children,
    hasActiveFilters = false,
    onClearFilters,
    defaultOpen = false,
    className
}) => {
    const [isOpen, toggleOpen] = useToggle(defaultOpen);

    return (
        <div className={clsx('glass-panel rounded-xl border-white/5 overflow-hidden', className)}>
            <button
                onClick={toggleOpen}
                className="w-full p-4 flex items-center justify-between hover:bg-stone-900/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-primary-400" />
                    <span className="font-display font-bold text-stone-200">
                        Filtres
                    </span>
                    {hasActiveFilters && (
                        <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded border border-primary-500/30">
                            Actifs
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && onClearFilters && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClearFilters();
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 rounded border border-red-500/30 hover:bg-red-900/50 transition-all text-xs"
                        >
                            <X size={14} />
                            Effacer
                        </button>
                    )}
                    {isOpen ? (
                        <ChevronUp size={20} className="text-stone-400" />
                    ) : (
                        <ChevronDown size={20} className="text-stone-400" />
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="p-4 border-t border-white/5 space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
};
