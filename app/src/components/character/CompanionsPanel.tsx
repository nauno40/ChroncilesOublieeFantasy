import React, { useState, useEffect } from 'react';
import type { Character, Companion } from '../../types/character';
import type { Creature } from '../../types/normalized';
import { DataService } from '../../services/dataService';
import { companionFromCreature } from '../../domain/rules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Roster de compagnons / invocations / montures (COF2 §7 #1) — aide de table.
 * Piloté joueur ; pré-remplissage depuis le bestiaire. Aucun effet sur la fiche du perso.
 */
export const CompanionsPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const [creatures, setCreatures] = useState<Creature[]>([]);
    useEffect(() => {
        DataService.getCreatures().then(setCreatures).catch(() => setCreatures([]));
    }, []);

    const companions = character.playState?.companions ?? [];

    const write = (next: Companion[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, companions: next } }));
    const update = (idx: number, patch: Partial<Companion>) =>
        write(companions.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
    const remove = (idx: number) => write(companions.filter((_, i) => i !== idx));
    const addCustom = () => write([...companions, { name: '', hp: { current: 0, max: 0 }, def: 0, init: 0 }]);
    const addFromCreature = (id: string) => {
        const cr = creatures.find(c => String(c.id) === id);
        if (cr) write([...companions, companionFromCreature(cr)]);
    };
    const setHp = (idx: number, c: Companion, delta: number) =>
        update(idx, { hp: { ...c.hp, current: Math.max(0, Math.min(c.hp.max, c.hp.current + delta)) } });
    const setMaxHp = (idx: number, c: Companion, max: number) =>
        update(idx, { hp: { max, current: Math.min(c.hp.current, max) } });

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Compagnons & Invocations</h3>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-[11px] text-stone-300 outline-none"
                        value=""
                        onChange={e => { if (e.target.value) addFromCreature(e.target.value); e.target.value = ''; }}
                    >
                        <option value="">+ Bestiaire…</option>
                        {creatures.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <button onClick={addCustom} className="text-stone-500 hover:text-primary-400 text-sm" title="Compagnon personnalisé">+ Custom</button>
                </div>
            </div>
            {companions.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucun compagnon.</p>}
            {companions.map((c, idx) => {
                const down = c.hp.current <= 0;
                return (
                    <div key={idx} className={`rounded-lg border p-2 space-y-1.5 ${down ? 'border-red-900/40 bg-red-950/10' : 'border-white/5 bg-stone-950/20'}`}>
                        <div className="flex items-center gap-1.5 text-xs">
                            <input
                                type="text"
                                className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 font-bold outline-none focus:border-primary-500/40"
                                placeholder="Nom du compagnon"
                                value={c.name}
                                onChange={e => update(idx, { name: e.target.value })}
                            />
                            <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="flex items-center gap-1">
                                <span className="text-stone-500 uppercase font-bold">PV</span>
                                <button onClick={() => setHp(idx, c, -1)} className="text-stone-500 hover:text-red-400 w-4 text-center">−</button>
                                <span className={`font-mono font-bold ${down ? 'text-red-400' : 'text-green-400'}`}>{c.hp.current}/</span>
                                <input type="number" className="w-9 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    value={c.hp.max} onChange={e => setMaxHp(idx, c, Math.max(0, parseInt(e.target.value) || 0))} />
                                <button onClick={() => setHp(idx, c, 1)} className="text-stone-500 hover:text-green-400 w-4 text-center">+</button>
                            </span>
                            <label className="flex items-center gap-1"><span className="text-stone-500 uppercase font-bold">DEF</span>
                                <input type="number" className="w-10 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    value={c.def} onChange={e => update(idx, { def: parseInt(e.target.value) || 0 })} /></label>
                            <label className="flex items-center gap-1"><span className="text-stone-500 uppercase font-bold">Init</span>
                                <input type="number" className="w-10 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    value={c.init} onChange={e => update(idx, { init: parseInt(e.target.value) || 0 })} /></label>
                        </div>
                        <input
                            type="text"
                            className="w-full bg-transparent border-none outline-none text-[11px] text-stone-500 italic placeholder:text-stone-800"
                            placeholder="Notes (attaques, capacités…)"
                            value={c.notes || ''}
                            onChange={e => update(idx, { notes: e.target.value })}
                        />
                    </div>
                );
            })}
        </div>
    );
};
