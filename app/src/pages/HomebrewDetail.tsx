import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, User as UserIcon } from 'lucide-react';
import { HomebrewService, categoryLabel, type HomebrewEntry } from '../services/homebrewService';
import { HOMEBREW_SCHEMAS, CARAC_KEYS, type HomebrewFieldDef } from '../services/homebrewSchemas';
import { Loader } from '../components/common';
import { RaceSheet, ProfileSheet, VoieSheet, CapaciteSheet, OwnerBar } from '../components/sheets';
import { homebrewToRaceVM, homebrewToProfileVM, homebrewToVoieVM, homebrewToCapaciteVM } from '../components/sheets/adapters/fromHomebrew';
import { useAuth } from '../context/AuthContext';

/** Page de la catégorie (liste) vers laquelle revenir après suppression/duplication. */
const categoryPath = (category: string): string => {
    if (category === 'race') return '/races';
    if (category === 'classe') return '/classes';
    if (category === 'voie') return '/voies';
    if (category === 'capacite' || category === 'sort') return '/capacites';
    return '/bibliotheque';
};

const hasValue = (v: unknown): boolean => {
    if (v === undefined || v === null || v === '') return false;
    if (Array.isArray(v)) return v.some(x => x !== undefined && x !== null && String(x).trim() !== '');
    if (typeof v === 'object') return Object.values(v as Record<string, unknown>).some(x => Number(x) !== 0);
    return true;
};

// Champs « compacts » (colonne latérale) vs « longs » (colonne principale).
const isSidebar = (f: HomebrewFieldDef) => f.type === 'number' || f.type === 'select' || f.type === 'text' || f.type === 'bool';

/**
 * Détail d'une entrée homebrew en pleine page, calqué sur les fiches officielles
 * (héros + colonne « Caractéristiques » + sections de contenu), piloté par le schéma
 * de la catégorie. Remplace l'ancienne popup.
 */
