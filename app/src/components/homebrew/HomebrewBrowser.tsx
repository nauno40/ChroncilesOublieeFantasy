import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Loader, SearchBar } from '../common';
import { useAuth } from '../../context/AuthContext';
import { HomebrewService, HOMEBREW_CATEGORIES, categoryLabel, type HomebrewEntry } from '../../services/homebrewService';
import { HomebrewList } from './HomebrewList';

type Tab = 'mine' | 'community';

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
    const location = useLocation();
    const myId = user?.id;
    // Catégories de la page : null = toutes ; 1 = verrouillée ; >1 = choix limité.
    const cats: string[] | null = category ? (Array.isArray(category) ? category : [category]) : null;
    const locked = cats?.length === 1;                 // sélecteur/chips/badge masqués

    const [entries, setEntries] = useState<HomebrewEntry[] | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [search, setSearch] = useState('');
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

    // La création/édition se fait désormais sur une page dédiée (HomebrewForm) — plus
    // adaptée au mobile qu'une modale — avec retour vers la page courante après coup.
    const openNew = () => navigate(`/bibliotheque/nouveau/${cats ? cats[0] : 'sort'}?retour=${encodeURIComponent(location.pathname)}`);
    const openEdit = (e: HomebrewEntry) => navigate(`/bibliotheque/${e.id}/modifier?retour=${encodeURIComponent(location.pathname)}`);

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
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Rechercher…"
                    className="flex-1 min-w-[200px]"
                />
                {tab === 'mine' && (
                    <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm px-4 py-3 rounded-xl transition-all whitespace-nowrap"><Plus size={16} /> {createLabel}</button>
                )}
            </div>

            <p className="text-stone-400 text-sm">
                {visible.length} résultat{visible.length > 1 ? 's' : ''}
            </p>

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
                <HomebrewList
                    entries={visible}
                    category={category}
                    myId={myId}
                    duplicatingId={duplicatingId}
                    onOpen={e => navigate(`/homebrew/${e.id}`)}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                />
            )}
        </div>
    );
};
