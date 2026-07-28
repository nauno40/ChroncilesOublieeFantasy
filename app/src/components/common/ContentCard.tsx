import React from 'react';

/**
 * Coquille de carte unifiée du design system : même rayon, bordure, ombre et hover
 * partout. Compositionnelle — on passe un `media` optionnel (image/icône), le corps en
 * children, et un `footer` optionnel (actions). Rend le corps cliquable si `onClick`.
 */
interface ContentCardProps {
    onClick?: () => void;
    media?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

export const ContentCard: React.FC<ContentCardProps> = ({ onClick, media, footer, className, children }) => {
    const body = (
        <>
            {media}
            <div className="p-5 flex-1 min-w-0">{children}</div>
        </>
    );
    return (
        <div className={`glass-panel rounded-2xl border border-white/5 hover:border-primary-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden group ${className ?? ''}`}>
            {onClick ? (
                <button onClick={onClick} className="text-left flex flex-col flex-1 min-w-0">{body}</button>
            ) : body}
            {footer && <div className="border-t border-white/5">{footer}</div>}
        </div>
    );
};