export const HomebrewDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [entry, setEntry] = useState<HomebrewEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'lore' | 'rules'>('lore');
    const [duplicating, setDuplicating] = useState(false);

    useEffect(() => {
        if (!id) return;
        HomebrewService.getById(id).then(setEntry).catch(() => setEntry(null)).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <Loader />;
    if (!entry) return <div className="p-8 text-center text-red-400">Contenu introuvable</div>;

    const handleDelete = async () => {
        if (!confirm(`Supprimer « ${entry.name} » ?`)) return;
        await HomebrewService.remove(entry.id);
        navigate(categoryPath(entry.category));
    };

    const handleDuplicate = async () => {
        setDuplicating(true);
        try {
            await HomebrewService.create({ category: entry.category, name: `${entry.name} (copie)`, description: entry.description ?? '', visibility: 'private', data: entry.data ?? {} });
            navigate(categoryPath(entry.category));
        } finally {
            setDuplicating(false);
        }
    };

    const mine = entry.authorId === user?.id;
    const ownerBar = (
        <OwnerBar
            pseudo={entry.authorPseudo}
            visibility={entry.visibility}
            mine={mine}
            duplicating={duplicating}
            onDuplicate={mine ? undefined : handleDuplicate}
            onDelete={mine ? handleDelete : undefined}
        />
    );

    if (entry.category === 'race') {
        return <RaceSheet vm={homebrewToRaceVM(entry)} backTo="/races" backLabel="Retour aux Races" header={ownerBar} />;
    }

    if (entry.category === 'classe') {
        return <ProfileSheet vm={homebrewToProfileVM(entry)} backTo="/classes" backLabel="Retour aux Classes" header={ownerBar} />;
    }

    if (entry.category === 'voie') {
        return <VoieSheet vm={homebrewToVoieVM(entry)} backTo="/voies" backLabel="Retour aux Voies" header={ownerBar} />;
    }

    if (entry.category === 'capacite' || entry.category === 'sort') {
        return <CapaciteSheet vm={homebrewToCapaciteVM(entry)} backTo="/capacites" backLabel="Retour aux Capacités" header={ownerBar} />;
    }

    const schema = HOMEBREW_SCHEMAS[entry.category] ?? [];
    const data = entry.data ?? {};
    const caracField = schema.find(f => f.type === 'caracs' && hasValue(data[f.key]));
    const sidebarFields = schema.filter(f => isSidebar(f) && hasValue(data[f.key]));
    const mainFields = schema.filter(f => (f.type === 'textarea' || f.type === 'lines') && hasValue(data[f.key]));

    const caracs = caracField ? (data[caracField.key] as Record<string, number>) : null;

    // Onglets Lore / Règles : uniquement si la catégorie a des champs des deux natures.
    const loreFields = mainFields.filter(f => f.tab === 'lore');
    const ruleFields = mainFields.filter(f => f.tab !== 'lore');
    const hasTabs = loreFields.length > 0 && ruleFields.length > 0;
    const shownFields = hasTabs ? (activeTab === 'lore' ? loreFields : ruleFields) : mainFields;

    const renderField = (f: HomebrewFieldDef) => (
        <div key={f.key} className="bg-stone-900/50 p-6 rounded-2xl border border-white/5">
            <h3 className="text-lg font-display font-bold text-white mb-3">{f.label}</h3>
            {f.type === 'lines' ? (
                <ul className="list-disc list-inside text-stone-300 space-y-1 leading-relaxed">
                    {(data[f.key] as string[]).filter(x => x && x.trim() !== '').map((x, i) => <li key={i}>{x}</li>)}
                </ul>
            ) : (
                <p className="text-stone-300 leading-relaxed whitespace-pre-line">{String(data[f.key])}</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen pb-16 relative">
            {/* Lueur décorative */}
            <div className="absolute top-0 left-0 w-full h-[420px] overflow-hidden z-0 pointer-events-none [mask-image:linear-gradient(to_bottom,black_30%,transparent)]">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-3xl -translate-y-1/3"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10 pt-6 max-w-6xl">
                {/* En-tête */}
                <div className="mb-8">
                    <button onClick={() => navigate(-1)} className="inline-flex items-center text-stone-400 hover:text-white transition-colors group mb-6">
                        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-display font-medium tracking-wide text-sm uppercase">Retour</span>
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-[11px] uppercase font-bold tracking-widest text-primary-400/90 border border-primary-500/40 rounded px-2 py-0.5">{categoryLabel(entry.category)}</span>
                        <span className="text-[11px] text-stone-500 flex items-center gap-1.5">
                            <UserIcon size={12} /> {entry.authorPseudo || 'Anonyme'}
                            {entry.visibility === 'public'
                                ? <><Globe size={12} className="text-green-500/70 ml-1" /> Public</>
                                : <><Lock size={12} className="ml-1" /> Privé</>}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white drop-shadow-xl">{entry.name}</h1>
                    {entry.description && <p className="text-lg text-primary-100/90 mt-4 max-w-3xl leading-relaxed">{entry.description}</p>}
                </div>

                {/* Grille : colonne latérale (stats) + contenu */}
                <div className="grid lg:grid-cols-12 gap-8">
                    {(caracs || sidebarFields.length > 0) && (
                        <div className="lg:col-span-4 space-y-6">
                            {caracs && (
                                <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                                    <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-4">{caracField!.label}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {CARAC_KEYS.filter(k => (caracs[k] ?? 0) !== 0).map(k => (
                                            <span key={k} className="px-3 py-1.5 rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-100 font-mono text-sm">
                                                {k} <span className={caracs[k] > 0 ? 'text-primary-300' : 'text-red-300'}>{caracs[k] > 0 ? '+' : ''}{caracs[k]}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {sidebarFields.length > 0 && (
                                <div className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 shadow-xl">
                                    <h3 className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-4">Caractéristiques</h3>
                                    <div className="space-y-3">
                                        {sidebarFields.map(f => (
                                            <div key={f.key} className="flex justify-between items-baseline gap-3 border-b border-white/5 pb-2 last:border-0">
                                                <span className="text-stone-400 text-sm">{f.label}</span>
                                                <span className="font-display text-primary-200 text-right">
                                                    {f.type === 'bool' ? (data[f.key] ? 'Oui' : 'Non') : String(data[f.key])}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contenu principal */}
                    <div className={(caracs || sidebarFields.length > 0) ? 'lg:col-span-8' : 'lg:col-span-12'}>
                        {/* Onglets (si lore + règles présents) */}
                        {hasTabs && (
                            <div className="flex items-center gap-8 border-b border-white/10 mb-6 px-2">
                                {([['lore', 'Légendes & Culture'], ['rules', 'Règles & Capacités']] as const).map(([id, label]) => (
                                    <button
                                        key={id}
                                        onClick={() => setActiveTab(id)}
                                        className={`pb-3 text-lg font-display font-bold tracking-wide transition-all relative ${activeTab === id ? 'text-white' : 'text-stone-500 hover:text-stone-300'}`}
                                    >
                                        {label}
                                        {activeTab === id && <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="space-y-6">
                            {shownFields.length === 0 && !entry.description && (
                                <p className="text-stone-600 italic">Aucun détail supplémentaire.</p>
                            )}
                            {shownFields.map(renderField)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
