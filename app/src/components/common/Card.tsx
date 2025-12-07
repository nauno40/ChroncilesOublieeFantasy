import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

interface CardProps {
    to?: string;
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    image?: {
        src: string;
        alt: string;
        fallback?: string;
    };
}

export const Card: React.FC<CardProps> = ({
    to,
    className,
    children,
    onClick,
    image
}) => {
    const baseClasses = clsx(
        'glass-panel rounded-xl border-white/5 transition-all duration-300 group',
        'hover:border-primary-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:-translate-y-1',
        className
    );

    const content = (
        <>
            {image && (
                <div className="relative h-48 overflow-hidden bg-gradient-to-b from-stone-900/50 to-stone-950 rounded-t-xl">
                    <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                            if (image.fallback) {
                                e.currentTarget.src = image.fallback;
                            } else {
                                // Default SVG placeholder
                                e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23292524" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%23f59e0b"%3E${image.alt.charAt(0)}%3C/text%3E%3C/svg%3E`;
                            }
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60"></div>
                </div>
            )}
            <div className={clsx('p-4', image && 'pt-4')}>
                {children}
            </div>
        </>
    );

    if (to) {
        return (
            <Link to={to} className={clsx(baseClasses, 'block overflow-hidden')}>
                {content}
            </Link>
        );
    }

    if (onClick) {
        return (
            <button onClick={onClick} className={clsx(baseClasses, 'w-full text-left overflow-hidden')}>
                {content}
            </button>
        );
    }

    return (
        <div className={clsx(baseClasses, image && 'overflow-hidden')}>
            {content}
        </div>
    );
};
