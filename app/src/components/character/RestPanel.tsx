import React, { useState } from 'react';
import type { Character } from '../../types/character';
import { shortRestHeal, applyShortRest, applyLongRest } from '../../domain/rules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    maxHp: number;
    maxMana: number;
    recovery: { total: number; sides: number };
}

/**
 * Actions de repos COF2 (§4.3) — aide de table. Repos court : dépense 1 DR, soigne
 * (dé + ½ niveau) plafonné ; repos long : PV/PM au max, DR régénérés. Réinitialise les
 * usages (via applyShortRest/applyLongRest). Ne touche pas les PC.
 */
export const RestPanel: React.FC<Props> = ({ character, setCharacter, maxHp, maxMana, recovery }) => {
    const [last, setLast] = useState<string | null>(null);
    const used = character.playState?.recovery?.used ?? 0;
    const drLeft = Math.max(0, recovery.total - used);
    const level = character.level ?? 0;

    const shortRest = () => {
        if (!character.playState) return;
        if (drLeft <= 0 || recovery.sides <= 0) { setLast('Aucun dé de récupération disponible.'); return; }
        const roll = Math.floor(Math.random() * recovery.sides) + 1;
        const heal = shortRestHeal(roll, level);
        setCharacter(prev => ({ ...prev, playState: applyShortRest(prev.playState!, { heal, maxHp, drTotal: recovery.total }) }));
        setLast(`Repos court : +${heal} PV (d${recovery.sides} : ${roll}), 1 DR dépensé.`);
    };
    const longRest = () => {
        if (!character.playState) return;
        setCharacter(prev => ({ ...prev, playState: applyLongRest(prev.playState!, { maxHp, maxMana }) }));
        setLast('Repos long : PV & PM au max, DR régénérés, usages réinitialisés.');
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Repos</h3>
                <span className="text-[10px] font-mono text-stone-400">DR : {drLeft} / {recovery.total}</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={shortRest}
                    disabled={drLeft <= 0}
                    className="flex-1 text-[10px] uppercase font-bold px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-green-500/50 hover:text-green-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >Repos court</button>
                <button
                    onClick={longRest}
                    className="flex-1 text-[10px] uppercase font-bold px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-primary-500/50 hover:text-primary-300 transition-all"
                >Repos long</button>
            </div>
            {last && <div className="text-[11px] text-stone-400 italic">{last}</div>}
        </div>
    );
};
