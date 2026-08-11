import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Skull, Plus, Trash2, Pencil, Save, X, Swords, Sparkles, Globe, Lock, Copy } from 'lucide-react';
import { PageContainer, PageHeader, EmptyState, AuthorTag, SearchToolbar, FilterPanel, SelectFiltre, GrilleFiltres } from '../components/common';
import { CreatureCard } from '../components/creature/CreatureCard';
import { carteDepuisMonstreMaison } from '../domain/creature';
import { getMonsters, createMonster, updateMonster, deleteMonster } from '../services/monsterService';
import { DataService } from '../services/dataService';
import { useAuth } from '../hooks/useAuth';
import type { CustomCreature, CustomCreatureAttack, CustomCreatureCapability, Creature } from '../types';
import { LEXIQUE } from '../domain/lexique';

/** Sources, quand la page est ouverte seule (hors compendium unifié). */
const ONGLETS = [
    { id: 'mine', label: LEXIQUE.sourceMiennes },
    { id: 'community', label: LEXIQUE.sourceCommunaute },
];

const inputClass =
    'w-full bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500';
const labelClass = 'block text-sm font-medium text-stone-300 mb-1';

// Identifiants des <datalist> (suggestions « ce qui existe déjà » : SRD + monstres du MJ).
const LIST = {
    category: 'cm-categories',
    environment: 'cm-environments',
    archetype: 'cm-archetypes',
    size: 'cm-sizes',
    attack: 'cm-attack-names',
    capability: 'cm-capability-names',
} as const;

