import React from 'react';
import { Globe, Lock } from 'lucide-react';

/**
 * Étiquette d'auteur communautaire : avatar en initiale (couleur déterministe depuis
 * le pseudo) + pseudo + badge de visibilité optionnel. Design system — à utiliser sur
 * toute carte/fiche de contenu partagé pour ancrer le côté communautaire.
 */
const PALETTE = [
    'bg-rose-500/25 text-rose-200',
    'bg-amber-500/25 text-amber-200',
    'bg-emerald-500/25 text-emerald-200',
    'bg-sky-500/25 text-sky-200',
    'bg-violet-500/25 text-violet-200',
    'bg-orange-500/25 text-orange-200',
    'bg-teal-500/25 text-teal-200',
];

const colorFor = (s: string) => PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

interface AuthorTagProps {
    pseudo?: string | null;
    visibility?: 'public' | 'private';
    size?: 'sm' | 'md';
}

export const AuthorTag: React.FC<AuthorTagProps> = ({ pseudo, visibility, size = 'sm' }) => {
    const name = pseudo || 'Anonyme';
    const initial = name.charAt(0).toUpperCase();
    const sm = size === 'sm';
    return (
        <span className="inline-flex items-center gap-1.5 text-stone-400 min-w-0">
            <span className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${sm ? 'size-5 text-[10px]' : 'size-7 text-xs'} ${colorFor(name)}`}>{initial}</span>
            <span className={`truncate ${sm ? 'text-[11px]' : 'text-sm'}`}>{name}</span>
            {visibility === 'public' && <Globe size={sm ? 11 : 13} className="text-green-500/70 shrink-0" aria-label="Public" />}
            {visibility === 'private' && <Lock size={sm ? 11 : 13} className="text-stone-600 shrink-0" aria-label="Privé" />}
        </span>
    );
};
