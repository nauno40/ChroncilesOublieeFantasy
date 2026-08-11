import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Loader, SearchToolbar, SelectFiltre, GrilleFiltres, FilterPanel } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { HomebrewService, HOMEBREW_CATEGORIES, categoryLabel, childrenOf, messageSuppression, type HomebrewEntry } from '../../services/homebrewService';
import { duplicateEntry, resumeDuplication } from '../../services/homebrewChildren';
import { HomebrewList } from './HomebrewList';
import { FILTRES_COMMUNAUTAIRES, PASTILLES_COMMUNAUTAIRES, appliquerFiltres } from '../../domain/filtresCompendium';
import { sousTypeEquipement } from '../../domain/tablesCompendium';
import { invitRecherche, compteurDuType } from '../../domain/compendium';

type Tab = 'mine' | 'community';

/** Filtre par catégorie de la Bibliothèque (mode « toutes catégories »). Il vivait dans
 *  sa propre rangée de pastilles sous la barre : même intention, même barre. */
const CHIPS_CATEGORIES = [
    { id: '', label: 'Toutes' },
    ...HOMEBREW_CATEGORIES.map(c => ({ id: c.value, label: c.label })),
];

/** Mêmes sous-types que la page officielle de l'équipement, mêmes intitulés. */
const CHIPS_EQUIPEMENT = [
    { id: 'arme', label: 'Armes' },
    { id: 'armure', label: 'Armures' },
    { id: 'materiel', label: 'Matériel' },
];

interface HomebrewBrowserProps {
    tab: Tab;
    onTabChange: (t: Tab) => void;
    /**
     * Catégorie(s) de la page de type. Une seule string → catégorie verrouillée (sélecteur/chips/badge
     * masqués). Un tableau → sélecteur limité à ces catégories (ex. Capacités & Sorts). Absent → toutes.
     */
    category?: string | string[];
    /**
     * Intitulé du lien de retour posé sur la fiche ouverte depuis cette liste. Absent, la
     * fiche retombe sur la page de type de sa catégorie — ce que fait déjà le compendium,
     * d'où sa liste sans intitulé. La Bibliothèque, elle, n'est la page de type d'aucune
     * catégorie : sans cet intitulé, en revenir renverrait ailleurs.
     */
    retourLabel?: string;
}

/**
 * Cœur réutilisable de la Bibliothèque : liste + création/édition/détail/duplication du
 * contenu homebrew. Utilisé tel quel par la Bibliothèque (toutes catégories) et par les
 * pages de type du compendium (catégorie verrouillée), sous l'onglet Communauté/Mes créations.
 */
