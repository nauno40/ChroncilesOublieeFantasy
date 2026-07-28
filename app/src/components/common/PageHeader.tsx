import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { SearchBar } from './SearchBar';
import clsx from 'clsx';

interface PageHeaderProps {
    /** Optionnel : quand la page est enveloppée par CompendiumType (qui porte déjà le
     *  titre via PageShell), on l'omet pour ne garder que sous-titre + recherche. */
    title?: string;
    icon?: LucideIcon;
    subtitle?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    icon: Icon,
    subtitle,
    searchValue,
    onSearchChange,
    searchPlaceholder,
    actions,
    className
}) => {
    return (
        <div className={clsx(
            'glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-primary-500/20',
            onSearchChange && 'sticky top-0 z-10 backdrop-blur-md',
            className
        )}>
            {(title || subtitle || actions || Icon) && (
                <div className={clsx('flex items-center gap-4', (onSearchChange && searchValue !== undefined) && 'mb-6')}>
                    {Icon && <Icon className="text-primary-400" size={32} />}
                    <div className="flex-1">
                        {title && (
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-200 to-primary-500">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-stone-400 text-sm mt-1">{subtitle}</p>
                        )}
                    </div>
                    {actions && (
                        <div>{actions}</div>
                    )}
                </div>
            )}

            {onSearchChange && searchValue !== undefined && (
                <SearchBar
                    value={searchValue}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                />
            )}
        </div>
    );
};
