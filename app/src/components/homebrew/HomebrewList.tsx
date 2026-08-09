import React from 'react';
import { Globe, Lock, Edit, Trash2, Copy } from 'lucide-react';
import { AuthorTag, CompendiumTable } from '../common';
import { categoryLabel, type HomebrewEntry } from '../../services/homebrewService';
import { imagePlaceholder, onImageError } from '../common/imagePlaceholder';
import { COLONNES_TABLE, LABEL_NOM, modDegats, type TypeTabulaire } from '../../domain/tablesCompendium';

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
    'objet-magique': [
        { key: 'type', label: 'Type' },
        { key: 'rarity', label: 'Rareté' },
        { key: 'properties', label: 'Propriétés', wrap: true },
        { key: 'price', label: 'Prix', num: true },
    ],
    // Poisons, pièges et équipement ne sont plus décrits ici : leurs colonnes sont
    // celles de `COLONNES_TABLE`, partagées avec la page officielle. Restent les objets
    // magiques, dont la page officielle n'est pas une liste mais un outil de génération
    // — l'iso y demande d'abord une décision de fond, pas un partage de composant.
};

/**
 * Lecture d'une colonne partagée sur une entrée communautaire.
 *
 * Le schéma communautaire ne nomme pas tout comme les entités officielles : une seule
 * liste `properties` y tient le rôle des trois champs de commentaire des tables
 * officielles (`requirements` d'une arme, `comments` d'une armure, `notes` d'un
 * matériel). Et `mod` n'est stocké nulle part — il se calcule, des deux côtés.
 */
const valeurCommunautaire = (entry: HomebrewEntry, key: string): unknown => {
    const data = entry.data ?? {};
    if (key === 'mod') return modDegats(String(data.type ?? ''));
    if (key === 'requirements' || key === 'comments' || key === 'notes') return data.properties;
    return data[key];
};

/** Renvoie la catégorie tabulaire unique de la page, ou null (grille de cartes). */
const tableCategoryOf = (category?: string | string[]): string | null => {
    if (typeof category !== 'string') return null;
    return TABLE_COLUMNS[category] ? category : null;
};

// Catégories dont les cartes officielles portent une image d'en-tête (Races, Classes).
// Le contenu communautaire y reçoit une image générique (initiale) pour la même tête.
const IMAGE_CATEGORIES = new Set(['race', 'classe']);

// Catégories dont les pages officielles utilisent une grille dense (4 colonnes) et un
// titre plus petit : Voies et Capacités & Sorts.
const DENSE_CATEGORIES = new Set(['voie', 'capacite', 'sort']);

/** Placeholder SVG générique (initiale) — identique au fallback du composant Card officiel. */
/** En-tête image d'une carte communautaire (image fournie sinon générique), calqué sur Card. */
const CardMedia: React.FC<{ alt: string; src?: string }> = ({ alt, src }) => (
    <div className="relative h-48 overflow-hidden bg-gradient-to-b from-stone-900/50 to-stone-950 rounded-t-xl">
        <img
            src={src || imagePlaceholder(alt)}
            alt={alt}
            className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
            onError={onImageError(alt)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-60"></div>
    </div>
);

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
            <button onClick={e => { e.stopPropagation(); onEdit(); }} title="Modifier" className="p-1.5 rounded-lg text-stone-400 hover:text-primary-400 hover:bg-white/5 transition-colors"><Edit size={14} /></button>
            {/* Dupliquer son propre contenu : point de départ d'une variante. */}
            <button onClick={e => { e.stopPropagation(); onDuplicate(); }} disabled={duplicating} title="Dupliquer" className="p-1.5 rounded-lg text-stone-400 hover:text-primary-400 hover:bg-white/5 transition-colors disabled:opacity-50"><Copy size={14} /></button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} title="Supprimer" className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-white/5 transition-colors"><Trash2 size={14} /></button>
        </div>
    ) : (
        <div className="flex items-center justify-end gap-2">
            <AuthorTag pseudo={entry.authorPseudo} size="sm" />
            <button onClick={e => { e.stopPropagation(); onDuplicate(); }} disabled={duplicating} title="Dupliquer chez moi" className="p-1.5 rounded-lg text-stone-400 hover:text-primary-400 hover:bg-white/5 transition-colors disabled:opacity-50"><Copy size={14} /></button>
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
    /** Sous-type d'équipement affiché (pastilles Armes / Armures / Matériel de la page
     *  officielle) : il pilote le jeu de colonnes, comme les onglets côté officiel. */
    sousType?: 'arme' | 'armure' | 'materiel';
}