export const HomebrewBrowser: React.FC<HomebrewBrowserProps> = ({ tab, onTabChange, category, retourLabel }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const myId = user?.id;
    // Catégories de la page : null = toutes ; 1 = verrouillée ; >1 = choix limité.
    // Mémoïsé : recréé à chaque rendu, ce tableau annulait la mémoïsation de `visible`.
    const cats = useMemo<string[] | null>(
        () => (category ? (Array.isArray(category) ? category : [category]) : null),
        [category],
    );
    const locked = cats?.length === 1;                 // sélecteur/chips/badge masqués

    const [entries, setEntries] = useState<HomebrewEntry[] | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [search, setSearch] = useState('');
    // Sous-type d'équipement affiché : la page officielle range armes, armures et matériel
    // sous trois pastilles, avec trois jeux de colonnes. La liste communautaire les reprend
    // — sans quoi une arme et une potion se retrouvaient dans la même table.
    const [sousType, setSousType] = useState<'arme' | 'armure' | 'materiel'>('arme');
    const estEquipement = locked && cats![0] === 'equipement';
    // Filtres du type courant : les mêmes axes que la page officielle, quand la donnée
    // communautaire les porte.
    const typePage = cats?.[0];
    // Mémoïsé : recréé à chaque rendu, ce tableau annulait la mémoïsation de `visible`.
    const filtres = useMemo(() => (typePage ? FILTRES_COMMUNAUTAIRES[typePage] ?? [] : []), [typePage]);
    const [choixFiltres, setChoixFiltres] = useState<Record<string, string>>({});
    // Pastilles de sous-type, quand la page officielle en porte (les voies).
    const pastilles = typePage ? PASTILLES_COMMUNAUTAIRES[typePage] : undefined;
    const [pastilleActive, setPastilleActive] = useState('all');
    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

    const reload = () => HomebrewService.getAll().then(setEntries).catch(() => setEntries([]));
    useEffect(() => { reload(); }, []);

    const visible = useMemo(() => {
        const all = entries ?? [];
        const base = tab === 'mine'
            ? all.filter(e => e.authorId === myId)
            : all.filter(e => e.visibility === 'public' && e.authorId !== myId);
        const retenues = base
            .filter(e => cats ? cats.includes(e.category) : (!categoryFilter || e.category === categoryFilter))
            .filter(e => !search || (e.name + ' ' + (e.description ?? '')).toLowerCase().includes(search.toLowerCase()))
            .filter(e => !estEquipement || sousTypeEquipement(e.data ?? {}) === sousType);
        const parPastille = pastilles && pastilleActive !== 'all'
            ? retenues.filter(e => pastilles.lit((e.data ?? {})[pastilles.key]) === pastilleActive)
            : retenues;
        return appliquerFiltres(parPastille, filtres, choixFiltres);
    }, [entries, tab, myId, cats, categoryFilter, search, estEquipement, sousType, filtres, choixFiltres, pastilles, pastilleActive]);

    // La création/édition se fait désormais sur une page dédiée (HomebrewForm) — plus
    // adaptée au mobile qu'une modale — avec retour vers la page courante après coup.
    // Catégories réellement proposables depuis ce contexte : celles de la page, ou
    // toutes si aucune restriction (cas de la Bibliothèque). Transmises à la page via
    // `cats` dès qu'il y en a plus d'une, pour qu'elle affiche un sélecteur — omis
    // quand la catégorie est verrouillée sur une seule (comportement inchangé).
    const openableCats = cats ?? HOMEBREW_CATEGORIES.map(c => c.value);
    const openNew = () => {
        const params = new URLSearchParams({ retour: location.pathname });
        if (openableCats.length > 1) params.set('cats', openableCats.join(','));
        navigate(`/bibliotheque/nouveau/${openableCats[0]}?${params.toString()}`);
    };
    const openEdit = (e: HomebrewEntry) => navigate(`/bibliotheque/${e.id}/modifier?retour=${encodeURIComponent(location.pathname)}`);

    const handleDelete = async (e: HomebrewEntry) => {
        // `entries` porte déjà toutes les entrées visibles : compter les capacités
        // emportées par la cascade ne coûte aucun appel supplémentaire.
        const enfants = childrenOf(e.id, entries ?? []);
        if (!confirm(messageSuppression(e.name, enfants.length))) return;
        await HomebrewService.remove(e.id);
        await reload();
    };

    const handleDuplicate = async (e: HomebrewEntry) => {
        setDuplicatingId(e.id);
        try {
            // Les capacités d'une voie suivent la copie (`entries` les porte déjà).
            const { copiees, echecs } = await duplicateEntry(e, childrenOf(e.id, entries ?? []));
            const avertissement = resumeDuplication(copiees, echecs);
            if (avertissement) alert(avertissement);
            onTabChange('mine');
            await reload();
        } finally { setDuplicatingId(null); }
    };

    if (entries === null) return <Loader />;

    const createLabel = locked ? `Créer — ${categoryLabel(cats![0])}` : 'Nouveau';

    return (
        <div className="space-y-4">
            {/* Même barre que les pages officielles : recherche, pastilles de sous-type,
                action principale et compte de résultats font corps. */}
            <SearchToolbar
                value={search}
                onChange={setSearch}
                placeholder={estEquipement ? invitRecherche(sousType) : typePage ? invitRecherche(typePage) : 'Rechercher…'}
                chips={estEquipement ? CHIPS_EQUIPEMENT : pastilles ? pastilles.options : !cats ? CHIPS_CATEGORIES : undefined}
                chipActif={estEquipement ? sousType : pastilles ? pastilleActive : categoryFilter}
                onChipChange={id => (estEquipement
                    ? setSousType(id as 'arme' | 'armure' | 'materiel')
                    : pastilles ? setPastilleActive(id)
                        : setCategoryFilter(id))}
                count={{
                    n: visible.length,
                    ...((estEquipement ? compteurDuType(sousType) : typePage ? compteurDuType(typePage) : undefined)
                        ?? { singulier: 'résultat' }),
                }}
                filters={filtres.length > 0 && (
                    <FilterPanel
                        hasActiveFilters={Object.values(choixFiltres).some(v => v && v !== 'all')}
                        onClearFilters={() => setChoixFiltres({})}
                    >
                        <GrilleFiltres>
                            {filtres.map(f => (
                                <SelectFiltre
                                    key={f.key}
                                    label={f.label}
                                    toutLabel={f.toutLabel}
                                    options={f.options}
                                    value={choixFiltres[f.key] ?? 'all'}
                                    onChange={v => setChoixFiltres(c => ({ ...c, [f.key]: v }))}
                                />
                            ))}
                        </GrilleFiltres>
                    </FilterPanel>
                )}
                action={tab === 'mine' && (
                    <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm px-4 py-3 rounded-xl transition-all whitespace-nowrap"><Plus size={16} /> {createLabel}</button>
                )}
            />

            {visible.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                    <p className="text-sm">{tab === 'mine' ? "Vous n'avez pas encore créé de contenu ici." : "Aucun contenu partagé pour cette section."}</p>
                    {tab === 'mine' && <button onClick={openNew} className="text-primary-400 hover:text-primary-300 text-sm underline mt-2">Créer votre premier contenu</button>}
                </div>
            ) : (
                <HomebrewList
                    entries={visible}
                    category={category}
                    myId={myId}
                    duplicatingId={duplicatingId}
                    onOpen={e => navigate(`/homebrew/${e.id}`, {
                        state: retourLabel ? { retour: location.pathname + location.search, retourLabel } : undefined,
                    })}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    sousType={estEquipement ? sousType : undefined}
                />
            )}
        </div>
    );
};
