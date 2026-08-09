import React from 'react';
import { Link } from 'react-router-dom';
import { imagePlaceholder, onImageError } from './imagePlaceholder';

/**
 * Coquille de carte unifiée du design system : même rayon, bordure, ombre et hover
 * partout. Compositionnelle — on passe un `media` optionnel (image/icône), le corps en
 * children, et un `footer` optionnel (actions). Rend le corps cliquable si `onClick`.
 *
 * L'application portait quatre coquilles concurrentes : celle-ci (peuples, classes), un
 * composant `Card` au rayon et au survol différents (voies, capacités), une pastille
 * écrite à la main (états), et une quatrième recopiée dans la liste communautaire. Elles
 * sont désormais des variantes de cette seule coquille — `media="left"` couvre la forme
 * compacte des états.
 */
interface ContentCardProps {
    /** Destination de la carte. À préférer à `onClick` quand la carte mène à une page :
     *  un vrai lien s'ouvre dans un nouvel onglet, se copie, et s'annonce comme un lien. */
    to?: string;
    onClick?: () => void;
    media?: React.ReactNode;
    /** `top` (défaut) : image d'en-tête pleine largeur. `left` : vignette à côté du texte,
     *  pour les cartes compactes alignées en `flex-wrap`. */
    mediaPosition?: 'top' | 'left';
    footer?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

export const ContentCard: React.FC<ContentCardProps> = ({ to, onClick, media, mediaPosition = 'top', footer, className, children }) => {
    const lateral = mediaPosition === 'left';
    const body = lateral ? (
        <div className="p-4 flex items-start gap-3 flex-1 min-w-0">
            {media}
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    ) : (
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

/**
 * Image d'en-tête d'une carte. Elle était écrite trois fois — dans `Card`, dans la liste
 * communautaire et à la main dans la page des peuples — avec trois hauteurs et deux
 * traitements de survol.
 */
export const CardMedia: React.FC<{ src?: string; alt: string; className?: string }> = ({ src, alt, className }) => (
    <div className="relative h-48 overflow-hidden bg-gradient-to-b from-stone-900/50 to-stone-950">
        <img
            src={src || imagePlaceholder(alt)}
            alt={alt}
            onError={onImageError(alt)}
            className={`w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ${className ?? ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60"></div>
    </div>
);

