import React, { useState } from 'react';
import type { Character } from '../../types/character';
import { shortRestHeal, applyShortRest, applyLongRest, soinRecuperationComplete } from '../../domain/rules';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    maxHp: number;
    maxMana: number;
    recovery: { total: number; sides: number };
}

/**
 * Actions de repos COF2 — aide de table.
 *
 * **Récupération rapide** (30 min) : dépense 1 DR, restaure [1 DR + ½ niveau] PV.
 *
 * **Récupération complète** (8 h) : rend UN dé de récupération, pas tous, et ne restaure
 * aucun PV — sauf si le personnage choisit de dépenser aussitôt ce dé, auquel cas il
 * récupère automatiquement la valeur MAXIMALE du dé. Les PM, eux, reviennent en entier.
 * Ce panneau remettait auparavant les PV et les DR au maximum, ce qui est la règle du
 * repos long de d20 et efface l'usure d'une expédition.
 *
 * Ne touche pas les PC : ils ne reviennent qu'au passage de niveau.
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
    const longRest = (depenserLeDR: boolean) => {
        if (!character.playState) return;
        // Le personnage sans aucun dé de récupération (CON ‑2) ne bénéficie pas du maximum
        // et doit lancer le dé : c'est le seul cas où un jet intervient ici.
        const soin = depenserLeDR ? soinRecuperationComplete(recovery.sides, recovery.total > 0) : 0;
        setCharacter(prev => ({ ...prev, playState: applyLongRest(prev.playState!, { maxHp, maxMana, soin }) }));
        setLast(depenserLeDR
            ? `Récupération complète : +1 DR aussitôt dépensé, +${soin} PV, PM au max.`
            : 'Récupération complète : +1 DR conservé, PM au max, usages réinitialisés.');
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-stone-900/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-stone-400 font-display font-bold uppercase text-[11px] tracking-[0.2em]">Repos</h3>
                <span className="text-[11px] font-mono text-stone-400">DR : {drLeft} / {recovery.total}</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={shortRest}
                    disabled={drLeft <= 0}
                    className="flex-1 text-[11px] uppercase font-bold px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-green-500/50 hover:text-green-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >Récup. rapide</button>
                <button
                    onClick={() => longRest(false)}
                    title="8 h : +1 DR, PM au max. Les PV ne reviennent qu'en dépensant le dé."
                    className="flex-1 text-[11px] uppercase font-bold px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-primary-500/50 hover:text-primary-300 transition-all"
                >Récup. complète</button>
                <button
                    onClick={() => longRest(true)}
                    disabled={recovery.sides <= 0}
                    title="La même, en dépensant aussitôt le dé regagné : PV restaurés au maximum du dé."
                    className="flex-1 text-[11px] uppercase font-bold px-3 py-2 rounded border border-stone-700 text-stone-300 hover:border-green-500/50 hover:text-green-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >… et soigner</button>
            </div>
            {last && <div className="text-[11px] text-stone-400 italic">{last}</div>}
        </div>
    );
};
