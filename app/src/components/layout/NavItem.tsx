import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export interface NavItem {
    path: string;
    icon: LucideIcon;
    label: string;
    subItems?: NavItem[];
}

interface NavItemComponentProps {
    item: NavItem;
    isActive: boolean;
    isMobile?: boolean;
}

export const NavItemComponent: React.FC<NavItemComponentProps> = ({ item, isActive, isMobile = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const Icon = item.icon;

    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isSubItemActive = item.subItems?.some(sub => location.pathname === sub.path) ?? false;

    if (!hasSubItems) {
        return (
            <Link
                to={item.path}
                className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                    isActive
                        ? 'bg-primary-500/20 text-primary-300 shadow-lg shadow-primary-500/10'
                        : 'text-stone-400 hover:bg-stone-900/50 hover:text-primary-400',
                    isMobile && 'flex-col gap-1 px-2 py-2'
                )}
            >
                <Icon size={isMobile ? 24 : 20} className={clsx(
                    'transition-colors',
                    isActive ? 'text-primary-400' : 'text-stone-500 group-hover:text-primary-400'
                )} />
                <span className={clsx(
                    'font-display font-medium transition-colors',
                    isMobile && 'text-xs'
                )}>{item.label}</span>
            </Link>
        );
    }

    // Item with submenu
    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all group',
                    isSubItemActive
                        ? 'bg-primary-500/10 text-primary-300'
                        : 'text-stone-400 hover:bg-stone-900/50 hover:text-primary-400'
                )}
            >
                <div className="flex items-center gap-3">
                    <Icon size={20} className={clsx(
                        'transition-colors',
                        isSubItemActive ? 'text-primary-400' : 'text-stone-500 group-hover:text-primary-400'
                    )} />
                    <span className="font-display font-medium">{item.label}</span>
                </div>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isOpen && item.subItems && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/5 pl-4">
                    {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = location.pathname === subItem.path;
                        return (
                            <Link
                                key={subItem.path}
                                to={subItem.path}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm',
                                    isSubActive
                                        ? 'bg-primary-500/20 text-primary-300'
                                        : 'text-stone-500 hover:bg-stone-900/30 hover:text-primary-400'
                                )}
                            >
                                <SubIcon size={16} />
                                <span>{subItem.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
