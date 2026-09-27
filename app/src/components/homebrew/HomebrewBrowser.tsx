import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Loader, SearchToolbar, SelectFiltre, GrilleFiltres, FilterPanel } from '../common';
import { useAuth } from '../../hooks/useAuth';
import { HomebrewService, HOMEBREW_CATEGORIES, categoryLabel, messageSuppression, type HomebrewEntry } from '../../services/homebrewService';
import { duplicateEntry, resumeDuplication } from '../../services/homebrewChildren';
import { HomebrewList } from './HomebrewList';
import { FILTRES_COMMUNAUTAIRES, PASTILLES_COMMUNAUTAIRES, appliquerFiltres } from '../../domain/filtresCompendium';
import { sousTypeEquipement } from '../../domain/tablesCompendium';
import { invitRecherche, compteurDuType } from '../../domain/compendium';

type Tab = 'mine' | 'community';

// Taille de page côté serveur : au-delà, « Charger plus » plutôt que de tout charger d'un
// coup (cf. l'état des lieux communauté — `pagination=false` chargeait toute la table).
const ITEMS_PER_PAGE = 24;
// Attend une pause dans la frappe avant d'interroger le serveur : la recherche était
// jusqu'ici instantanée (filtrage local sur des données déjà en mémoire) — une recherche
// réseau à chaque frappe ajouterait une requête par lettre tapée.
const DEBOUNCE_MS = 300;

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
 *
 * Onglet, catégorie et recherche texte sont filtrés CÔTÉ SERVEUR (paginés) : ce sont les
 * axes qui comptent le plus de valeurs possibles et ceux qui justifiaient `pagination=false`
 * (toute la table à chaque ouverture). Le sous-type d'équipement, les pastilles et la grille
 * de filtres par catégorie restent côté client — ils lisent le champ JSON libre `data`,
 * différent par catégorie, que Doctrine ne sait pas interroger proprement sans requête SQL
 * native par catégorie ; ils ne s'appliquent donc qu'à la page déjà chargée, pas à toute la
 * catégorie. Compromis accepté tant que leur usage reste marginal.
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

    const [entries, setEntries] = useState<HomebrewEntry[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState(''); // valeur débouncée, réellement envoyée au serveur
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

    // Débounce : la recherche n'interroge le serveur qu'après une pause dans la frappe.
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [searchInput]);

    const categoryParam = cats ?? (categoryFilter || undefined);

    const fetchPage = async (targetPage: number, replace: boolean) => {
        if (replace) setLoading(true); else setLoadingMore(true);
        try {
            const { items, totalItems: total } = await HomebrewService.getPage({
                page: targetPage,
                itemsPerPage: ITEMS_PER_PAGE,
                scope: tab,
                category: categoryParam,
                search: search || undefined,
            });
            setEntries(prev => (replace ? items : [...prev, ...items]));
            setTotalItems(total);
            setPage(targetPage);
        } catch {
            if (replace) { setEntries([]); setTotalItems(0); }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Repart de la page 1 à chaque changement d'onglet/catégorie/recherche — jamais un
    // simple ajout, sous peine de mélanger des résultats de filtres différents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchPage(1, true); }, [tab, categoryParam, search]);

    const reload = () => fetchPage(1, true);
    const loadMore = () => fetchPage(page + 1, false);

    const visible = useMemo(() => {
        // Onglet/catégorie/recherche sont déjà appliqués côté serveur (cf. `fetchPage`) :
        // `entries` est déjà la bonne page. Restent les filtres dérivés du JSON `data`,
        // qui ne s'appliquent qu'à cette page (cf. le commentaire du composant).
        const retenues = entries.filter(e => !estEquipement || sousTypeEquipement(e.data ?? {}) === sousType);
        const parPastille = pastilles && pastilleActive !== 'all'
            ? retenues.filter(e => pastilles.lit((e.data ?? {})[pastilles.key]) === pastilleActive)
            : retenues;
        return appliquerFiltres(parPastille, filtres, choixFiltres);
    }, [entries, estEquipement, sousType, filtres, choixFiltres, pastilles, pastilleActive]);

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
        // Résolues côté serveur par IRI parent : une fois la bibliothèque paginée, rien ne
        // garantit que les capacités d'une voie soient sur la page déjà chargée.
        const enfants = await HomebrewService.getChildrenOf(e.id);
        if (!confirm(messageSuppression(e.name, enfants.length))) return;
        await HomebrewService.remove(e.id);
        await reload();
    };

    const handleDuplicate = async (e: HomebrewEntry) => {
        setDuplicatingId(e.id);
        try {
            const enfants = await HomebrewService.getChildrenOf(e.id);
            const { copiees, echecs } = await duplicateEntry(e, enfants);
            const avertissement = resumeDuplication(copiees, echecs);
            if (avertissement) alert(avertissement);
            onTabChange('mine');
            await reload();
        } finally { setDuplicatingId(null); }
    };

    if (loading) return <Loader />;

    const createLabel = locked ? `Créer — ${categoryLabel(cats![0])}` : 'Nouveau';

    return (
        <div className="space-y-4">
            {/* Même barre que les pages officielles : recherche, pastilles de sous-type,
                action principale et compte de résultats font corps. */}
            <SearchToolbar
                value={searchInput}
                onChange={setSearchInput}
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
                <>
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
                    {entries.length < totalItems && (
                        <div className="text-center pt-4">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="text-primary-400 hover:text-primary-300 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
                            >
                                {loadingMore ? 'Chargement…' : `Charger plus (${entries.length}/${totalItems})`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
