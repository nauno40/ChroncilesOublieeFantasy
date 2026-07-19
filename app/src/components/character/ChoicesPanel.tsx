import React from 'react';
import type { Character } from '../../types/character';
import { capabilityChoiceKey, capabilityChoiceHelp } from '../../utils/cofRules';
import type { RaceList, ProfileList, AllVoieList } from './types';

interface CompendiumCap { rank?: number; name?: string; details?: Record<string, unknown>; effect?: { choiceOptions?: { label: string }[] } }
interface CompendiumVoieLite { name?: string; capabilities?: CompendiumCap[] }

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    races: RaceList;
    profiles: ProfileList;
    allVoies: AllVoieList;
}

/**
 * Capacités à choix (COF2 §7 #6, tranche minimale) : pour chaque capacité acquise offrant
 * une option (`details.options_*`/`choix_*`), le joueur enregistre son choix (texte libre)
 * dans `characterVoies[].choices[<rang>]`. Piloté joueur ; pas de résolution add/remplacement.
 */
export const ChoicesPanel: React.FC<Props> = ({ character, setCharacter, races, profiles, allVoies }) => {
    const byIri = new Map<string, CompendiumVoieLite>();
    for (const r of races) for (const v of (r.availableVoies || [])) if (v?.['@id']) byIri.set(v['@id'], v);
    for (const p of profiles) for (const v of (p.voies || [])) if (v?.['@id']) byIri.set(v['@id'], v);
    for (const v of allVoies) if (v?.['@id']) byIri.set(v['@id'], v);

    const voies = character.characterVoies ?? [];
    const rows: { idx: number; rank: number; voieName: string; capName: string; help?: string; value: string; options?: string[] }[] = [];
    voies.forEach((entry, idx) => {
        const v = byIri.get(entry.voie);
        if (!v) return;
        for (let rank = 1; rank <= entry.rank; rank++) {
            const cap = (v.capabilities || []).find(c => c.rank === rank);
            const key = cap ? capabilityChoiceKey(cap.details) : undefined;
            const hasStructured = (cap?.effect?.choiceOptions?.length ?? 0) > 0;
            if (cap && (key || hasStructured)) {
                rows.push({
                    idx, rank, voieName: v.name || '', capName: cap.name || '',
                    help: key ? capabilityChoiceHelp(cap.details?.[key]) : undefined,
                    value: String(entry.choices?.[String(rank)] ?? ''),
                    options: cap.effect?.choiceOptions?.map(o => o.label),
                });
            }
        }
    });

    const setChoice = (idx: number, rank: number, value: string) =>
        setCharacter(prev => {
            const cv = [...(prev.characterVoies || [])];
            const e = cv[idx];
            if (!e) return prev;
            cv[idx] = { ...e, choices: { ...(e.choices || {}), [String(rank)]: value } };
            return { ...prev, characterVoies: cv };
        });

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] border-b border-white/5 pb-2">Capacités à choix</h3>
            {rows.length === 0 && <p className="text-[11px] text-stone-600 italic">Aucune capacité à choix.</p>}
            {rows.map(row => (
                <div key={`${row.idx}-${row.rank}`} className="space-y-1">
                    <label className="text-[11px] text-stone-300 font-bold">
                        {row.capName}
                        <span className="text-stone-600 font-normal"> — {row.voieName}</span>
                    </label>
                    {row.help && <p className="text-[10px] text-stone-500 italic leading-snug">{row.help}</p>}
                    {row.options && row.options.length > 0 ? (
                        <select
                            className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                            value={row.value}
                            onChange={e => setChoice(row.idx, row.rank, e.target.value)}
                        >
                            <option value="">— choisir —</option>
                            {row.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : (
                        <input
                            type="text"
                            className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                            placeholder="Votre choix…"
                            value={row.value}
                            onChange={e => setChoice(row.idx, row.rank, e.target.value)}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
