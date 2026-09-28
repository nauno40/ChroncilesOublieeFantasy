import React, { useState } from 'react';
import { ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import type { Character } from '../../../types/character';
import type { Stats } from '../../../domain/rules';
import type { RaceList, ProfileList } from '../types';

interface Props {
    character: Partial<Character>;
    races: RaceList;
    profiles: ProfileList;
    finalStats: Stats;
    maxHp: number;
    combatStats: { init: number; def: number };
    luckPoints: number;
    manaPoints: number;
    spentPoints: number;
    maxStartingPoints: number;
}

const iriOf = (v: unknown): string => (typeof v === 'string' ? v : (v as { '@id'?: string })?.['@id'] || '');

const CARAC_ORDER: (keyof Stats)[] = ['AGI', 'CON', 'FOR', 'PER', 'CHA', 'INT', 'VOL'];

/**
 * Mini-fiche de personnage en direct, visible pendant tout l'assistant (distincte de
 * l'étape Résumé finale, qui est en pleine page). Lecture seule : aucun éditeur ici.
 */
export const WizardSummaryDrawer: React.FC<Props> = ({
    character, races, profiles, finalStats, maxHp, combatStats, luckPoints, manaPoints, spentPoints, maxStartingPoints,
}) => {
    const [open, setOpen] = useState(false);

    const raceName = races.find(r => r['@id'] === iriOf(character.race))?.name;
    const profileName = profiles.find(p => p['@id'] === iriOf(character.profile))?.name;

    const content = (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-4 lg:gap-3">
            <div className="lg:pb-3 lg:border-b lg:border-white/5 col-span-2 sm:col-span-4 lg:col-span-1">
                <div className="font-display font-bold text-lg text-white leading-tight">{character.name || 'Sans nom'}</div>
                <div className="text-xs text-stone-400 mt-0.5">
                    {[raceName, profileName].filter(Boolean).join(' · ') || 'Race et profil à choisir'}
                    {character.level != null && character.level > 0 ? ` · Niv. ${character.level}` : ''}
                </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {CARAC_ORDER.map(k => (
                    <span key={k} className="text-[11px] font-mono bg-stone-900/50 border border-white/5 rounded px-1.5 py-0.5 text-stone-300">
                        {k} <b className="text-primary-300">{finalStats[k] >= 0 ? `+${finalStats[k]}` : finalStats[k]}</b>
                    </span>
                ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
                <span className="text-[11px] font-mono bg-stone-900/50 border border-white/5 rounded px-1.5 py-0.5 text-stone-300">DEF <b className="text-primary-300">{combatStats.def}</b></span>
                <span className="text-[11px] font-mono bg-stone-900/50 border border-white/5 rounded px-1.5 py-0.5 text-stone-300">INIT <b className="text-primary-300">{combatStats.init}</b></span>
                <span className="text-[11px] font-mono bg-stone-900/50 border border-white/5 rounded px-1.5 py-0.5 text-stone-300">PV <b className="text-primary-300">{maxHp}</b></span>
                {manaPoints > 0 && <span className="text-[11px] font-mono bg-stone-900/50 border border-white/5 rounded px-1.5 py-0.5 text-stone-300">PM <b className="text-primary-300">{manaPoints}</b></span>}
                <span className="text-[11px] font-mono bg-stone-900/50 border border-white/5 rounded px-1.5 py-0.5 text-stone-300">PC <b className="text-primary-300">{luckPoints}</b></span>
            </div>

            <div className="text-[11px] text-stone-400">
                Points de voies : <b className={clsx(spentPoints > maxStartingPoints ? 'text-red-400' : 'text-stone-200')}>{spentPoints}</b> / {maxStartingPoints}
            </div>
        </div>
    );

    return (
        <div className="glass-panel rounded-xl border border-white/10 p-4">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 lg:hidden text-left"
            >
                <span className="flex items-center gap-2 text-primary-400 font-display font-bold uppercase text-xs tracking-wider">
                    <ScrollText size={16} /> Votre personnage
                </span>
                {open ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
            </button>
            <div className="hidden lg:flex items-center gap-2 text-primary-400 font-display font-bold uppercase text-xs tracking-wider mb-3">
                <ScrollText size={16} /> Votre personnage
            </div>
            <div className={clsx('mt-3 lg:mt-0', open ? 'block' : 'hidden lg:block')}>{content}</div>
        </div>
    );
};
