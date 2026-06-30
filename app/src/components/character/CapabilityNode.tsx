import React from 'react';
import { Tooltip } from '../common';

interface Cap {
    name: string;
    description: string;
}

interface Props {
    rank: number;
    isActive: boolean;
    /** Whether the next rank is active — drives the connecting-line colour. */
    nextActive: boolean;
    cap: Cap | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    theme: 'primary' | 'amber';
    /** Visual node shape: round (héritage racial) or gem (profil/prestige). */
    shape: 'round' | 'gem';
    /** Optional badge rendered after "Rang N" (e.g. mage free-rank-2 marker). */
    badge?: React.ReactNode;
}

const THEME = {
    primary: {
        line: 'bg-primary-500/30',
        activeLabel: 'bg-primary-950/20 border-primary-500/40 shadow-[0_0_20px_-5px_rgba(234,179,8,0.2)]',
        activeNode: 'bg-gradient-to-br from-primary-400 to-primary-600 border-primary-300 shadow-[0_0_15px_rgba(234,179,8,0.6)]',
        inactiveNode: 'bg-stone-900 border-stone-600 hover:border-primary-500/50',
        rank: 'text-primary-400',
    },
    amber: {
        line: 'bg-amber-500/30',
        activeLabel: 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]',
        activeNode: 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]',
        inactiveNode: 'bg-stone-900 border-stone-600 hover:border-amber-500/50',
        rank: 'text-amber-400',
    },
};

export const CapabilityNode: React.FC<Props> = ({ rank, isActive, nextActive, cap, onChange, theme, shape, badge }) => {
    const t = THEME[theme];
    const shapeClass = shape === 'round' ? 'rounded-full' : 'rounded rotate-45';

    return (
        <div className="relative">
            {/* Connecting Line */}
            {rank < 5 && (
                <div className={`absolute left-[22px] top-10 bottom-0 w-0.5 z-0 transition-colors duration-500 ${isActive && nextActive ? t.line : 'bg-stone-800/30'}`} />
            )}

            <Tooltip content={cap ? { name: cap.name, description: cap.description } : { name: `Rang ${rank}`, description: '' }} theme={theme}>
                <label className={`relative z-10 flex items-start gap-4 p-3 rounded-xl border transition-all duration-300 cursor-pointer ${isActive
                    ? t.activeLabel
                    : 'bg-stone-950/40 border-white/5 hover:bg-stone-900/60 hover:border-white/10'
                    }`}>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={isActive}
                        onChange={onChange}
                    />

                    {/* Custom Checkbox UI */}
                    <div className={`mt-0.5 w-5 h-5 ${shapeClass} border transition-all duration-300 flex items-center justify-center ${isActive
                        ? t.activeNode
                        : t.inactiveNode
                        }`}>
                        {isActive && <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)] animate-pulse" />}
                    </div>

                    <div className="flex flex-col leading-tight pt-0.5">
                        <span className={`font-bold text-[10px] uppercase tracking-[0.1em] ${isActive ? t.rank : 'text-stone-500'}`}>
                            Rang {rank}
                            {badge}
                        </span>
                        {cap && <span className={`font-display text-sm transition-colors duration-300 ${isActive ? 'text-white text-shadow-md' : 'text-stone-400'}`}>{cap.name}</span>}
                    </div>
                </label>
            </Tooltip>
        </div>
    );
};
