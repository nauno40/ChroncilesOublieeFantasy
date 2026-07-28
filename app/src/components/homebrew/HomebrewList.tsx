import React from 'react';
import { Globe, Lock, Edit, Trash2, Copy } from 'lucide-react';
import { ContentCard, AuthorTag } from '../common';
import { categoryLabel, type HomebrewEntry } from '../../services/homebrewService';

/**
 * Rendu de la liste communautaire, fidèle au format officiel de chaque catégorie :
 * les catégories que le compendium officiel affiche en **tableau** (équipement, objet
 * magique, poison, piège) sont rendues en tableau avec les mêmes colonnes ; les autres
 * (race, classe, voie, capacité, état) restent en grille de cartes du design system.
 * Ainsi une création communautaire a la même tête que son équivalent officiel.
 */

interface Col {
    key: string;
    label: string;
    /** Aligne à droite + police mono (valeurs chiffrées : prix, dégâts…). */
    num?: boolean;
    /** Préfixe « + » pour un bonus numérique (ex. DEF d'armure). */
    plus?: boolean;
    /** Colonne de texte long : autorise le retour à la ligne et tronque. */
    wrap?: boolean;
}

// Colonnes par catégorie tabulaire, calquées sur les tables officielles
// (Equipment.tsx, Poisons.tsx, Traps.tsx). Le nom est toujours la 1re colonne.
const TABLE_COLUMNS: Record<string, Col[]> = {
    equipement: [
        { key: 'type', label: 'Type' },
        { key: 'damage', label: 'Dégâts', num: true },
        { key: 'acBonus', label: 'DEF', num: true, plus: true },
        { key: 'price', label: 'Prix', num: true },
    ],
    'objet-magique': [
        { key: 'type', label: 'Type' },
        { key: 'rarity', label: 'Rareté' },
        { key: 'properties', label: 'Propriétés', wrap: true },
        { key: 'price', label: 'Prix', num: true },
    ],
    poison: [
        { key: 'effectFail', label: 'Effet — Échec', wrap: true },
        { key: 'effectSuccess', label: 'Effet — Réussite', wrap: true },
        { key: 'duration', label: 'Durée' },
        { key: 'delay', label: 'Délai' },
        { key: 'note', label: 'Note', wrap: true },
    ],
    piege: [
        { key: 'detectDifficulty', label: 'Détection' },
        { key: 'disarmDifficulty', label: 'Désamorçage' },
        { key: 'effect', label: 'Effet', wrap: true },
        { key: 'complement', label: 'Complément', wrap: true },
    ],
};

/** Renvoie la catégorie tabulaire unique de la page, ou null (grille de cartes). */
const tableCategoryOf = (category?: string | string[]): string | null => {
    if (typeof category !== 'string') return null;
    return TABLE_COLUMNS[category] ? category : null;
};

/** Formate une valeur `data` (JSON libre) pour une cellule/champ. */
const fmt = (v: unknown, col: Col): string => {
    if (v === undefined || v === null || v === '') return '—';
    if (Array.isArray(v)) return v.filter(Boolean).join(' · ') || '—';
    if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
    if (col.plus && typeof v === 'number') return `+${v}`;
    return String(v);
};

