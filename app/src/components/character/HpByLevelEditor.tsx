import React from 'react';
import type { Character } from '../../types/character';
import { FAMILY_BASE_HP } from '../../domain/rules';

const FAMILY_LABELS: Record<string, string> = {
    aventuriers: 'Aventuriers', combattants: 'Combattants', mages: 'Mages', mystiques: 'Mystiques',
};
const FAMILIES = ['aventuriers', 'combattants', 'mages', 'mystiques'];

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    /** Famille du profil principal (défaut de chaque niveau). */
    mainFamily?: string;
}

/**
 * Annotation par niveau des familles finançant les PV (profils hybrides, COF2 chap. 9).
 * Discret par défaut : pour un personnage mono-famille toutes les lignes valent le profil
 * principal et rien n'est écrit dans playState.
 */
export const HpByLevelEditor: React.FC<Props> = ({ character, setCharacter, mainFamily }) => {
    const level = character.level ?? 0;
    if (!mainFamily || level < 2) return null;

    const byLevel = character.playState?.hpByLevel ?? {};

    const familiesOf = (L: number): string[] => byLevel[String(L)] ?? [mainFamily];

    const writeLevel = (L: number, fams: string[]) => {
        setCharacter(prev => {
            const next = { ...(prev.playState?.hpByLevel ?? {}) };
            // Retomber sur [profil principal] ⇒ retirer l'entrée (playState minimal).
            if (fams.length === 1 && fams[0] === mainFamily) delete next[String(L)];
            else next[String(L)] = fams;
            return { ...prev, playState: { ...prev.playState!, hpByLevel: next } };
        });
    };

    const setFamily = (L: number, idx: number, fam: string) => {
        const cur = [...familiesOf(L)];
        cur[idx] = fam;
        writeLevel(L, cur);
    };
    const addSecond = (L: number) => writeLevel(L, [...familiesOf(L), mainFamily]);
    const removeSecond = (L: number) => writeLevel(L, [familiesOf(L)[0]]);

    const levelPv = (fams: string[]): number =>
        fams.reduce((s, f) => s + (FAMILY_BASE_HP[f] ?? 0), 0) / fams.length;

    const rows = Array.from({ length: level - 1 }, (_, i) => i + 2); // niveaux 2..level

    return (
        <details className="glass-panel p-3 rounded-xl border-white/5 bg-stone-900/10">
            <summary className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] cursor-pointer">
                PV par niveau (hybride)
            </summary>
            <div className="mt-3 space-y-1.5">
                {rows.map(L => {
                    const fams = familiesOf(L);
                    const pv = levelPv(fams);
                    const isDefault = fams.length === 1 && fams[0] === mainFamily;
                    return (
                        <div key={L} className="flex items-center gap-2 text-xs">
                            <span className="w-12 text-stone-500 font-mono">Niv {L}</span>
                            {fams.map((f, idx) => (
                                <select key={idx}
                                    className={`bg-stone-950/40 border border-stone-800 rounded px-1.5 py-0.5 text-xs ${isDefault ? 'text-stone-500' : 'text-stone-200'}`}
                                    value={f}
                                    onChange={e => setFamily(L, idx, e.target.value)}>
                                    {FAMILIES.map(fam => <option key={fam} value={fam}>{FAMILY_LABELS[fam]}</option>)}
                                </select>
                            ))}
                            {fams.length === 1 ? (
                                <button onClick={() => addSecond(L)} className="text-stone-500 hover:text-primary-400" title="Deuxième famille (niveau mixte)">+</button>
                            ) : (
                                <button onClick={() => removeSecond(L)} className="text-stone-500 hover:text-red-400" title="Retirer la deuxième famille">−</button>
                            )}
                            <span className="ml-auto text-stone-400 font-mono">{Number.isInteger(pv) ? pv : `${pv}`} PV{Number.isInteger(pv) ? '' : ' (½)'}</span>
                        </div>
                    );
                })}
            </div>
        </details>
    );
};
