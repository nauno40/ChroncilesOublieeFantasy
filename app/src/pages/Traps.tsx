import React, { useState, useEffect } from 'react';
import type { Trap } from '../types/normalized';
import { PageContainer, PageHeader, Loader } from '../components/common';
import { useSearch } from '../hooks';
import { DataService } from '../services/dataService';

export const Traps: React.FC = () => {
    const [traps, setTraps] = useState<Trap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getTraps()
            .then(setTraps)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const { searchTerm, setSearchTerm, filteredItems } = useSearch(
        traps,
        (t, term) => (t.name + ' ' + (t.effect ?? '') + ' ' + (t.complement ?? '')).toLowerCase().includes(term.toLowerCase()),
    );

    if (loading) return <PageContainer><Loader /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Rechercher un piège..."
                subtitle={`${filteredItems.length} piège${filteredItems.length > 1 ? 's' : ''} — COF2, table du MJ`}
            />

            <div className="glass-panel rounded-2xl border border-white/5 overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-primary-500/70 border-b border-white/10">
                            <th className="px-4 py-3 font-bold">Piège</th>
                            <th className="px-4 py-3 font-bold text-center">Détecter</th>
                            <th className="px-4 py-3 font-bold text-center">Désamorcer</th>
                            <th className="px-4 py-3 font-bold">Effet</th>
                            <th className="px-4 py-3 font-bold">Complément</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((t, i) => (
                            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 font-display font-bold text-stone-100 whitespace-nowrap">{t.name}</td>
                                <td className="px-4 py-3 text-center font-mono text-stone-300 whitespace-nowrap">{t.detectDifficulty || '—'}</td>
                                <td className="px-4 py-3 text-center font-mono text-stone-300 whitespace-nowrap">{t.disarmDifficulty || '—'}</td>
                                <td className="px-4 py-3 text-stone-300">{t.effect || '—'}</td>
                                <td className="px-4 py-3 text-stone-500 text-xs">{t.complement || ''}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-[11px] text-stone-600 mt-3 italic">
                « Détecter » / « Désamorcer » indiquent la difficulté des tests correspondants. Un « DM/2 sur test AGI » signifie que la victime subit la moitié des dommages si elle réussit un test d'AGI à la difficulté indiquée.
            </p>
        </PageContainer>
    );
};
