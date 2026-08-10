import React from 'react';
import { ShieldAlert, Sparkles } from 'lucide-react';
import type { ProfileArmorImpact } from '../../domain/rules';

interface Props {
    impacts: ProfileArmorImpact[];
    armorName?: string;
    /** Malus d'encombrement (COF2) : la DEF de l'armure s'ajoute à la difficulté des tests d'AGI. */
    malusEncombrement?: number;
    /** Plafond d'AGI de l'armure, quand il bride réellement la valeur du personnage. */
    agiPlafonnee?: { agi: number; plafond: number };
}

/**
 * Ce que l'armure portée change à la table (COF2 chap. 9) : les capacités qu'elle bride et
 * le surcoût en PM des sorts. N'apparaît que si quelque chose est réellement touché — un
 * personnage mono-profil dans son armure habituelle ne voit jamais ce panneau.
 */
export const ArmorImpactPanel: React.FC<Props> = ({ impacts, armorName, malusEncombrement = 0, agiPlafonnee }) => {
    // L'encombrement touche TOUT porteur d'armure, quel que soit son profil : le panneau
    // s'affiche donc aussi quand aucune capacité n'est bridée.
    if (impacts.length === 0 && malusEncombrement === 0 && !agiPlafonnee) return null;

    return (
        <div className="glass-panel p-4 rounded-2xl border-amber-500/20 bg-amber-950/10 space-y-3">
            <h3 className="text-amber-300/80 font-display font-bold uppercase text-[11px] tracking-[0.2em] flex items-center gap-2">
                <ShieldAlert size={14} />
                Sous l’armure{armorName ? ` — ${armorName}` : ''}
            </h3>

            {(malusEncombrement > 0 || agiPlafonnee) && (
                <div className="space-y-1 border-b border-amber-500/10 pb-2 last:border-b-0">
                    {malusEncombrement > 0 && (
                        <p className="text-[11px] text-stone-300 leading-snug">
                            Encombrement :{' '}
                            <span className="text-amber-200 font-mono font-bold">+{malusEncombrement}</span>
                            <span className="text-stone-400"> à la difficulté de tous les tests d’AGI</span>
                        </p>
                    )}
                    {agiPlafonnee && (
                        <p className="text-[11px] text-stone-300 leading-snug">
                            AGI plafonnée :{' '}
                            <span className="text-amber-200 font-mono font-bold">
                                {agiPlafonnee.agi > 0 ? '+' : ''}{agiPlafonnee.agi} → {agiPlafonnee.plafond > 0 ? '+' : ''}{agiPlafonnee.plafond}
                            </span>
                            <span className="text-stone-400"> tant que cette armure est portée</span>
                        </p>
                    )}
                </div>
            )}

            {impacts.map(impact => (
                <div key={impact.profileName} className="space-y-1.5 border-t border-amber-500/10 pt-2 first:border-t-0 first:pt-0">
                    <p className="text-[11px] text-stone-300">
                        <strong className="text-amber-200">{impact.profileName}</strong>
                        <span className="text-stone-400">
                            {' '}— armure autorisée {impact.allowedDef === 0 ? 'aucune' : `DEF +${impact.allowedDef}`}
                        </span>
                    </p>

                    {impact.blocked.length > 0 && (
                        <p className="text-[11px] text-stone-400 leading-snug">
                            Inutilisable tant que l’armure est portée :{' '}
                            <span className="text-stone-200">{impact.blocked.join(', ')}</span>
                        </p>
                    )}

                    {impact.spells.length > 0 && (
                        <ul className="space-y-0.5">
                            {impact.spells.map(spell => (
                                <li key={spell.name} className="text-[11px] text-stone-400 flex items-center gap-1.5">
                                    <Sparkles size={11} className="text-primary-400/70 shrink-0" />
                                    <span className="text-stone-200">{spell.name}</span>
                                    <span className="font-mono">
                                        {spell.base} + {impact.surcharge} = <strong className="text-primary-300">{spell.total} PM</strong>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}

            <p className="text-[11px] text-stone-400 italic leading-snug">
                Lancer un sort en armure trop lourde exige aussi de maîtriser cette armure.
            </p>
        </div>
    );
};
