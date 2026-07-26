import React, { useEffect, useMemo, useState } from 'react';
import { Skull, Plus, Trash2, Pencil, Save, X, Swords, Sparkles, Globe, Lock, User as UserIcon, Copy } from 'lucide-react';
import { PageContainer, PageHeader, EmptyState } from '../components/common';
import { getMonsters, createMonster, updateMonster, deleteMonster } from '../services/monsterService';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import type { CustomCreature, CustomCreatureAttack, CustomCreatureCapability, Creature } from '../types';

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
    specialAbilities: { text: form.specialAbilitiesText.trim() },
    // On ne conserve que les lignes nommées.
    attacks: form.attacks.filter((a) => a.name.trim() !== ''),
    capabilities: form.capabilities.filter((cap) => cap.name.trim() !== ''),
    picture: form.picture.trim() || undefined,
    category: form.category.trim() || undefined,
    environment: form.environment.trim() || undefined,
    archetype: form.archetype.trim() || undefined,
    size: form.size.trim() || undefined,
    visibility: form.visibility,
});

export const CustomMonsters: React.FC = () => {
    const { user } = useAuth();
    const myId = user?.id;
    const [tab, setTab] = useState<'mine' | 'community'>('mine');
    const [monsters, setMonsters] = useState<CustomCreature[]>([]);
    const [srdCreatures, setSrdCreatures] = useState<Creature[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<MonsterForm | null>(null);
    const [saving, setSaving] = useState(false);
    const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
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

    // Onglet « Mon contenu » = mes monstres ; « Communauté » = les publics d'autrui.
    const visible = useMemo(() => (
        tab === 'mine'
            ? monsters.filter((c) => c.authorId === myId)
            : monsters.filter((c) => c.visibility === 'public' && c.authorId !== myId)
    ), [monsters, tab, myId]);

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

    const patch = (changes: Partial<MonsterForm>) => setForm((f) => (f ? { ...f, ...changes } : f));

    const setStat = (key: StatKey, value: number) =>
        setForm((f) => (f ? { ...f, stats: { ...f.stats, [key]: value } } : f));

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
            <PageHeader
                title="Mes Monstres"
                icon={Skull}
                subtitle="Créez vos créatures (privées par défaut) pour le Suivi de Combat, et partagez-les à la communauté si vous le souhaitez."
            />

            {!form && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                        {(['mine', 'community'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40' : 'bg-stone-900/40 text-stone-500 border border-white/5 hover:text-stone-300'}`}
                            >
                                {t === 'mine' ? 'Mon contenu' : 'Communauté'}
                            </button>
                        ))}
                    </div>
                    {tab === 'mine' && (
                        <button
                            onClick={startCreate}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                        >
                            <Plus size={18} /> Nouveau monstre
                        </button>
                    )}
                </div>
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
                                className={inputClass}
                                value={form.name}
                                onChange={(e) => patch({ name: e.target.value })}
                                placeholder="Gobelin d'élite"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Image (URL, optionnel)</label>
                            <input
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
                            <input
                                type="number"
                                className={inputClass}
                                value={form.nc}
                                onChange={(e) => patch({ nc: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>PV</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={form.hp}
                                onChange={(e) => patch({ hp: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>DEF</label>
                            <input
                                type="number"
                                className={inputClass}
                                value={form.def}
                                onChange={(e) => patch({ def: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>INIT</label>
                            <input
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
                                        className={`${inputClass} text-center px-2`}
                                        value={form.stats[key]}
                                        onChange={(e) => setStat(key, parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Classification — champs libres avec suggestions (datalist). */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>Catégorie</label>
                            <input list={LIST.category} className={inputClass} value={form.category} onChange={(e) => patch({ category: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Environnement</label>
                            <input list={LIST.environment} className={inputClass} value={form.environment} onChange={(e) => patch({ environment: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Archétype</label>
                            <input list={LIST.archetype} className={inputClass} value={form.archetype} onChange={(e) => patch({ archetype: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Taille</label>
                            <input list={LIST.size} className={inputClass} value={form.size} onChange={(e) => patch({ size: e.target.value })} />
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
                            {form.attacks.length === 0 && <p className="text-sm text-stone-500 italic">Aucune attaque.</p>}
                            {form.attacks.map((atk, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                                    <input
                                        list={LIST.attack}
                                        className={`${inputClass} col-span-4`}
                                        placeholder="Nom (Griffe…)"
                                        value={atk.name}
                                        onChange={(e) => updateAttack(i, { name: e.target.value })}
                                    />
                                    <input
                                        className={`${inputClass} col-span-2`}
                                        placeholder="Atk"
                                        value={atk.atk ?? ''}
                                        onChange={(e) => updateAttack(i, { atk: e.target.value })}
                                    />
                                    <input
                                        className={`${inputClass} col-span-2`}
                                        placeholder="Dégâts"
                                        value={atk.dm ?? ''}
                                        onChange={(e) => updateAttack(i, { dm: e.target.value })}
                                    />
                                    <input
                                        className={`${inputClass} col-span-3`}
                                        placeholder="Spécial"
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
                            {form.capabilities.length === 0 && <p className="text-sm text-stone-500 italic">Aucune capacité.</p>}
                            {form.capabilities.map((cap, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                                    <input
                                        list={LIST.capability}
                                        className={`${inputClass} col-span-4`}
                                        placeholder="Nom"
                                        value={cap.name}
                                        onChange={(e) => updateCapability(i, { name: e.target.value })}
                                    />
                                    <input
                                        type="number"
                                        className={`${inputClass} col-span-2`}
                                        placeholder="Rang"
                                        value={cap.rank ?? ''}
                                        onChange={(e) =>
                                            updateCapability(i, {
                                                rank: e.target.value === '' ? undefined : parseInt(e.target.value) || 0,
                                            })
                                        }
                                    />
                                    <input
                                        className={`${inputClass} col-span-5`}
                                        placeholder="Description"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visible.map((c) => {
                        const mine = c.authorId === myId;
                        return (
                            <div key={c.id} className="glass-panel p-5 rounded-xl flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-display font-bold text-stone-100 truncate">{c.name}</h3>
                                        {c.visibility === 'public'
                                            ? <Globe size={13} className="text-green-500/70 shrink-0" aria-label="Public" />
                                            : <Lock size={13} className="text-stone-600 shrink-0" aria-label="Privé" />}
                                    </div>
                                    <p className="text-sm text-stone-400 mt-1">
                                        NC {c.nc} · PV {c.hp} · DEF {c.def} · INIT {c.init}
                                        {c.category ? ` · ${c.category}` : ''}
                                    </p>
                                    {c.description && (
                                        <p className="text-sm text-stone-500 mt-2 line-clamp-2">{c.description}</p>
                                    )}
                                    {!mine && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-[11px] text-stone-600 flex items-center gap-1">
                                                <UserIcon size={11} /> {c.authorPseudo || 'Anonyme'}
                                            </p>
                                            <button
                                                onClick={() => handleDuplicate(c)}
                                                disabled={duplicatingId === c.id}
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-400 hover:text-primary-300 border border-primary-500/30 hover:border-primary-500/50 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
                                            >
                                                <Copy size={13} /> {duplicatingId === c.id ? 'Copie…' : 'Dupliquer chez moi'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {mine && (
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => startEdit(c)}
                                            className="text-stone-400 hover:text-primary-400"
                                            aria-label="Modifier"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c)}
                                            className="text-stone-400 hover:text-red-400"
                                            aria-label="Supprimer"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </PageContainer>
    );
};