export const HomebrewList: React.FC<HomebrewListProps> = ({ entries, category, myId, duplicatingId, onOpen, onEdit, onDelete, onDuplicate, sousType }) => {
    const tableCat = tableCategoryOf(category);
    const locked = typeof category === 'string';

    // --- Types dont la table est partagée avec la page officielle ---
    // La donnée communautaire vit sous `entry.data`, l'officielle à la racine de l'entité :
    // seul l'accesseur diffère, la table et ses colonnes sont les mêmes objets.
    const typeTabulaire: TypeTabulaire | null = category === 'poison' || category === 'piege'
        ? category
        : category === 'equipement'
            ? (sousType ?? 'arme')
            : null;

    if (typeTabulaire) {
        return (
            <CompendiumTable
                colonnes={COLONNES_TABLE[typeTabulaire]}
                labelNom={LABEL_NOM[typeTabulaire]}
                lignes={entries}
                cle={e => e.id}
                nom={e => e.name}
                valeur={(e, key) => valeurCommunautaire(e, key)}
                sousNom={e => (e.visibility === 'public'
                    ? <Globe size={12} className="text-green-500/70 shrink-0" aria-label="Public" />
                    : <Lock size={12} className="text-stone-400 shrink-0" aria-label="Privé" />)}
                detail={e => e.description
                    ? <div className="text-stone-400 text-xs mt-0.5 font-normal line-clamp-1 max-w-[26ch]">{e.description}</div>
                    : null}
                onLigneClick={onOpen}
                colonneFin={{
                    label: myId !== undefined ? 'Auteur / Actions' : 'Auteur',
                    rendu: e => (
                        <RowActions
                            entry={e}
                            mine={e.authorId === myId}
                            duplicating={duplicatingId === e.id}
                            onEdit={() => onEdit(e)}
                            onDelete={() => onDelete(e)}
                            onDuplicate={() => onDuplicate(e)}
                        />
                    ),
                }}
            />
        );
    }

    // --- Rendu tableau (catégories tabulaires : mêmes colonnes que l'officiel) ---
    if (tableCat) {
        const cols = TABLE_COLUMNS[tableCat];
        const minW = 440 + cols.length * 130;
        // Deux habillages de table selon la page officielle imitée : Equipment.tsx utilise
        // des en-têtes larges (p-4, font-display, primary-300) dans un panneau rounded-xl ;
        // Poisons.tsx / Traps.tsx des en-têtes fins en petites capitales, panneau rounded-2xl.
        const big = tableCat === 'equipement' || tableCat === 'objet-magique';
        const wrapCls = big
            ? 'hidden md:block glass-panel rounded-xl overflow-x-auto'
            : 'hidden md:block glass-panel rounded-2xl border border-white/5 overflow-x-auto';
        const headRowCls = big
            ? 'border-b border-white/10 bg-black/20'
            : 'text-[11px] uppercase tracking-wider text-primary-500/70 border-b border-white/10';
        const thCls = big ? 'p-4 text-primary-300 font-display font-bold whitespace-nowrap' : 'px-4 py-3 font-bold';
        const tdCls = big ? 'p-4' : 'px-4 py-3';
        return (
            <>
                {/* Desktop : table complète, calquée sur le compendium officiel */}
                <div className={wrapCls}>
                    <table className={`w-full text-left border-collapse ${big ? '' : 'text-sm'}`} style={{ minWidth: minW }}>
                        <thead>
                            <tr className={headRowCls}>
                                <th className={thCls}>Nom</th>
                                {cols.map(c => (
                                    <th key={c.key} className={`${thCls} ${c.num ? 'text-right' : ''}`}>{c.label}</th>
                                ))}
                                <th className={`${thCls} text-right sticky right-0 bg-stone-950/95 backdrop-blur-sm`}>{myId !== undefined ? 'Auteur / Actions' : 'Auteur'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {entries.map(entry => {
                                const mine = entry.authorId === myId;
                                const data = entry.data ?? {};
                                return (
                                    <tr key={entry.id} onClick={() => onOpen(entry)} className="hover:bg-primary-500/5 transition-colors cursor-pointer">
                                        <td className={`${tdCls} align-top`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-stone-200 font-bold">{entry.name}</span>
                                                {entry.visibility === 'public'
                                                    ? <Globe size={12} className="text-green-500/70 shrink-0" aria-label="Public" />
                                                    : <Lock size={12} className="text-stone-400 shrink-0" aria-label="Privé" />}
                                            </div>
                                            {entry.description && <div className="text-stone-400 text-xs mt-0.5 line-clamp-1 max-w-[26ch]">{entry.description}</div>}
                                        </td>
                                        {cols.map(c => (
                                            <td key={c.key} className={`${tdCls} align-top ${c.num ? 'text-right font-mono text-stone-300' : 'text-stone-400'} ${c.wrap ? 'text-xs min-w-[16ch] max-w-[28ch]' : 'whitespace-nowrap text-sm'}`}>
                                                {c.wrap
                                                    ? <span className="line-clamp-2 leading-snug">{fmt(data[c.key], c)}</span>
                                                    : fmt(data[c.key], c)}
                                            </td>
                                        ))}
                                        <td className={`${tdCls} align-top text-right sticky right-0 bg-stone-950/95 backdrop-blur-sm`}>
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
                                            : <Lock size={12} className="text-stone-400 shrink-0" />}
                                    </h3>
                                    <RowActions entry={entry} mine={mine} duplicating={duplicatingId === entry.id} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} onDuplicate={() => onDuplicate(entry)} />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
                                    {cols.map(c => {
                                        const val = fmt(data[c.key], c);
                                        if (val === '—') return null;
                                        return (
                                            <div key={c.key} className="min-w-0">
                                                <span className="text-stone-400 text-xs">{c.label} </span>
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

    // --- Rendu « puces » (États) : la page officielle States.tsx aligne de petites
    // cartes en flex-wrap (min-w 200px, titre text-base, description sur 2 lignes). ---
    if (category === 'etat') {
        return (
            <div className="flex flex-wrap gap-3">
                {entries.map(entry => {
                    const mine = entry.authorId === myId;
                    return (
                        <div key={entry.id} className="glass-panel rounded-xl border border-white/5 hover:border-primary-500/30 transition-all group min-w-[200px] max-w-[320px] flex-1 overflow-hidden">
                            <button onClick={() => onOpen(entry)} className="text-left w-full p-4 flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-display font-bold text-primary-300 mb-1 group-hover:text-primary-200 transition-colors">{entry.name}</h3>
                                    <p className="text-xs text-stone-400 line-clamp-2">{entry.description}</p>
                                    {!mine && <div className="mt-2"><AuthorTag pseudo={entry.authorPseudo} /></div>}
                                </div>
                                {entry.visibility === 'public'
                                    ? <Globe size={12} className="text-green-500/70 shrink-0 mt-1" aria-label="Public" />
                                    : <Lock size={12} className="text-stone-400 shrink-0 mt-1" aria-label="Privé" />}
                            </button>
                            <div className="border-t border-white/5">
                                {mine ? (
                                    <div className="flex">
                                        <button onClick={e => { e.stopPropagation(); onEdit(entry); }} className="flex-1 py-1.5 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all"><Edit size={11} /> Modifier</button>
                                        <button onClick={e => { e.stopPropagation(); onDuplicate(entry); }} disabled={duplicatingId === entry.id} className="flex-1 py-1.5 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5 disabled:opacity-50"><Copy size={11} /> {duplicatingId === entry.id ? 'Copie…' : 'Dupliquer'}</button>
                                        <button onClick={e => { e.stopPropagation(); onDelete(entry); }} className="flex-1 py-1.5 text-[11px] font-bold uppercase text-stone-400 hover:text-red-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5"><Trash2 size={11} /> Supprimer</button>
                                    </div>
                                ) : (
                                    <button onClick={e => { e.stopPropagation(); onDuplicate(entry); }} disabled={duplicatingId === entry.id} className="w-full py-1.5 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"><Copy size={11} /> {duplicatingId === entry.id ? 'Copie…' : 'Dupliquer'}</button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // --- Rendu grille de cartes (calqué sur le composant Card officiel) ---
    // Les pages officielles Voies/Capacités utilisent une grille plus dense (4 colonnes)
    // et un titre plus petit ; Races/Classes sont en 3 colonnes avec un titre text-xl.
    const dense = typeof category === 'string'
        ? DENSE_CATEGORIES.has(category)
        : (category ?? []).every(c => DENSE_CATEGORIES.has(c)) && (category ?? []).length > 0;
    return (
        <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-4 ${dense ? 'xl:grid-cols-4' : ''}`}>
            {entries.map(entry => {
                const mine = entry.authorId === myId;
                const dataImg = typeof entry.data?.image === 'string' ? entry.data.image : undefined;
                const hasImage = IMAGE_CATEGORIES.has(entry.category);
                return (
                    <div key={entry.id} className="glass-panel rounded-xl border-white/5 transition-all duration-300 group hover:border-primary-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:-translate-y-1 overflow-hidden flex flex-col">
                        <button onClick={() => onOpen(entry)} className="text-left flex flex-col flex-1 min-w-0">
                            {hasImage && <CardMedia alt={entry.name} src={dataImg} />}
                            <div className="p-4 flex-1 flex flex-col min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    {!locked
                                        ? <span className="text-[11px] uppercase font-bold tracking-wider text-primary-400/80 border border-primary-500/30 rounded px-1.5 py-0.5">{categoryLabel(entry.category)}</span>
                                        : <span />}
                                    {entry.visibility === 'public'
                                        ? <Globe size={14} className="text-green-500/70 shrink-0 mt-0.5" aria-label="Public" />
                                        : <Lock size={14} className="text-stone-400 shrink-0 mt-0.5" aria-label="Privé" />}
                                </div>
                                <h3 className={`font-display font-bold mb-2 transition-colors leading-tight ${dense ? 'text-lg text-primary-200 group-hover:text-primary-100' : 'text-xl text-primary-300 group-hover:text-primary-200'}`}>{entry.name}</h3>
                                {entry.description && <p className={`text-stone-400 line-clamp-3 ${dense ? 'text-xs leading-relaxed' : 'text-sm'}`}>{entry.description}</p>}
                                {!mine && <div className="mt-3 pt-3 border-t border-white/5"><AuthorTag pseudo={entry.authorPseudo} /></div>}
                            </div>
                        </button>
                        <div className="border-t border-white/5">
                            {mine ? (
                                <div className="flex">
                                    <button onClick={e => { e.stopPropagation(); onEdit(entry); }} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all"><Edit size={12} /> Modifier</button>
                                    <button onClick={e => { e.stopPropagation(); onDuplicate(entry); }} disabled={duplicatingId === entry.id} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5 disabled:opacity-50"><Copy size={12} /> {duplicatingId === entry.id ? 'Copie…' : 'Dupliquer'}</button>
                                    <button onClick={e => { e.stopPropagation(); onDelete(entry); }} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-red-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5"><Trash2 size={12} /> Supprimer</button>
                                </div>
                            ) : (
                                <button onClick={e => { e.stopPropagation(); onDuplicate(entry); }} disabled={duplicatingId === entry.id} className="w-full py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"><Copy size={12} /> {duplicatingId === entry.id ? 'Copie…' : 'Dupliquer chez moi'}</button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
