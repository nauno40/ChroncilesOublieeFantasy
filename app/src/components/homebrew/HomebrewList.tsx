import React from 'react';
import { Globe, Lock, Edit, Trash2, Copy } from 'lucide-react';
import { AuthorTag, CompendiumTable, ContentCard, CardMedia } from '../common';
import { categoryLabel, type HomebrewEntry } from '../../services/homebrewService';
import { COLONNES_TABLE, LABEL_NOM, modDegats, type TypeTabulaire } from '../../domain/tablesCompendium';

/**
 * Rendu de la liste communautaire, fidèle au format officiel de chaque catégorie :
 * les catégories que le compendium officiel affiche en **tableau** (équipement, objet
 * magique, poison, piège) sont rendues en tableau avec les mêmes colonnes ; les autres
 * (race, classe, voie, capacité, état) restent en grille de cartes du design system.
 * Ainsi une création communautaire a la même tête que son équivalent officiel.
 */

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

// Catégories dont les cartes officielles portent une image d'en-tête (Races, Classes).
// Le contenu communautaire y reçoit une image générique (initiale) pour la même tête.
const IMAGE_CATEGORIES = new Set(['race', 'classe']);

// Catégories dont les pages officielles utilisent une grille dense (4 colonnes) et un
// titre plus petit : Voies et Capacités & Sorts.
const DENSE_CATEGORIES = new Set(['voie', 'capacite', 'sort']);

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

/** Pastille de visibilité, posée partout où une entrée communautaire s'affiche. */
const Visibilite: React.FC<{ entry: HomebrewEntry; size?: number }> = ({ entry, size = 12 }) => (
    entry.visibility === 'public'
        ? <Globe size={size} className="text-green-500/70 shrink-0" aria-label="Public" />
        : <Lock size={size} className="text-stone-400 shrink-0" aria-label="Privé" />
);

/** Pied d'actions d'une carte communautaire : identique pour les états et pour les
 *  autres types, il était pourtant écrit deux fois, à deux tailles d'icône près. */
const CardActions: React.FC<{ entry: HomebrewEntry; mine: boolean; duplicating: boolean; onEdit: () => void; onDelete: () => void; onDuplicate: () => void }> = ({ mine, duplicating, onEdit, onDelete, onDuplicate }) => (
    mine ? (
        <div className="flex">
            <button onClick={e => { e.stopPropagation(); onEdit(); }} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all"><Edit size={12} /> Modifier</button>
            <button onClick={e => { e.stopPropagation(); onDuplicate(); }} disabled={duplicating} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5 disabled:opacity-50"><Copy size={12} /> {duplicating ? 'Copie…' : 'Dupliquer'}</button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-red-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5"><Trash2 size={12} /> Supprimer</button>
        </div>
    ) : (
        <button onClick={e => { e.stopPropagation(); onDuplicate(); }} disabled={duplicating} className="w-full py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"><Copy size={12} /> {duplicating ? 'Copie…' : 'Dupliquer chez moi'}</button>
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
    const locked = typeof category === 'string';

    // --- Types dont la table est partagée avec la page officielle ---
    // La donnée communautaire vit sous `entry.data`, l'officielle à la racine de l'entité :
    // seul l'accesseur diffère, la table et ses colonnes sont les mêmes objets.
    const typeTabulaire: TypeTabulaire | null = category === 'poison' || category === 'piege' || category === 'objet-magique'
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

    // --- Rendu compact (États) : même coquille que la page officielle, en `media` latéral.
    if (category === 'etat') {
        return (
            <div className="flex flex-wrap gap-3">
                {entries.map(entry => (
                    <ContentCard
                        key={entry.id}
                        onClick={() => onOpen(entry)}
                        mediaPosition="left"
                        className="min-w-[200px] max-w-[320px] flex-1"
                        footer={<CardActions entry={entry} mine={entry.authorId === myId} duplicating={duplicatingId === entry.id} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} onDuplicate={() => onDuplicate(entry)} />}
                    >
                        <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-display font-bold text-primary-300 mb-1 group-hover:text-primary-200 transition-colors">{entry.name}</h3>
                                <p className="text-xs text-stone-400 line-clamp-2">{entry.description}</p>
                                {entry.authorId !== myId && <div className="mt-2"><AuthorTag pseudo={entry.authorPseudo} /></div>}
                            </div>
                            <Visibilite entry={entry} />
                        </div>
                    </ContentCard>
                ))}
            </div>
        );
    }

    // --- Rendu grille de cartes : la coquille du design system, comme les pages
    // officielles Peuples / Classes / Voies / Capacités. Voies et Capacités s'affichent
    // en grille plus dense (4 colonnes) et avec un titre plus petit.
    const dense = typeof category === 'string'
        ? DENSE_CATEGORIES.has(category)
        : (category ?? []).every(c => DENSE_CATEGORIES.has(c)) && (category ?? []).length > 0;
    return (
        <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-4 ${dense ? 'xl:grid-cols-4' : ''}`}>
            {entries.map(entry => {
                const mine = entry.authorId === myId;
                const dataImg = typeof entry.data?.image === 'string' ? entry.data.image : undefined;
                return (
                    <ContentCard
                        key={entry.id}
                        onClick={() => onOpen(entry)}
                        className="h-full"
                        media={IMAGE_CATEGORIES.has(entry.category) ? <CardMedia alt={entry.name} src={dataImg} /> : undefined}
                        footer={<CardActions entry={entry} mine={mine} duplicating={duplicatingId === entry.id} onEdit={() => onEdit(entry)} onDelete={() => onDelete(entry)} onDuplicate={() => onDuplicate(entry)} />}
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            {!locked
                                ? <span className="text-[11px] uppercase font-bold tracking-wider text-primary-400/80 border border-primary-500/30 rounded px-1.5 py-0.5">{categoryLabel(entry.category)}</span>
                                : <span />}
                            <Visibilite entry={entry} size={14} />
                        </div>
                        <h3 className={`font-display font-bold mb-2 transition-colors leading-tight ${dense ? 'text-lg text-primary-200 group-hover:text-primary-100' : 'text-xl text-primary-300 group-hover:text-primary-200'}`}>{entry.name}</h3>
                        {entry.description && <p className={`text-stone-400 line-clamp-3 ${dense ? 'text-xs leading-relaxed' : 'text-sm'}`}>{entry.description}</p>}
                        {!mine && <div className="mt-3 pt-3 border-t border-white/5"><AuthorTag pseudo={entry.authorPseudo} /></div>}
                    </ContentCard>
                );
            })}
        </div>
    );
};
