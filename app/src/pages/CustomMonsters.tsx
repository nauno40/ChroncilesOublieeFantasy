import React, { useEffect, useState } from 'react';
import { Skull, Plus, Trash2, Pencil, Save, X, Swords, Sparkles } from 'lucide-react';
import { PageContainer, PageHeader, EmptyState } from '../components/common';
import { getMonsters, createMonster, updateMonster, deleteMonster } from '../services/monsterService';
import type { CustomCreature, CustomCreatureAttack, CustomCreatureCapability } from '../types';

const inputClass =
    'w-full bg-black/40 border border-white/10 text-stone-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500';
const labelClass = 'block text-sm font-medium text-stone-300 mb-1';

const STAT_KEYS = ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA'] as const;
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
}

const emptyStats = (): Stats => ({ FOR: 10, DEX: 10, CON: 10, INT: 10, SAG: 10, CHA: 10 });

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
});

export const CustomMonsters: React.FC = () => {
    const [monsters, setMonsters] = useState<CustomCreature[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState<MonsterForm | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true);
        getMonsters()
            .then(setMonsters)
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

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

    return (
        <PageContainer>
            <PageHeader
                title="Mes Monstres"
                icon={Skull}
                subtitle="Créez vos propres créatures et retrouvez-les dans le Suivi de Combat."
            />

            {!form && (
                <div className="flex justify-end">
                    <button
                        onClick={startCreate}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg px-4 py-2 transition-colors"
                    >
                        <Plus size={18} /> Nouveau monstre
                    </button>
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
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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

                    {/* Classification */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>Catégorie</label>
                            <input className={inputClass} value={form.category} onChange={(e) => patch({ category: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Environnement</label>
                            <input className={inputClass} value={form.environment} onChange={(e) => patch({ environment: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Archétype</label>
                            <input className={inputClass} value={form.archetype} onChange={(e) => patch({ archetype: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>Taille</label>
                            <input className={inputClass} value={form.size} onChange={(e) => patch({ size: e.target.value })} />
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
            {!form && !loading && monsters.length === 0 && (
                <EmptyState
                    icon={Skull}
                    title="Aucun monstre pour le moment"
                    message="Créez votre premier monstre maison pour l'utiliser à votre table."
                    action={{ label: 'Nouveau monstre', onClick: startCreate }}
                />
            )}

            {!form && monsters.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {monsters.map((c) => (
                        <div key={c.id} className="glass-panel p-5 rounded-xl flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="text-lg font-display font-bold text-stone-100 truncate">{c.name}</h3>
                                <p className="text-sm text-stone-400 mt-1">
                                    NC {c.nc} · PV {c.hp} · DEF {c.def} · INIT {c.init}
                                    {c.category ? ` · ${c.category}` : ''}
                                </p>
                                {c.description && (
                                    <p className="text-sm text-stone-500 mt-2 line-clamp-2">{c.description}</p>
                                )}
                            </div>
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
                        </div>
                    ))}
                </div>
            )}
        </PageContainer>
    );
};
