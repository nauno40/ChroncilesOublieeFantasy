import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import type { CustomCreatureCapability, HarmfulState } from '../../types/normalized';
import { etatsDeclares, lienEtat, resoudreInvocation, type SourcesInvocation } from '../../domain/capabilityRefs';

/**
 * États et invocations déclarés par une capacité — LE rendu de ces références, partagé par
 * la fiche de créature et le suivi de combat. Deux rendus parallèles divergeraient : ce
 * dépôt l'a déjà payé trois fois sur les cartes de capacité.
 *
 * Sans `onEtat`, un état est un lien vers la liste des états (lecture au compendium) ; avec,
 * c'est un bouton qui remonte le nom canonique à l'appelant (pose sur un combattant).
 * Rien n'est rendu quand la capacité ne déclare rien de résoluble.
 */
export const CapabilityRefs: React.FC<{
    capacite: CustomCreatureCapability;
    etatsConnus: HarmfulState[];
    sources: SourcesInvocation;
    onEtat?: (etat: string) => void;
}> = ({ capacite, etatsConnus, sources, onEtat }) => {
    const etats = etatsDeclares(capacite, etatsConnus);
    const invocations = (capacite.summons ?? [])
        .map(s => ({ invocation: s, resolue: resoudreInvocation(s, sources) }))
        .filter((x): x is { invocation: typeof x.invocation; resolue: NonNullable<typeof x.resolue> } => x.resolue !== undefined);

    if (etats.length === 0 && invocations.length === 0) return null;

    const styleEtat = 'inline-flex items-center gap-1 text-[11px] uppercase tracking-wide bg-purple-900/40 text-purple-200 px-2 py-0.5 rounded border border-purple-500/30 hover:bg-purple-800/50 transition-colors';

    return (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {etats.map(etat => (onEtat ? (
                <button key={etat} type="button" onClick={() => onEtat(etat)} className={styleEtat}>
                    <Zap size={10} /> {etat}
                </button>
            ) : (
                <Link key={etat} to={lienEtat(etat)} className={styleEtat}>
                    <Zap size={10} /> {etat}
                </Link>
            )))}

            {invocations.map(({ invocation, resolue }, i) => (
                <Link
                    key={`${invocation.ref}-${i}`}
                    to={resolue.lien}
                    className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide bg-primary-950/40 text-primary-200 px-2 py-0.5 rounded border border-primary-500/30 hover:bg-primary-900/50 transition-colors"
                >
                    <Sparkles size={10} />
                    {resolue.type === 'creature' ? resolue.creature.name : resolue.nom}
                    {(invocation.quantity ?? 1) > 1 && ` ×${invocation.quantity}`}
                </Link>
            ))}
        </div>
    );
};
