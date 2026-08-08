import React, { useState, useEffect } from 'react';
import type { Poison } from '../types/normalized';
import { PageContainer, PageHeader, Loader } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';

export const Poisons: React.FC = () => {
    const [poisons, setPoisons] = useState<Poison[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getPoisons()
            .then(setPoisons)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        poisons,
        (p, term) => (p.name + ' ' + (p.effectFail ?? '') + ' ' + (p.note ?? '')).toLowerCase().includes(term.toLowerCase()),
    );

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher un poison..."
                subtitle={`${filteredItems.length} poison${filteredItems.length > 1 ? 's' : ''} — COF2, table du MJ`}
            />

            <div className="glass-panel rounded-2xl border border-white/5 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[720px]">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-primary-500/70 border-b border-white/10">
                            <th className="px-4 py-3 font-bold">Poison</th>
                            <th className="px-4 py-3 font-bold">Effet — Échec (test de CON)</th>
                            <th className="px-4 py-3 font-bold">Effet — Réussite</th>
                            <th className="px-4 py-3 font-bold">Durée</th>
                            <th className="px-4 py-3 font-bold">Délai</th>
                            <th className="px-4 py-3 font-bold">Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((p, i) => (
                            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 font-display font-bold text-stone-100 whitespace-nowrap">{p.name}</td>
                                <td className="px-4 py-3 text-stone-300">{p.effectFail || '—'}</td>
                                <td className="px-4 py-3 text-stone-400">{p.effectSuccess || '—'}</td>
                                <td className="px-4 py-3 text-stone-400 whitespace-nowrap">{p.duration || '—'}</td>
                                <td className="px-4 py-3 text-stone-400 whitespace-nowrap">{p.delay || '—'}</td>
                                <td className="px-4 py-3 text-stone-500 text-xs">{p.note || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-[11px] text-stone-600 mt-3 italic">
                À la création d'un poison, le MJ choisit un type et une voie d'administration (ingestion, contact, blessure…). Un test de CON réussi réduit ou annule l'effet selon le type.
            </p>
        </PageContainer>
    );
};
