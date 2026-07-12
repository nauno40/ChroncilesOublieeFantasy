import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'info';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    className
}) => {
    const variantClasses = {
        primary: 'bg-primary-500/20 text-primary-400 border-primary-900/30',
        secondary: 'bg-stone-500/20 text-stone-400 border-stone-900/30',
        success: 'bg-green-500/20 text-green-400 border-green-900/30',
        warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-900/30',
        danger: 'bg-red-500/20 text-red-400 border-red-900/30',
        info: 'bg-blue-500/20 text-blue-300 border-blue-900/30',
        outline: 'bg-transparent text-stone-300 border-stone-500/50'
    };

    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-0.5',
        lg: 'text-sm px-3 py-1'
    };

    return (
        <span className={clsx(
            'inline-block rounded border font-bold',
            variantClasses[variant],
            sizeClasses[size],
            className
        )}>
            {children}
        </span>
    );
};
