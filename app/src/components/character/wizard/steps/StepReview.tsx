import React from 'react';
import type { Character } from '../../../../types/character';
import type { RaceList, ProfileList } from '../../types';
import type { Stats } from '../../../../domain/rules';
import { WizardShellLayout } from '../WizardShellLayout';

interface Props {
    character: Partial<Character>;
    races: RaceList;
    profiles: ProfileList;
    finalStats: Stats;
    maxHp: number;
    combatStats: { init: number; def: number };
    luckPoints: number;
    manaPoints: number;
    recoveryDieString: string;
    damageReduction: number;
    onBack: () => void;
    onSave: () => void;
    saving: boolean;
}

const iriOf = (v: unknown): string => (typeof v === 'string' ? v : (v as { '@id'?: string })?.['@id'] || '');
const CARAC_ORDER: (keyof Stats)[] = ['AGI', 'CON', 'FOR', 'PER', 'CHA', 'INT', 'VOL'];

/**
 * Étape finale : résumé en lecture seule (aucun éditeur — contrairement à
 * `MainStatsPanel`, qui embarque les jauges de PV/PC courants pertinentes en jeu, pas en
 * création) puis sauvegarde via `handleSave`, inchangé.
 */
export const StepReview: React.FC<Props> = ({
    character, races, profiles, finalStats, maxHp, combatStats, luckPoints, manaPoints,
    recoveryDieString, damageReduction, onBack, onSave, saving,
}) => {
    const raceName = races.find(r => r['@id'] === iriOf(character.race))?.name;
    const profileName = profiles.find(p => p['@id'] === iriOf(character.profile))?.name;

    return (
        <WizardShellLayout onBack={onBack} onNext={onSave} nextLabel="Créer le héros" nextLoading={saving}>
            <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6">
                <div>
                    <h2 className="font-display text-3xl text-stone-200">{character.name || 'Sans nom'}</h2>
                    <p className="text-stone-400 text-sm mt-1">
                        {[raceName, profileName].filter(Boolean).join(' · ') || 'Race et profil non choisis'}
                    </p>
                </div>

                <div>
                    <h3 className="text-xs uppercase font-bold text-stone-400 tracking-widest mb-2">Caractéristiques</h3>
                    <div className="flex flex-wrap gap-2">
                        {CARAC_ORDER.map(k => (
                            <span key={k} className="px-3 py-1.5 rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-100 font-mono text-sm">
                                {k} <b>{finalStats[k] >= 0 ? `+${finalStats[k]}` : finalStats[k]}</b>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xs uppercase font-bold text-stone-400 tracking-widest mb-2">Combat</h3>
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 rounded-lg bg-stone-900/60 border border-white/10 text-stone-200 font-mono text-sm">DEF <b className="text-primary-300">{combatStats.def}</b></span>
                        <span className="px-3 py-1.5 rounded-lg bg-stone-900/60 border border-white/10 text-stone-200 font-mono text-sm">Init. <b className="text-primary-300">{combatStats.init}</b></span>
                        <span className="px-3 py-1.5 rounded-lg bg-stone-900/60 border border-white/10 text-stone-200 font-mono text-sm">PV <b className="text-primary-300">{maxHp}</b></span>
                        {damageReduction > 0 && <span className="px-3 py-1.5 rounded-lg bg-stone-900/60 border border-white/10 text-stone-200 font-mono text-sm">RD <b className="text-primary-300">{damageReduction}</b></span>}
                        {manaPoints > 0 && <span className="px-3 py-1.5 rounded-lg bg-stone-900/60 border border-white/10 text-stone-200 font-mono text-sm">PM <b className="text-primary-300">{manaPoints}</b></span>}
                        <span className="px-3 py-1.5 rounded-lg bg-stone-900/60 border border-white/10 text-stone-200 font-mono text-sm">PC <b className="text-primary-300">{luckPoints}</b></span>
                        <span className="px-3 py-1.5 rounded-lg bg-stone-900/60 border border-white/10 text-stone-200 font-mono text-sm">Récup. <b className="text-primary-300">{recoveryDieString}</b></span>
                    </div>
                </div>

                <p className="text-stone-400 text-xs italic">
                    Toutes les valeurs pourront être ajustées ensuite depuis la fiche du personnage.
                </p>
            </div>
        </WizardShellLayout>
    );
};