// Valeurs distinctes, non vides, triées (casse-insensible, locale FR).
const distinctSorted = (values: (string | null | undefined)[]): string[] =>
    Array.from(new Set(values.map((v) => (v ?? '').trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'fr', { sensitivity: 'base' }),
    );

// Caractéristiques COF2 (7), dans l'ordre du profil de créature du livre.
const STAT_KEYS = ['AGI', 'CON', 'FOR', 'PER', 'CHA', 'INT', 'VOL'] as const;
type StatKey = (typeof STAT_KEYS)[number];
type Stats = Record<StatKey, number>;

interface MonsterForm {
    id?: number;
    name: string;
    description: string;
    nc: number;
    hp: number;
    def: number;
    init: number;
    stats: Stats;
    statsSuperior: StatKey[];
    attacks: CustomCreatureAttack[];
    capabilities: CustomCreatureCapability[];
    specialAbilitiesText: string;
    picture: string;
    category: string;
    environment: string;
    archetype: string;
    size: string;
    visibility: 'private' | 'public';
}

// Échelle COF2 : les caractéristiques sont des valeurs (0 = moyen), pas des scores 3‑18.
const emptyStats = (): Stats => ({ AGI: 0, CON: 0, FOR: 0, PER: 0, CHA: 0, INT: 0, VOL: 0 });

const emptyForm = (): MonsterForm => ({
    name: '',
    description: '',
    nc: 1,
    hp: 10,
    def: 12,
    init: 10,
    stats: emptyStats(),
    statsSuperior: [],
    attacks: [],
    capabilities: [],
    specialAbilitiesText: '',
    picture: '',
    category: '',
    environment: '',
    archetype: '',
    size: '',
    visibility: 'private',
});

const toForm = (c: CustomCreature): MonsterForm => ({
    id: c.id,
    name: c.name ?? '',
    description: c.description ?? '',
    nc: c.nc ?? 1,
    hp: c.hp ?? 10,
    def: c.def ?? 12,
    init: c.init ?? 10,
    stats: { ...emptyStats(), ...(c.stats ?? {}) },
    statsSuperior: (c.statsSuperior ?? []) as StatKey[],
    attacks: c.attacks ? c.attacks.map((a) => ({ ...a })) : [],
    capabilities: c.capabilities ? c.capabilities.map((cap) => ({ ...cap })) : [],
    specialAbilitiesText: c.specialAbilities?.text ?? '',
    picture: c.picture ?? '',
    category: c.category ?? '',
    environment: c.environment ?? '',
    archetype: c.archetype ?? '',
    size: c.size ?? '',
    visibility: c.visibility ?? 'private',
});

const toPayload = (form: MonsterForm): Partial<CustomCreature> => ({
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    nc: form.nc,
    hp: form.hp,
    def: form.def,
    init: form.init,
    stats: form.stats,
    statsSuperior: form.statsSuperior.length ? form.statsSuperior : undefined,
    specialAbilities: { text: form.specialAbilitiesText.trim() },
    // On ne conserve que les lignes nommées.
    attacks: form.attacks.filter((a) => a.name.trim() !== ''),
    // Un monstre maison se saisit par `name` ; `label` reste la forme du bestiaire.
    capabilities: form.capabilities.filter((cap) => (cap.name ?? '').trim() !== ''),
    picture: form.picture.trim() || undefined,
    category: form.category.trim() || undefined,
    environment: form.environment.trim() || undefined,
    archetype: form.archetype.trim() || undefined,
    size: form.size.trim() || undefined,
    visibility: form.visibility,
});

interface CustomMonstersProps {
    /** Encapsulé dans la page Créatures : masque l'en-tête et la barre d'onglets internes. */
    embedded?: boolean;
    /** Onglet piloté de l'extérieur (source du parent). */
    tab?: 'mine' | 'community';
    onTabChange?: (t: 'mine' | 'community') => void;
}

export const CustomMonsters: React.FC<CustomMonstersProps> = ({ embedded = false, tab: extTab, onTabChange }) => {
    const { user } = useAuth();
    const myId = user?.id;
    const [internalTab, setInternalTab] = useState<'mine' | 'community'>('mine');
    const tab = extTab ?? internalTab;
    const setTab = onTabChange ?? setInternalTab;
    const [monsters, setMonsters] = useState<CustomCreature[]>([]);
    const [srdCreatures, setSrdCreatures] = useState<Creature[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<MonsterForm | null>(null);
    const [saving, setSaving] = useState(false);
    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
    const [recherche, setRecherche] = useState('');
    // Mêmes axes de filtrage que le bestiaire officiel, sur les champs que la créature
    // maison porte déjà. La liste n'en offrait aucun.
    const [filtreCategorie, setFiltreCategorie] = useState('all');
    const [filtreMilieu, setFiltreMilieu] = useState('all');
    const [filtreTaille, setFiltreTaille] = useState('all');
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        getMonsters()
            .then(setMonsters)
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    // Bestiaire SRD : alimente les suggestions des <datalist> (chargé une fois).
    useEffect(() => {
        DataService.getCreatures().then(setSrdCreatures).catch(() => setSrdCreatures([]));
    }, []);

    // Valeurs « qui existent déjà » = union du SRD et des monstres du MJ.
    const suggestions = useMemo(() => {
        const both = [...srdCreatures, ...monsters];
        return {
            category: distinctSorted(both.map((c) => c.category)),
            environment: distinctSorted(both.map((c) => c.environment)),
            archetype: distinctSorted(both.map((c) => c.archetype)),
            size: distinctSorted(both.map((c) => c.size)),
            // Les créatures SRD nomment l'attaque via `name` et la capacité via `label`
            // (les monstres custom utilisent `name` pour les deux).
            attack: distinctSorted(
                both.flatMap((c) => (c.attacks ?? []).map((a) => a?.name)),
            ),
            capability: distinctSorted(
                both.flatMap((c) => (c.capabilities ?? []).map((cap) => cap?.name ?? cap?.label)),
            ),
        };
    }, [srdCreatures, monsters]);

    // Onglet « Mes créations » = mes créatures ; « Communauté » = les publiques d'autrui.
    // La recherche par nom existait côté bestiaire officiel et nulle part ici : une fois
    // passé quelques créatures, la liste ne se parcourait plus qu'à l'œil.
    const visible = useMemo(() => {
        const base = tab === 'mine'
            ? monsters.filter((c) => c.authorId === myId)
            : monsters.filter((c) => c.visibility === 'public' && c.authorId !== myId);
        const terme = recherche.trim().toLowerCase();
        const parTexte = terme
            ? base.filter((c) => (c.name + ' ' + (c.description ?? '') + ' ' + (c.category ?? '')).toLowerCase().includes(terme))
            : base;
        const correspond = (valeur: string | undefined, choix: string) => choix === 'all' || (valeur ?? '') === choix;
        return parTexte.filter((c) =>
            correspond(c.category, filtreCategorie)
            && correspond(c.environment, filtreMilieu)
            && correspond(c.size, filtreTaille));
    }, [monsters, tab, myId, recherche, filtreCategorie, filtreMilieu, filtreTaille]);

    const startCreate = () => {
        setError(null);
        setForm(emptyForm());
    };

    const startEdit = (c: CustomCreature) => {
        setError(null);
        setForm(toForm(c));
    };

    const cancel = () => {
        setForm(null);
        setError(null);
    };

    // « Modifier » depuis la fiche d'une créature maison : le formulaire vit ici, la fiche
    // désigne donc la créature à ouvrir. Sans ce relais, le bouton ramenait à une liste où
    // il fallait retrouver la créature à la main.
    const aEditer = (location.state as { editerId?: number } | null)?.editerId;
    useEffect(() => {
        if (!aEditer || form) return;
        const cible = monsters.find((c) => c.id === aEditer);
        if (cible) startEdit(cible);
    }, [aEditer, monsters, form]);

    const patch = (changes: Partial<MonsterForm>) => setForm((f) => (f ? { ...f, ...changes } : f));

    const setStat = (key: StatKey, value: number) =>
        setForm((f) => (f ? { ...f, stats: { ...f.stats, [key]: value } } : f));

    // L'astérisque du livre : un dé bonus à tous les tests de cette caractéristique. Les
    // créatures officielles en portent ; une créature maison doit pouvoir en porter aussi.
    const toggleSuperior = (key: StatKey) =>
        setForm((f) => (f ? {
            ...f,
            statsSuperior: f.statsSuperior.includes(key)
                ? f.statsSuperior.filter((k) => k !== key)
                : [...f.statsSuperior, key],
        } : f));

    // Éditeurs de lignes répétables (attaques / capacités)
    const addAttack = () => setForm((f) => (f ? { ...f, attacks: [...f.attacks, { name: '' }] } : f));
    const updateAttack = (i: number, changes: Partial<CustomCreatureAttack>) =>
        setForm((f) => (f ? { ...f, attacks: f.attacks.map((a, idx) => (idx === i ? { ...a, ...changes } : a)) } : f));
    const removeAttack = (i: number) =>
        setForm((f) => (f ? { ...f, attacks: f.attacks.filter((_, idx) => idx !== i) } : f));

    const addCapability = () => setForm((f) => (f ? { ...f, capabilities: [...f.capabilities, { name: '' }] } : f));
    const updateCapability = (i: number, changes: Partial<CustomCreatureCapability>) =>
        setForm((f) =>
            f ? { ...f, capabilities: f.capabilities.map((c, idx) => (idx === i ? { ...c, ...changes } : c)) } : f,
        );
    const removeCapability = (i: number) =>
        setForm((f) => (f ? { ...f, capabilities: f.capabilities.filter((_, idx) => idx !== i) } : f));

    const handleSave = async () => {
        if (!form || !form.name.trim()) {
            setError('Le nom est obligatoire.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const payload = toPayload(form);
            if (form.id) {
                await updateMonster(form.id, payload);
            } else {
                await createMonster(payload);
            }
            setForm(null);
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (c: CustomCreature) => {
        if (!window.confirm(`Supprimer « ${c.name} » ?`)) return;
        try {
            await deleteMonster(c.id);
            if (form?.id === c.id) setForm(null);
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Suppression impossible.');
        }
    };

    // Recopie un monstre public d'autrui dans mon contenu (privé) pour pouvoir l'utiliser/éditer.
    const handleDuplicate = async (c: CustomCreature) => {
        setError(null);
        setDuplicatingId(c.id);
        try {
            await createMonster({ ...c, name: `${c.name} (copie)`, visibility: 'private' });
            setTab('mine');
            load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Duplication impossible.');
        } finally {
            setDuplicatingId(null);
        }
    };

    return (
        <PageContainer>
            {!embedded && (
                <PageHeader
                    title={LEXIQUE.mesCreatures}
                    icon={Skull}
                    subtitle="Créez vos créatures (privées par défaut) pour le Suivi de combat, et partagez-les à la communauté si vous le souhaitez."
                />
            )}

            {!form && (
                <SearchToolbar
                    value={recherche}
                    onChange={setRecherche}
                    placeholder="Rechercher une créature…"
                    count={{ n: visible.length, singulier: 'créature' }}
                    filters={(
                        <FilterPanel
                            hasActiveFilters={[filtreCategorie, filtreMilieu, filtreTaille].some(v => v !== 'all')}
                            onClearFilters={() => { setFiltreCategorie('all'); setFiltreMilieu('all'); setFiltreTaille('all'); }}
                        >
                            <GrilleFiltres>
                                <SelectFiltre label="Catégorie" toutLabel="Toutes catégories" value={filtreCategorie}
                                    onChange={setFiltreCategorie}
                                    options={distinctSorted(monsters.map(c => c.category)).map(v => ({ value: v, label: v }))} />
                                <SelectFiltre label="Milieu" toutLabel="Tous milieux" value={filtreMilieu}
                                    onChange={setFiltreMilieu}
                                    options={distinctSorted(monsters.map(c => c.environment)).map(v => ({ value: v, label: v }))} />
                                <SelectFiltre label="Taille" toutLabel="Toutes tailles" value={filtreTaille}
                                    onChange={setFiltreTaille}
                                    options={distinctSorted(monsters.map(c => c.size)).map(v => ({ value: v, label: v }))} />
                            </GrilleFiltres>
                        </FilterPanel>
                    )}
                    chips={embedded ? undefined : ONGLETS}
                    chipActif={embedded ? undefined : tab}
                    onChipChange={(id) => setTab(id as 'mine' | 'community')}
                    action={tab === 'mine' && (
                        <button
                            onClick={startCreate}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-stone-950 font-bold text-sm rounded-xl px-4 py-3 transition-colors whitespace-nowrap"
                        >
                            <Plus size={16} /> Nouveau monstre
                        </button>
                    )}
                />
            )}

            {error && !form && (
                <div className="bg-red-900/30 border border-red-500/30 text-red-200 rounded-lg px-4 py-3">{error}</div>
            )}

            {/* Formulaire de création / édition */}
            {form && (
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <h3 className="text-xl font-display font-bold text-primary-300">
                        {form.id ? 'Modifier le monstre' : 'Nouveau monstre'}
                    </h3>

                    {error && (
                        <div className="bg-red-900/30 border border-red-500/30 text-red-200 rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

                    {/* Suggestions partagées (« ce qui existe déjà » : SRD + monstres du MJ). */}
                    <datalist id={LIST.category}>{suggestions.category.map((v) => <option key={v} value={v} />)}</datalist>
                    <datalist id={LIST.environment}>{suggestions.environment.map((v) => <option key={v} value={v} />)}</datalist>
                    <datalist id={LIST.archetype}>{suggestions.archetype.map((v) => <option key={v} value={v} />)}</datalist>
                    <datalist id={LIST.size}>{suggestions.size.map((v) => <option key={v} value={v} />)}</datalist>
                    <datalist id={LIST.attack}>{suggestions.attack.map((v) => <option key={v} value={v} />)}</datalist>
                    <datalist id={LIST.capability}>{suggestions.capability.map((v) => <option key={v} value={v} />)}</datalist>

                    {/* Identité */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nom *</label>
                            <input
                                aria-label="Nom"
                                className={inputClass}
                                value={form.name}
                                onChange={(e) => patch({ name: e.target.value })}
                                placeholder="Gobelin d'élite"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Image (URL, optionnel)</label>
                            <input
                                aria-label="Image (URL, optionnel)"
                                className={inputClass}
                                value={form.picture}
                                onChange={(e) => patch({ picture: e.target.value })}
                                placeholder="https://…/gobelin.jpg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                                aria-label="Description"
                            className={inputClass}
                            rows={3}
                            value={form.description}
                            onChange={(e) => patch({ description: e.target.value })}
                        />
                    </div>

                    {/* Stats de combat */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>NC</label>
                            {/* Pas d'entier : COF2 emploie le demi-niveau pour ses adversaires
                                les plus faibles, et une créature maison doit pouvoir en porter
                                un comme celles du livre. `parseInt` tronquait 0,5 à 0. */}
                            <input
                                aria-label="NC"
                                type="number"
                                step="0.5"
                                min="0"
                                className={inputClass}
                                value={form.nc}
                                onChange={(e) => patch({ nc: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>PV</label>
                            <input
                                aria-label="PV"
                                type="number"
                                className={inputClass}
                                value={form.hp}
                                onChange={(e) => patch({ hp: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>DEF</label>
                            <input
                                aria-label="DEF"
                                type="number"
                                className={inputClass}
                                value={form.def}
                                onChange={(e) => patch({ def: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>INIT</label>
                            <input
                                aria-label="INIT"
                                type="number"
                                className={inputClass}
                                value={form.init}
                                onChange={(e) => patch({ init: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Caractéristiques */}
                    <div>
                        <label className={labelClass}>Caractéristiques</label>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                            {STAT_KEYS.map((key) => (
                                <div key={key}>
                                    <span className="block text-xs text-stone-400 mb-1 text-center">{key}</span>
                                    <input
                                        type="number"
                                        aria-label={key}
                                        className={`${inputClass} text-center px-2`}
                                        value={form.stats[key]}
                                        onChange={(e) => setStat(key, parseInt(e.target.value) || 0)}
                                    />
                                    <label className="mt-1 flex items-center justify-center gap-1 text-[11px] text-stone-400 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            aria-label={`${key} supérieure`}
                                            checked={form.statsSuperior.includes(key)}
                                            onChange={() => toggleSuperior(key)}
                                        />
                                        <span className="text-primary-400">*</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-stone-400">
                            <span className="text-primary-400">*</span> caractéristique supérieure —
                            un dé bonus à tous les tests de cette caractéristique,
                            <span className="text-stone-300"> sauf les tests d’attaque</span>.
                        </p>
                    </div>

                    {/* Classification — champs libres avec suggestions (datalist). */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>Catégorie</label>
                            <input
                                aria-label="Catégorie" list={LIST.category} className={inputClass} value={form.category} onChange={(e) => patch({ category: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Environnement</label>
                            <input
                                aria-label="Environnement" list={LIST.environment} className={inputClass} value={form.environment} onChange={(e) => patch({ environment: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Archétype</label>
                            <input
                                aria-label="Archétype" list={LIST.archetype} className={inputClass} value={form.archetype} onChange={(e) => patch({ archetype: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Taille</label>
                            <input
                                aria-label="Taille" list={LIST.size} className={inputClass} value={form.size} onChange={(e) => patch({ size: e.target.value })} />
                        </div>
                    </div>

                    {/* Attaques */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-300">
                                <Swords size={16} className="text-primary-400" /> Attaques
                            </label>
                            <button onClick={addAttack} className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">
                                <Plus size={14} /> Ajouter
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.attacks.length === 0 && <p className="text-sm text-stone-400 italic">Aucune attaque.</p>}
                            {form.attacks.map((atk, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                                    <input
                                        list={LIST.attack}
                                        className={`${inputClass} col-span-4`}
                                        placeholder="Nom (Griffe…)" aria-label="Nom (Griffe…)"
                                        value={atk.name}
                                        onChange={(e) => updateAttack(i, { name: e.target.value })}
                                    />
                                    <input
                                        className={`${inputClass} col-span-2`}
                                        placeholder="Atk" aria-label="Atk"
                                        value={atk.atk ?? ''}
                                        onChange={(e) => updateAttack(i, { atk: e.target.value })}
                                    />
                                    <input
                                        className={`${inputClass} col-span-2`}
                                        placeholder="Dégâts" aria-label="Dégâts"
                                        value={atk.dm ?? ''}
                                        onChange={(e) => updateAttack(i, { dm: e.target.value })}
                                    />
                                    <input
                                        className={`${inputClass} col-span-3`}
                                        placeholder="Spécial" aria-label="Spécial"
                                        value={atk.special ?? ''}
                                        onChange={(e) => updateAttack(i, { special: e.target.value })}
                                    />
                                    <button
                                        onClick={() => removeAttack(i)}
                                        className="col-span-1 flex items-center justify-center h-full text-stone-400 hover:text-red-400"
                                        aria-label="Supprimer l'attaque"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Capacités */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-300">
                                <Sparkles size={16} className="text-primary-400" /> Capacités
                            </label>
                            <button onClick={addCapability} className="text-sm text-primary-400 hover:text-primary-300 inline-flex items-center gap-1">
                                <Plus size={14} /> Ajouter
                            </button>
                        </div>
                        <div className="space-y-2">
                            {form.capabilities.length === 0 && <p className="text-sm text-stone-400 italic">Aucune capacité.</p>}
                            {form.capabilities.map((cap, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                                    <input
                                        list={LIST.capability}
                                        className={`${inputClass} col-span-4`}
                                        placeholder="Nom" aria-label="Nom"
                                        value={cap.name}
                                        onChange={(e) => updateCapability(i, { name: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        className={`${inputClass} col-span-2`}
                                        placeholder="Rang" aria-label="Rang"
                                        value={cap.rank ?? ''}
                                        onChange={(e) =>
                                            updateCapability(i, {
                                                rank: e.target.value === '' ? undefined : parseInt(e.target.value) || 0,
                                            })
                                        }
                                    />
                                    <input
                                        className={`${inputClass} col-span-5`}
                                        placeholder="Description" aria-label="Description"
                                        value={cap.description ?? ''}
                                        onChange={(e) => updateCapability(i, { description: e.target.value })}
                                    />
                                    <button
                                        onClick={() => removeCapability(i)}
                                        className="col-span-1 flex items-center justify-center h-full text-stone-400 hover:text-red-400"
                                        aria-label="Supprimer la capacité"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Capacités spéciales (texte libre) */}
                    <div>
                        <label className={labelClass}>Capacités spéciales (texte libre)</label>
                        <textarea
                                aria-label="Capacités spéciales (texte libre)"
                            className={inputClass}
                            rows={3}
                            value={form.specialAbilitiesText}
                            onChange={(e) => patch({ specialAbilitiesText: e.target.value })}
                        />
                    </div>

                    {/* Partage communautaire */}
                    <label className="flex items-center gap-2 text-sm text-stone-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.visibility === 'public'}
                            onChange={(e) => patch({ visibility: e.target.checked ? 'public' : 'private' })}
                            className="accent-primary-500 w-4 h-4"
                        />
                        <Globe size={14} className="text-green-500/70" /> Partager à la communauté (public)
                    </label>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={cancel}
                            className="inline-flex items-center gap-2 border border-white/10 text-stone-300 hover:bg-white/5 rounded-lg px-4 py-2 transition-colors"
                        >
                            <X size={18} /> Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !form.name.trim()}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2 transition-colors"
                        >
                            <Save size={18} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            )}

            {/* Liste */}
            {!form && !loading && visible.length === 0 && tab === 'mine' && (
                <EmptyState
                    icon={Skull}
                    title="Aucun monstre pour le moment"
                    message="Créez votre premier monstre maison pour l'utiliser à votre table."
                    action={{ label: 'Nouveau monstre', onClick: startCreate }}
                />
            )}

            {!form && !loading && visible.length === 0 && tab === 'community' && (
                <EmptyState
                    icon={Globe}
                    title="Rien de partagé pour l'instant"
                    message="Les monstres publiés par la communauté apparaîtront ici."
                />
            )}

            {!form && visible.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visible.map((c) => {
                        const mine = c.authorId === myId;
                        return (
                            <CreatureCard
                                key={c.id}
                                carte={carteDepuisMonstreMaison(c)}
                                to={`/creatures/maison/${c.id}`}
                                entete={c.visibility === 'public'
                                    ? <Globe size={13} className="text-green-500/70 shrink-0" aria-label="Public" />
                                    : <Lock size={13} className="text-stone-400 shrink-0" aria-label="Privé" />}
                                footer={mine ? (
                                    <div className="flex border-t border-white/5">
                                        <button onClick={() => startEdit(c)} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all"><Pencil size={12} /> Modifier</button>
                                        <button onClick={() => handleDelete(c)} className="flex-1 py-2 text-[11px] font-bold uppercase text-stone-400 hover:text-red-400 hover:bg-white/[0.03] flex items-center justify-center gap-1.5 transition-all border-l border-white/5"><Trash2 size={12} /> Supprimer</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2 border-t border-white/5 px-3 py-2">
                                        <AuthorTag pseudo={c.authorPseudo} size="sm" />
                                        <button
                                            onClick={() => handleDuplicate(c)}
                                            disabled={duplicatingId === c.id}
                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase text-stone-400 hover:text-primary-400 transition-colors disabled:opacity-50"
                                        >
                                            <Copy size={12} /> {duplicatingId === c.id ? 'Copie…' : 'Dupliquer chez moi'}
                                        </button>
                                    </div>
                                )}
                            />
                        );
                    })}
                </div>
            )}
        </PageContainer>
    );
};
