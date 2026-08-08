import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Coquille de carte unifiée du design system : même rayon, bordure, ombre et hover
 * partout. Compositionnelle — on passe un `media` optionnel (image/icône), le corps en
 * children, et un `footer` optionnel (actions). Rend le corps cliquable si `onClick`.
 */
interface ContentCardProps {
    /** Destination de la carte. À préférer à `onClick` quand la carte mène à une page :
     *  un vrai lien s'ouvre dans un nouvel onglet, se copie, et s'annonce comme un lien. */
    to?: string;
    onClick?: () => void;
    media?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

export const ContentCard: React.FC<ContentCardProps> = ({ to, onClick, media, footer, className, children }) => {
    const body = (
        <>
            {media}
            <div className="p-5 flex-1 min-w-0">{children}</div>
        </>
    );
    return (
        <div className={`glass-panel rounded-2xl border border-white/5 hover:border-primary-500/30 hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden group ${className ?? ''}`}>
            {to ? (
                <Link to={to} className="text-left flex flex-col flex-1 min-w-0">{body}</Link>
            ) : onClick ? (
                <button onClick={onClick} className="text-left flex flex-col flex-1 min-w-0">{body}</button>
            ) : body}
            {footer && <div className="border-t border-white/5">{footer}</div>}
        </div>
    );
};
