import React, { useState } from 'react';
import { CapabilityRefs } from './CapabilityRefs';
import { resoudreInvocation, type SourcesInvocation } from '../../domain/capabilityRefs';
import type {
    CustomCreatureCapability, HarmfulState, Creature, CustomCreature,
} from '../../types/normalized';

/**
 * Capacités d'un combattant au suivi de combat, repliées par défaut : la page sert sous
 * pression, elle ne doit pas s'allonger d'office.
 *
 * Le composant ne pose rien lui-même — il remonte l'intention (`onPoserEtat`, `onInvoquer`)
 * et laisse le suivi de combat décider de la cible. Séparé de `CombatTracker` pour être
 * testable sans simuler l'amorçage complet de la page.
 */
export const CombatantCapabilities: React.FC<{
    capacites: CustomCreatureCapability[];
    etatsConnus: HarmfulState[];
    sources: SourcesInvocation;
    /** Remonte l'état À POSER et la capacité qui le pose : le rendement décroissant
     *  compte les répétitions d'une capacité, pas celles d'un état. */
    onPoserEtat: (etat: string, capacite: string) => void;
    onInvoquer: (creature: Creature | CustomCreature, quantite: number, refOrigine: string) => void;
}> = ({ capacites, etatsConnus, sources, onPoserEtat, onInvoquer }) => {
    const [ouvert, setOuvert] = useState(false);

    return (
        <div className="mt-2 w-full">
            <button
                type="button"
                onClick={() => setOuvert(o => !o)}
                className="text-[11px] uppercase tracking-wide text-stone-400 hover:text-primary-400 transition-colors"
            >
                Capacités ({capacites.length})
            </button>

            {ouvert && (
                <div className="mt-2 space-y-2">
                    {capacites.map((cap, i) => (
                        <div key={i} className="bg-black/20 rounded-lg border border-white/5 p-2">
                            <div className="flex items-center gap-2">
                                {/* Le rang distingue deux capacités homonymes de voies
                                    différentes ; sans lui, un PJ à trois voies affiche
                                    une liste plate indéchiffrable. */}
                                {cap.rank !== undefined && (
                                    <span className="shrink-0 flex items-center justify-center size-4 rounded bg-primary-950 text-primary-500 text-[11px] font-bold border border-primary-500/20">
                                        {cap.rank}
                                    </span>
                                )}
                                {/* `||` et non `??` : un `label` vide doit céder au nom,
                                    comme le fait la fiche de créature. */}
                                <div className="text-xs font-bold text-primary-300">{cap.label || cap.name}</div>
                                {cap.voieName && (
                                    <span className="text-[11px] text-stone-400 truncate">{cap.voieName}</span>
                                )}
                            </div>
                            {cap.description && (
                                <p className="text-[11px] text-stone-400 leading-relaxed mt-1">{cap.description}</p>
                            )}

                            <CapabilityRefs
                                capacite={cap}
                                etatsConnus={etatsConnus}
                                sources={sources}
                                onEtat={(etat) => onPoserEtat(etat, cap.label ?? cap.name ?? '')}
                            />

                            {/* Seule une créature s'ajoute au combat : un objet n'est pas un
                                combattant, son lien vers sa fiche suffit (cf. CapabilityRefs). */}
                            {(cap.summons ?? []).map((invocation, j) => {
                                const resolue = resoudreInvocation(invocation, sources);
                                if (!resolue || resolue.type !== 'creature') return null;
                                const quantite = invocation.quantity ?? 1;
                                return (
                                    <button
                                        key={`inv-${j}`}
                                        type="button"
                                        onClick={() => onInvoquer(resolue.creature, quantite, invocation.ref)}
                                        className="mt-2 text-[11px] uppercase tracking-wide px-2 py-1 rounded bg-primary-900/40 border border-primary-500/30 text-primary-200 hover:bg-primary-800/50 transition-colors"
                                    >
                                        + Ajouter {resolue.creature.name}{quantite > 1 && ` ×${quantite}`} au combat
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
