import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Lock, Edit, Trash2, X, Copy, Search } from 'lucide-react';
import { Loader, ContentCard, AuthorTag } from '../common';
import { useAuth } from '../../context/AuthContext';
import { HomebrewService, HOMEBREW_CATEGORIES, categoryLabel, type HomebrewEntry, type HomebrewInput } from '../../services/homebrewService';
import { HOMEBREW_SCHEMAS, hasStructuredSchema, pruneToSchema } from '../../services/homebrewSchemas';
import { HomebrewFields } from './HomebrewFields';

type Tab = 'mine' | 'community';

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
    <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400/80 border border-primary-500/30 rounded px-1.5 py-0.5">{categoryLabel(category)}</span>
);

const Card: React.FC<{ entry: HomebrewEntry; mine: boolean; duplicating: boolean; showCategory: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void; onDuplicate: () => void }> = ({ entry, mine, duplicating, showCategory, onOpen, onEdit, onDelete, onDuplicate }) => (
    <ContentCard
        onClick={onOpen}
        footer={mine ? (
            <div className="flex">
                <button onClick={e => { e.stopPropagation(); onEdit(); }} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all"><Edit size={12} /> Modifier</button>
                <button onClick={e => { e.stopPropagation(); onDelete(); }} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-red-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5"><Trash2 size={12} /> Supprimer</button>
            </div>
        ) : (
            <button onClick={e => { e.stopPropagation(); onDuplicate(); }} disabled={duplicating} className="w-full py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"><Copy size={12} /> {duplicating ? 'Copie…' : 'Dupliquer chez moi'}</button>
        )}
    >
        <div className="flex items-center justify-between gap-2 mb-2">
            {showCategory ? <CategoryBadge category={entry.category} /> : <span />}
            {entry.visibility === 'public'
                ? <Globe size={13} className="text-green-500/70" aria-label="Public" />
                : <Lock size={13} className="text-stone-600" aria-label="Privé" />}
        </div>
        <h3 className="font-display font-bold text-stone-100 group-hover:text-primary-300 leading-tight">{entry.name}</h3>
        {entry.description && <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-snug">{entry.description}</p>}
        {!mine && <div className="mt-3"><AuthorTag pseudo={entry.authorPseudo} /></div>}
    </ContentCard>
);

interface HomebrewBrowserProps {
    tab: Tab;
    onTabChange: (t: Tab) => void;
    /**
     * Catégorie(s) de la page de type. Une seule string → catégorie verrouillée (sélecteur/chips/badge
     * masqués). Un tableau → sélecteur limité à ces catégories (ex. Capacités & Sorts). Absent → toutes.
     */
    category?: string | string[];
}

/**
 * Cœur réutilisable de la Bibliothèque : liste + création/édition/détail/duplication du
 * contenu homebrew. Utilisé tel quel par la Bibliothèque (toutes catégories) et par les
 * pages de type du compendium (catégorie verrouillée), sous l'onglet Communauté/Mes créations.
 */
export const HomebrewBrowser: React.FC<HomebrewBrowserProps> = ({ tab, onTabChange, category }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const myId = user?.id;
    // Catégories de la page : null = toutes ; 1 = verrouillée ; >1 = choix limité.
    const cats: string[] | null = category ? (Array.isArray(category) ? category : [category]) : null;
    const locked = cats?.length === 1;                 // sélecteur/chips/badge masqués
    const catOptions = cats
        ? HOMEBREW_CATEGORIES.filter(c => cats.includes(c.value))
        : HOMEBREW_CATEGORIES;                          // options du sélecteur du formulaire
    const emptyInput = (): HomebrewInput => ({ category: cats ? cats[0] : 'sort', name: '', description: '', visibility: 'private', data: {} });

    const [entries, setEntries] = useState<HomebrewEntry[] | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState<{ open: boolean; id: number | null; data: HomebrewInput }>({ open: false, id: null, data: emptyInput() });
    const [saving, setSaving] = useState(false);
    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

    const reload = () => HomebrewService.getAll().then(setEntries).catch(() => setEntries([]));
    useEffect(() => { reload(); }, []);

    const visible = useMemo(() => {
        const all = entries ?? [];
        const base = tab === 'mine'
            ? all.filter(e => e.authorId === myId)
            : all.filter(e => e.visibility === 'public' && e.authorId !== myId);
        return base
            .filter(e => cats ? cats.includes(e.category) : (!categoryFilter || e.category === categoryFilter))
            .filter(e => !search || (e.name + ' ' + (e.description ?? '')).toLowerCase().includes(search.toLowerCase()));
    }, [entries, tab, myId, cats, categoryFilter, search]);

    const openNew = () => setForm({ open: true, id: null, data: emptyInput() });
    const openEdit = (e: HomebrewEntry) => setForm({ open: true, id: e.id, data: { category: e.category, name: e.name, description: e.description ?? '', visibility: e.visibility, data: e.data ?? {} } });

    const handleSave = async () => {
        if (!form.data.name.trim()) return;
        setSaving(true);
        try {
            const payload: HomebrewInput = { ...form.data, data: pruneToSchema(form.data.category, form.data.data ?? {}) };
            if (form.id) await HomebrewService.update(form.id, payload);
            else await HomebrewService.create(payload);
            setForm({ open: false, id: null, data: emptyInput() });
            await reload();
        } finally { setSaving(false); }
    };

    const handleDelete = async (e: HomebrewEntry) => {
        if (!confirm(`Supprimer « ${e.name} » ?`)) return;
        await HomebrewService.remove(e.id);
        await reload();
    };

    const handleDuplicate = async (e: HomebrewEntry) => {
        setDuplicatingId(e.id);
        try {
            await HomebrewService.create({ category: e.category, name: `${e.name} (copie)`, description: e.description ?? '', visibility: 'private', data: e.data ?? {} });
            onTabChange('mine');
            await reload();
        } finally { setDuplicatingId(null); }
    };

    if (entries === null) return <Loader />;

    const createLabel = locked ? `Créer — ${categoryLabel(cats![0])}` : 'Nouveau';

    return (
        <div className="space-y-4">
            {/* Barre : recherche + créer */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="w-full bg-stone-900/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-stone-200 outline-none focus:border-primary-500 text-sm" />
                </div>
                {tab === 'mine' && (
                    <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"><Plus size={16} /> {createLabel}</button>
                )}
            </div>

            {/* Filtre catégorie (uniquement en mode « toutes catégories ») */}
            {!cats && (
                <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setCategoryFilter('')} className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border transition-all ${!categoryFilter ? 'bg-primary-500/20 text-primary-300 border-primary-500/40' : 'bg-stone-900/40 text-stone-500 border-white/5'}`}>Toutes</button>
                    {HOMEBREW_CATEGORIES.map(c => (
                        <button key={c.value} onClick={() => setCategoryFilter(c.value)} className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border transition-all ${categoryFilter === c.value ? 'bg-primary-500/20 text-primary-300 border-primary-500/40' : 'bg-stone-900/40 text-stone-500 border-white/5 hover:text-stone-300'}`}>{c.label}</button>
                    ))}
                </div>
            )}

            {visible.length === 0 ? (
                <div className="text-center py-16 text-stone-600">
                    <p className="text-sm">{tab === 'mine' ? "Vous n'avez pas encore créé de contenu ici." : "Aucun contenu partagé pour cette section."}</p>
                    {tab === 'mine' && <button onClick={openNew} className="text-primary-400 hover:text-primary-300 text-sm underline mt-2">Créer votre premier contenu</button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visible.map(e => (
                        <Card key={e.id} entry={e} mine={e.authorId === myId} duplicating={duplicatingId === e.id} showCategory={!locked} onOpen={() => navigate(`/homebrew/${e.id}`)} onEdit={() => openEdit(e)} onDelete={() => handleDelete(e)} onDuplicate={() => handleDuplicate(e)} />
                    ))}
                </div>
            )}

            {/* Modale création / édition */}
            {form.open && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setForm(f => ({ ...f, open: false }))}>
                    <div className="glass-panel rounded-2xl border border-primary-500/20 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={ev => ev.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-display font-bold text-stone-100">{form.id ? 'Modifier le contenu' : 'Nouveau contenu'}</h2>
                            <button onClick={() => setForm(f => ({ ...f, open: false }))} className="text-stone-500 hover:text-white"><X size={18} /></button>
                        </div>
                        {/* Sélecteur de catégorie : masqué si verrouillée ; limité aux catégories de la page sinon. */}
                        {!locked && (
                            <div>
                                <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Catégorie</label>
                                <select value={form.data.category} onChange={e => setForm(f => ({ ...f, data: { ...f.data, category: e.target.value } }))} className="w-full bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-primary-500">
                                    {catOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Nom</label>
                            <input value={form.data.name} onChange={e => setForm(f => ({ ...f, data: { ...f.data, name: e.target.value } }))} placeholder="Nom du contenu" autoFocus className="w-full bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Description {hasStructuredSchema(form.data.category) && <span className="text-stone-600 normal-case font-normal">(résumé court)</span>}</label>
                            <textarea value={form.data.description} onChange={e => setForm(f => ({ ...f, data: { ...f.data, description: e.target.value } }))} placeholder="Effet, règles, saveur…" className="w-full min-h-[90px] bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-primary-500 resize-y leading-relaxed" />
                        </div>

                        {hasStructuredSchema(form.data.category) && (
                            <div className="border-t border-white/5 pt-4">
                                <p className="text-[11px] uppercase font-bold tracking-wider text-primary-400/70 mb-3">Détails — {categoryLabel(form.data.category)}</p>
                                <HomebrewFields
                                    schema={HOMEBREW_SCHEMAS[form.data.category] ?? []}
                                    data={form.data.data ?? {}}
                                    onChange={d => setForm(f => ({ ...f, data: { ...f.data, data: d } }))}
                                />
                            </div>
                        )}

                        <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
                            <input type="checkbox" checked={form.data.visibility === 'public'} onChange={e => setForm(f => ({ ...f, data: { ...f.data, visibility: e.target.checked ? 'public' : 'private' } }))} className="accent-primary-500 w-4 h-4" />
                            <Globe size={14} className="text-green-500/70" /> Partager à la communauté (public)
                        </label>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setForm(f => ({ ...f, open: false }))} className="px-4 py-2 text-sm font-bold text-stone-400 hover:text-white">Annuler</button>
                            <button onClick={handleSave} disabled={saving || !form.data.name.trim()} className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
