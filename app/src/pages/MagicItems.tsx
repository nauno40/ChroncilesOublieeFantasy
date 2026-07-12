import React, { useMemo, useState } from 'react';
import { Sparkles, Dices, Coins } from 'lucide-react';
import {
    magicItemValue,
    potionScrollValue,
    resaleValue,
    rollOnTable,
    tablesByCategory,
    type MagicTable,
} from '../utils/magicItems';

export const MagicItems: React.FC = () => {
    const groups = useMemo(() => tablesByCategory(), []);
    const [magicLevel, setMagicLevel] = useState(1);
    const [spellRank, setSpellRank] = useState(1);
    const [lastRoll, setLastRoll] = useState<{ table: string; roll: number; result: string } | null>(null);

    const itemValue = magicItemValue(magicLevel);
    const scrollValue = potionScrollValue(spellRank);

    const roll = (t: MagicTable) => {
        const r = rollOnTable(t);
        setLastRoll({ table: t.name, roll: r.roll, result: r.result });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h2 className="text-4xl font-display font-bold text-primary-400 mb-2 drop-shadow-lg flex items-center gap-3">
                    <Sparkles size={32} /> Objets magiques
                </h2>
                <p className="text-stone-400 text-sm">Évaluez et tirez au sort des objets magiques d'après le chapitre « Objets magiques ».</p>
            </div>

            {/* Évaluateur */}
            <section className="glass-panel p-6 rounded-2xl border-primary-500/20">
                <h3 className="text-xl font-display font-bold text-stone-200 mb-4 flex items-center gap-2">
                    <Coins size={20} className="text-primary-400" /> Valeur d'un objet magique
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-stone-900/40 rounded-xl p-4 border border-stone-800">
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Niveau de magie <span className="text-stone-500">(= bonus accordé)</span>
                        </label>
                        <input
                            type="number" min={0} max={12} value={magicLevel}
                            onChange={e => setMagicLevel(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-24 px-3 py-2 bg-stone-950/50 border border-stone-700 rounded-lg text-2xl font-display font-bold text-primary-300 outline-none focus:border-primary-500"
                        />
                        <div className="mt-3 text-sm text-stone-400 space-y-1">
                            <div>Valeur : <b className="text-stone-200 font-mono">{itemValue.toLocaleString('fr-FR')} po</b> <span className="text-stone-600">(nm² × 200)</span></div>
                            <div>Revente (max 50 %) : <b className="text-stone-300 font-mono">{resaleValue(itemValue).toLocaleString('fr-FR')} po</b></div>
                        </div>
                    </div>
                    <div className="bg-stone-900/40 rounded-xl p-4 border border-stone-800">
                        <label className="block text-sm font-medium text-stone-300 mb-2">
                            Potion / parchemin <span className="text-stone-500">(rang du sort)</span>
                        </label>
                        <input
                            type="number" min={1} max={5} value={spellRank}
                            onChange={e => setSpellRank(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-24 px-3 py-2 bg-stone-950/50 border border-stone-700 rounded-lg text-2xl font-display font-bold text-blue-300 outline-none focus:border-blue-500"
                        />
                        <div className="mt-3 text-sm text-stone-400 space-y-1">
                            <div>Valeur : <b className="text-stone-200 font-mono">{scrollValue.toLocaleString('fr-FR')} pa</b> <span className="text-stone-600">(rang² × 50)</span></div>
                            <div className="text-stone-600 text-xs">Une baguette = ce prix × son nombre de charges.</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Résultat de tirage */}
            {lastRoll && (
                <div className="glass-panel p-5 rounded-2xl border-primary-500/40 bg-primary-950/10 flex items-center gap-4 animate-fade-in">
                    <div className="w-14 h-14 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center font-display font-bold text-2xl text-primary-300 tabular-nums">
                        {lastRoll.roll}
                    </div>
                    <div>
                        <div className="text-[10px] uppercase tracking-widest text-primary-500/70 font-bold">{lastRoll.table}</div>
                        <div className="text-lg font-display font-bold text-stone-100">{lastRoll.result}</div>
                    </div>
                </div>
            )}

            {/* Tables de tirage */}
            <section className="space-y-6">
                <h3 className="text-xl font-display font-bold text-stone-200 flex items-center gap-2">
                    <Dices size={20} className="text-primary-400" /> Tables de génération
                </h3>
                {Object.entries(groups).map(([category, tables]) => (
                    <div key={category}>
                        <h4 className="text-xs uppercase tracking-widest text-primary-600/80 font-bold mb-2 ml-1">{category}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {tables.map(t => (
                                <button
                                    key={t.name}
                                    onClick={() => roll(t)}
                                    className="text-left bg-stone-900/40 hover:bg-stone-900/70 border border-stone-800 hover:border-primary-500/40 rounded-xl p-4 transition-all group"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-display font-bold text-stone-200 group-hover:text-primary-300 text-sm leading-tight">{t.name}</span>
                                        <span className="text-[10px] font-mono font-bold text-stone-500 border border-stone-700 rounded px-1.5 py-0.5 flex-none">d{t.die}</span>
                                    </div>
                                    <span className="text-[11px] text-stone-500 mt-1 block">{t.entries.length} résultats · cliquer pour tirer</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};
