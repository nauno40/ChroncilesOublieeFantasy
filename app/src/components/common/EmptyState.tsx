import React from 'react';
import { Search } from 'lucide-react';
import clsx from 'clsx';

interface EmptyStateProps {
    icon?: React.ElementType;
    title?: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = Search,
    title,
    message,
    action,
    className
}) => {
    return (
        <div className={clsx('glass-panel p-12 rounded-xl text-center', className)}>
            <Icon className="mx-auto text-stone-600 mb-4" size={48} />
            {title && (
                <h3 className="text-xl font-display font-bold text-stone-400 mb-2">
                    {title}
                </h3>
            )}
            <p className="text-stone-400 mb-6">{message}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-xl text-primary-300 font-display font-bold transition-all"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
