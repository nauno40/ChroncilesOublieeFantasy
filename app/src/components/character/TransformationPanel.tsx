import React, { useState, useEffect } from 'react';
import type { Character, Form } from '../../types/character';
import type { Creature } from '../../types/normalized';
import { DataService } from '../../services/dataService';
import { formFromCreature, activateForm } from '../../utils/cofRules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
}

/**
 * Transformations (COF2 §7 #2, ex. forme animale du druide). Une forme active remplace les
 * stats de combat affichées (DEF/Init/PV) — override géré par le hook. Piloté joueur ;
 * une seule forme active. Aucun effet sans forme active.
 */
export const TransformationPanel: React.FC<Props> = ({ character, setCharacter }) => {
    const [creatures, setCreatures] = useState<Creature[]>([]);
    useEffect(() => {
        DataService.getCreatures().then(setCreatures).catch(() => setCreatures([]));
    }, []);

    const forms = character.playState?.forms ?? [];
    const active = forms.find(f => f.active);

    const write = (next: Form[]) =>
        setCharacter(prev => ({ ...prev, playState: { ...prev.playState!, forms: next } }));
    const update = (idx: number, patch: Partial<Form>) =>
        write(forms.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
    const toggle = (idx: number, f: Form) => write(activateForm(forms, idx, !f.active));
    const remove = (idx: number) => write(forms.filter((_, i) => i !== idx));
    const addCustom = () => write([...forms, { name: '', hp: { current: 0, max: 0 }, def: 0, init: 0, active: false }]);
    const addFromCreature = (id: string) => {
        const cr = creatures.find(c => String(c.id) === id);
        if (cr) write([...forms, formFromCreature(cr)]);
    };
    const setHp = (idx: number, f: Form, delta: number) =>
        update(idx, { hp: { ...f.hp, current: Math.max(0, Math.min(f.hp.max, f.hp.current + delta)) } });
    const setMaxHp = (idx: number, f: Form, max: number) =>
        update(idx, { hp: { max, current: Math.min(f.hp.current, max) } });

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Transformations</h3>
                <div className="flex items-center gap-2">
                    <select
                        className="bg-stone-950/40 border border-stone-800 rounded px-1.5 py-1 text-[11px] text-stone-300 outline-none"
                        value=""
                        onChange={e => { if (e.target.value) addFromCreature(e.target.value); e.target.value = ''; }}
                    >
                        <option value="">+ Bestiaire…</option>
                        {creatures.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    <button onClick={addCustom} className="text-stone-500 hover:text-primary-400 text-sm" title="Forme personnalisée">+ Custom</button>
                </div>
            </div>
            {active && (
                <div className="text-[10px] uppercase font-black tracking-[0.2em] text-purple-300 bg-purple-900/20 border border-purple-500/40 rounded-lg px-3 py-1.5">
                    Transformé : {active.name || '(forme)'}
                </div>
            )}
            {forms.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucune forme.</p>}
            {forms.map((f, idx) => (
                <div key={idx} className={`rounded-lg border p-2 space-y-1.5 ${f.active ? 'border-purple-500/40 bg-purple-900/10' : 'border-white/5 bg-stone-950/20'}`}>
                    <div className="flex items-center gap-1.5 text-xs">
                        <button
                            onClick={() => toggle(idx, f)}
                            title={f.active ? 'Active' : 'Inactive'}
                            className={`text-[9px] uppercase font-black px-2 py-1 rounded border transition-all ${f.active ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-stone-950 border-stone-700 text-stone-500 hover:text-white'}`}
                        >{f.active ? 'Active' : 'Off'}</button>
                        <input type="text" className="flex-1 bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-stone-200 font-bold outline-none focus:border-primary-500/40"
                            placeholder="Nom de la forme" value={f.name} onChange={e => update(idx, { name: e.target.value })} />
                        <button onClick={() => remove(idx)} className="text-stone-600 hover:text-red-400" title="Retirer">✕</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="flex items-center gap-1">
                            <span className="text-stone-500 uppercase font-bold">PV</span>
                            <button onClick={() => setHp(idx, f, -1)} className="text-stone-500 hover:text-red-400 w-4 text-center">−</button>
                            <span className="font-mono font-bold text-green-400">{f.hp.current}/</span>
                            <input type="number" className="w-9 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                value={f.hp.max} onChange={e => setMaxHp(idx, f, Math.max(0, parseInt(e.target.value) || 0))} />
                            <button onClick={() => setHp(idx, f, 1)} className="text-stone-500 hover:text-green-400 w-4 text-center">+</button>
                        </span>
                        <label className="flex items-center gap-1"><span className="text-stone-500 uppercase font-bold">DEF</span>
                            <input type="number" className="w-10 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                value={f.def} onChange={e => update(idx, { def: parseInt(e.target.value) || 0 })} /></label>
                        <label className="flex items-center gap-1"><span className="text-stone-500 uppercase font-bold">Init</span>
                            <input type="number" className="w-10 bg-stone-950/40 border border-stone-800 rounded px-1 py-0.5 text-center text-stone-300 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                value={f.init} onChange={e => update(idx, { init: parseInt(e.target.value) || 0 })} /></label>
                    </div>
                </div>
            ))}
        </div>
    );
};