interface RowActionsProps {
    entry: HomebrewEntry;
    mine: boolean;
    duplicating: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const RowActions: React.FC<RowActionsProps> = ({ entry, mine, duplicating, onEdit, onDelete, onDuplicate }) => (
    mine ? (
        <div className="flex items-center justify-end gap-1">
            <button onClick={e => { e.stopPropagation(); onEdit(); }} title="Modifier" className="p-1.5 rounded-lg text-stone-500 hover:text-primary-400 hover:bg-white/5 transition-colors"><Edit size={14} /></button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Supprimer" className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-white/5 transition-colors"><Trash2 size={14} /></button>
        </div>
    ) : (
        <div className="flex items-center justify-end gap-2">
            <AuthorTag pseudo={entry.authorPseudo} size="sm" />
            <button onClick={e => { e.stopPropagation(); onDuplicate(); }} disabled={duplicating} title="Dupliquer chez moi" className="p-1.5 rounded-lg text-stone-500 hover:text-primary-400 hover:bg-white/5 transition-colors disabled:opacity-50"><Copy size={14} /></button>
        </div>
    )
);

interface HomebrewListProps {
    entries: HomebrewEntry[];
    category?: string | string[];
    myId?: number | string;
    duplicatingId: number | null;
    onOpen: (e: HomebrewEntry) => void;
    onEdit: (e: HomebrewEntry) => void;
    onDelete: (e: HomebrewEntry) => void;
    onDuplicate: (e: HomebrewEntry) => void;
}

export const HomebrewList: React.FC<HomebrewListProps> = ({ entries, category, myId, duplicatingId, onOpen, onEdit, onDelete, onDuplicate }) => {
    const tableCat = tableCategoryOf(category);
    const locked = typeof category === 'string';

    // --- Rendu tableau (catégories tabulaires : mêmes colonnes que l'officiel) ---
    if (tableCat) {
        const cols = TABLE_COLUMNS[tableCat];
        const minW = 440 + cols.length * 130;
        return (
            <>
                {/* Desktop : table complète, calquée sur le compendium officiel */}
                <div className="hidden md:block glass-panel rounded-2xl border border-white/5 overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse" style={{ minWidth: minW }}>
                        <thead>
                            <tr className="text-[10px] uppercase tracking-wider text-primary-500/70 border-b border-white/10">
                                <th className="px-4 py-3 font-bold">Nom</th>
                                {cols.map(c => (
                                    <th key={c.key} className={`px-4 py-3 font-bold ${c.num ? 'text-right' : ''}`}>{c.label}</th>
                                ))}
                                <th className="px-4 py-3 font-bold text-right sticky right-0 bg-stone-950/95 backdrop-blur-sm">{myId !== undefined ? 'Auteur / Actions' : 'Auteur'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {entries.map(entry => {
                                const mine = entry.authorId === myId;
                                const data = entry.data ?? {};
                                return (
                                    <tr key={entry.id} onClick={() => onOpen(entry)} className="hover:bg-primary-500/5 transition-colors cursor-pointer">
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex items-center gap-2">
                                                <span className="text-stone-100 font-bold">{entry.name}</span>
                                                {entry.visibility === 'public'
                                                    ? <Globe size={12} className="text-green-500/70 shrink-0" aria-label="Public" />
                                                    : <Lock size={12} className="text-stone-600 shrink-0" aria-label="Privé" />}
                                            </div>
                                            {entry.description && <div className="text-stone-500 text-xs mt-0.5 line-clamp-1 max-w-[26ch]">{entry.description}</div>}
                                        </td>
                                        {cols.map(c => (
                                            <td key={c.key} className={`px-4 py-3 align-top ${c.num ? 'text-right font-mono text-stone-300' : 'text-stone-400'} ${c.wrap ? 'text-xs min-w-[16ch] max-w-[28ch]' : 'whitespace-nowrap text-sm'}`}>
                                                {c.wrap
                                                    ? <span className="line-clamp-2 leading-snug">{fmt(data[c.key], c)}</span>
                                                    : fmt(data[c.key], c)}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 align-top text-right sticky right-0 bg-stone-950/95 backdrop-blur-sm">
                                            <RowActions entry={entry} mine={mine} duplicating={duplicatingId === entry.id} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} onDuplicate={() => onDuplicate(entry)} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile : cartes empilées (comme les tables officielles sur petit écran) */}
                <div className="md:hidden space-y-3">
                    {entries.map(entry => {
                        const mine = entry.authorId === myId;
                        const data = entry.data ?? {};
                        return (
                            <div key={entry.id} onClick={() => onOpen(entry)} className="glass-panel rounded-xl p-4 cursor-pointer active:scale-[0.99] transition-transform">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-display font-bold text-stone-100 leading-tight flex items-center gap-2">
                                        {entry.name}
                                        {entry.visibility === 'public'
                                            ? <Globe size={12} className="text-green-500/70 shrink-0" />
                                            : <Lock size={12} className="text-stone-600 shrink-0" />}
                                    </h3>
                                    <RowActions entry={entry} mine={mine} duplicating={duplicatingId === entry.id} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} onDuplicate={() => onDuplicate(entry)} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                                    {cols.map(c => {
                                        const val = fmt(data[c.key], c);
                                        if (val === '—') return null;
                                        return (
                                            <div key={c.key} className="min-w-0">
                                                <span className="text-stone-500 text-xs">{c.label} </span>
                                                <span className="text-stone-300 text-sm break-words">{val}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    }

    // --- Rendu grille de cartes (autres catégories) ---
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map(entry => {
                const mine = entry.authorId === myId;
                return (
                    <ContentCard
                        key={entry.id}
                        onClick={() => onOpen(entry)}
                        footer={mine ? (
                            <div className="flex">
                                <button onClick={e => { e.stopPropagation(); onEdit(entry); }} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all"><Edit size={12} /> Modifier</button>
                                <button onClick={e => { e.stopPropagation(); onDelete(entry); }} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-red-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5"><Trash2 size={12} /> Supprimer</button>
                            </div>
                        ) : (
                            <button onClick={e => { e.stopPropagation(); onDuplicate(entry); }} disabled={duplicatingId === entry.id} className="w-full py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"><Copy size={12} /> {duplicatingId === entry.id ? 'Copie…' : 'Dupliquer chez moi'}</button>
                        )}
                    >
                        <div className="flex items-center justify-between gap-2 mb-2">
                            {!locked ? <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400/80 border border-primary-500/30 rounded px-1.5 py-0.5">{categoryLabel(entry.category)}</span> : <span />}
                            {entry.visibility === 'public'
                                ? <Globe size={13} className="text-green-500/70" aria-label="Public" />
                                : <Lock size={13} className="text-stone-600" aria-label="Privé" />}
                        </div>
                        <h3 className="font-display font-bold text-stone-100 group-hover:text-primary-300 leading-tight">{entry.name}</h3>
                        {entry.description && <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-snug">{entry.description}</p>}
                        {!mine && <div className="mt-3"><AuthorTag pseudo={entry.authorPseudo} /></div>}
                    </ContentCard>
                );
            })}
        </div>
    );
};
