import React from 'react';
import { Edit, Trash2, Copy } from 'lucide-react';
import { AuthorTag } from '../common';

interface OwnerBarProps {
    pseudo?: string | null;
    visibility?: 'public' | 'private';
    mine: boolean;
    duplicating?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
}

/**
 * Bandeau propriétaire : unique différence visuelle admise entre une fiche officielle
 * et une fiche communautaire. Toute autre divergence doit être refusée en revue.
 */
export const OwnerBar: React.FC<OwnerBarProps> = ({ pseudo, visibility, mine, duplicating, onEdit, onDelete, onDuplicate }) => (
    <div className="mt-4 flex flex-wrap items-center gap-3 glass-panel rounded-xl border border-white/5 px-4 py-2.5">
        <AuthorTag pseudo={pseudo} visibility={visibility} size="md" />
        <div className="flex items-center gap-2 ml-auto">
            {/* Un bouton n'est rendu que si son gestionnaire existe : pas d'action morte. */}
            {mine && onEdit && (
                <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-bold uppercase text-stone-400 hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                    <Edit size={14} /> Modifier
                </button>
            )}
            {mine && onDelete && (
                <button onClick={onDelete} className="flex items-center gap-1.5 text-xs font-bold uppercase text-stone-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
                    <Trash2 size={14} /> Supprimer
                </button>
            )}
            {!mine && onDuplicate && (
                <button onClick={onDuplicate} disabled={duplicating} className="flex items-center gap-1.5 text-xs font-bold uppercase text-stone-400 hover:text-primary-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50">
                    <Copy size={14} /> {duplicating ? 'Copie…' : 'Dupliquer chez moi'}
                </button>
            )}
        </div>
    </div>
);
