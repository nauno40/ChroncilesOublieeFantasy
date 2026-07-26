import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Globe, Lock, Edit, Trash2, X, User as UserIcon, Copy } from 'lucide-react';
import { PageContainer, PageHeader, Loader } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { HomebrewService, HOMEBREW_CATEGORIES, categoryLabel, type HomebrewEntry, type HomebrewInput } from '../services/homebrewService';

type Tab = 'mine' | 'community';
const EMPTY: HomebrewInput = { category: 'sort', name: '', description: '', visibility: 'private' };

// --- Sous-composants (niveau module) ---

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => (
    <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400/80 border border-primary-500/30 rounded px-1.5 py-0.5">{categoryLabel(category)}</span>
);

const Card: React.FC<{ entry: HomebrewEntry; mine: boolean; duplicating: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void; onDuplicate: () => void }> = ({ entry, mine, duplicating, onOpen, onEdit, onDelete, onDuplicate }) => (
    <div className="glass-panel rounded-2xl border border-white/5 hover:border-primary-500/30 transition-all flex flex-col overflow-hidden group">
        <button onClick={onOpen} className="text-left p-5 flex-1">
            <div className="flex items-center justify-between gap-2 mb-2">
                <CategoryBadge category={entry.category} />
                {entry.visibility === 'public'
                    ? <Globe size={13} className="text-green-500/70" aria-label="Public" />
                    : <Lock size={13} className="text-stone-600" aria-label="Privé" />}
            </div>
            <h3 className="font-display font-bold text-stone-100 group-hover:text-primary-300 leading-tight">{entry.name}</h3>
            {entry.description && <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-snug">{entry.description}</p>}
            {!mine && <p className="text-[10px] text-stone-600 mt-2 flex items-center gap-1"><UserIcon size={10} /> {entry.authorPseudo || 'Anonyme'}</p>}
        </button>
        {mine ? (
            <div className="flex border-t border-white/5">
                <button onClick={onEdit} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all"><Edit size={12} /> Modifier</button>
                <button onClick={onDelete} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-red-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5"><Trash2 size={12} /> Supprimer</button>
            </div>
        ) : (
            <div className="flex border-t border-white/5">
                <button onClick={onDuplicate} disabled={duplicating} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-500 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"><Copy size={12} /> {duplicating ? 'Copie…' : 'Dupliquer chez moi'}</button>
            </div>
        )}
    </div>
);

export const Bibliotheque: React.FC = () => {
    const { user } = useAuth();
    const myId = user?.id;
    const [entries, setEntries] = useState<HomebrewEntry[] | null>(null);
    const [tab, setTab] = useState<Tab>('mine');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState<{ open: boolean; id: number | null; data: HomebrewInput }>({ open: false, id: null, data: EMPTY });
    const [detail, setDetail] = useState<HomebrewEntry | null>(null);
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
            .filter(e => !categoryFilter || e.category === categoryFilter)
            .filter(e => !search || (e.name + ' ' + (e.description ?? '')).toLowerCase().includes(search.toLowerCase()));
    }, [entries, tab, myId, categoryFilter, search]);

    const openNew = () => setForm({ open: true, id: null, data: EMPTY });
    const openEdit = (e: HomebrewEntry) => setForm({ open: true, id: e.id, data: { category: e.category, name: e.name, description: e.description ?? '', visibility: e.visibility } });

    const handleSave = async () => {
        if (!form.data.name.trim()) return;
        setSaving(true);
        try {
            if (form.id) await HomebrewService.update(form.id, form.data);
            else await HomebrewService.create(form.data);
            setForm({ open: false, id: null, data: EMPTY });
            await reload();
        } finally { setSaving(false); }
    };

    const handleDelete = async (e: HomebrewEntry) => {
        if (!confirm(`Supprimer « ${e.name} » ?`)) return;
        await HomebrewService.remove(e.id);
        await reload();
    };

    // Recopie une entrée publique d'autrui dans mon contenu (privé), pour la retravailler.
    const handleDuplicate = async (e: HomebrewEntry) => {
        setDuplicatingId(e.id);
        try {
            await HomebrewService.create({ category: e.category, name: `${e.name} (copie)`, description: e.description ?? '', visibility: 'private' });
            setTab('mine');
            await reload();
        } finally { setDuplicatingId(null); }
    };

    if (entries === null) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader
                title="Bibliothèque"
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Rechercher dans la bibliothèque..."
                subtitle="Créez vos contenus (sorts, races, objets…) et partagez-les à la communauté"
                actions={<button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all"><Plus size={16} /> Nouveau</button>}
            />

            {/* Onglets */}
            <div className="flex gap-2 mb-4">
                {(['mine', 'community'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40' : 'bg-stone-900/40 text-stone-500 border border-white/5 hover:text-stone-300'}`}>
                        {t === 'mine' ? 'Mon contenu' : 'Communauté'}
                    </button>
                ))}
            </div>

            {/* Filtre catégorie */}
            <div className="flex flex-wrap gap-1.5 mb-5">
                <button onClick={() => setCategoryFilter('')} className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border transition-all ${!categoryFilter ? 'bg-primary-500/20 text-primary-300 border-primary-500/40' : 'bg-stone-900/40 text-stone-500 border-white/5'}`}>Toutes</button>
                {HOMEBREW_CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setCategoryFilter(c.value)} className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded-full border transition-all ${categoryFilter === c.value ? 'bg-primary-500/20 text-primary-300 border-primary-500/40' : 'bg-stone-900/40 text-stone-500 border-white/5 hover:text-stone-300'}`}>{c.label}</button>
                ))}
            </div>

            {visible.length === 0 ? (
                <div className="text-center py-16 text-stone-600">
                    <p className="text-sm">{tab === 'mine' ? "Vous n'avez pas encore créé de contenu." : "Aucun contenu partagé pour cette catégorie."}</p>
                    {tab === 'mine' && <button onClick={openNew} className="text-primary-400 hover:text-primary-300 text-sm underline mt-2">Créer votre premier contenu</button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visible.map(e => (
                        <Card key={e.id} entry={e} mine={e.authorId === myId} duplicating={duplicatingId === e.id} onOpen={() => setDetail(e)} onEdit={() => openEdit(e)} onDelete={() => handleDelete(e)} onDuplicate={() => handleDuplicate(e)} />
                    ))}
                </div>
            )}

            {/* Modale création / édition */}
            {form.open && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setForm(f => ({ ...f, open: false }))}>
                    <div className="glass-panel rounded-2xl border border-primary-500/20 w-full max-w-lg p-6 space-y-4" onClick={ev => ev.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-display font-bold text-stone-100">{form.id ? 'Modifier le contenu' : 'Nouveau contenu'}</h2>
                            <button onClick={() => setForm(f => ({ ...f, open: false }))} className="text-stone-500 hover:text-white"><X size={18} /></button>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Catégorie</label>
                            <select value={form.data.category} onChange={e => setForm(f => ({ ...f, data: { ...f.data, category: e.target.value } }))} className="w-full bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-primary-500">
                                {HOMEBREW_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Nom</label>
                            <input value={form.data.name} onChange={e => setForm(f => ({ ...f, data: { ...f.data, name: e.target.value } }))} placeholder="Nom du contenu" autoFocus className="w-full bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-primary-500" />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Description</label>
                            <textarea value={form.data.description} onChange={e => setForm(f => ({ ...f, data: { ...f.data, description: e.target.value } }))} placeholder="Effet, règles, saveur…" className="w-full min-h-[140px] bg-stone-950 border border-white/10 rounded-lg px-3 py-2 text-stone-200 outline-none focus:border-primary-500 resize-y leading-relaxed" />
                        </div>
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

            {/* Modale détail */}
            {detail && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetail(null)}>
                    <div className="glass-panel rounded-2xl border border-primary-500/20 w-full max-w-xl p-6 max-h-[85vh] overflow-y-auto" onClick={ev => ev.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                                <CategoryBadge category={detail.category} />
                                <h2 className="text-2xl font-display font-bold text-stone-100 mt-2">{detail.name}</h2>
                                <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-1">
                                    <UserIcon size={11} /> {detail.authorPseudo || 'Anonyme'}
                                    {detail.visibility === 'public' ? <><Globe size={11} className="text-green-500/70 ml-2" /> Public</> : <><Lock size={11} className="ml-2" /> Privé</>}
                                </p>
                            </div>
                            <button onClick={() => setDetail(null)} className="text-stone-500 hover:text-white flex-none"><X size={20} /></button>
                        </div>
                        {detail.description
                            ? <p className="text-stone-300 leading-relaxed whitespace-pre-line mt-3">{detail.description}</p>
                            : <p className="text-stone-600 italic mt-3">Aucune description.</p>}
                    </div>
                </div>
            )}
        </PageContainer>
    );
};
