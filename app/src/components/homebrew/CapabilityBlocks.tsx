import React, { useEffect, useRef } from 'react';
import { AlertCircle, ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { HomebrewFields, inputCls, inputErrCls, labelCls, type ReferencesDeclaration } from './HomebrewFields';
import { HOMEBREW_SCHEMAS } from '../../services/homebrewSchemas';
import type { ChildDraft } from '../../services/homebrewChildren';

const nouvelleCapacite = (): ChildDraft => ({ category: 'capacite', name: '', data: {} });

/** Erreurs d'une capacité (`capacites.2.rank` → `rank`) : le préfixe ne sert qu'à
 *  l'ancre de défilement et au diagnostic du bloc — `HomebrewFields` raisonne sur les
 *  clés nues du schéma `capacite`. */
const erreursEnfant = (errors: Record<string, string>, prefix: string): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(errors)) {
        if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
    }
    return out;
};

/**
 * Section « Capacités » du formulaire de voie : un bloc repliable par capacité, avec
 * ajout, suppression et réordonnancement.
 *
 * L'apparition d'une erreur ouvre le bloc de force, pour qu'aucune cause de refus ne
 * reste cachée dans un repli. Rien ne le referme jamais : l'auteur seul en décide.
 */
export const CapabilityBlocks: React.FC<{
    drafts: ChildDraft[];
    onChange: (d: ChildDraft[]) => void;
    errors: Record<string, string>;
    /** Relayée telle quelle aux champs d'une capacité : sans elle, une capacité saisie
     *  dans une voie n'aurait pas les mêmes champs qu'une capacité autonome. */
    references?: ReferencesDeclaration;
}> = ({ drafts, onChange, errors, references }) => {
    const prefixDe = (i: number) => `capacites.${i}.`;
    const enErreur = (i: number) => Object.keys(errors).some(k => k.startsWith(prefixDe(i)));

    // Les blocs sont laissés libres (`<details>` non contrôlé) : l'auteur les ouvre et
    // les referme à sa guise. On n'intervient qu'au moment précis où une erreur
    // APPARAÎT sur un bloc, pour l'ouvrir de force — jamais pour le refermer. Piloter
    // l'attribut `open` depuis l'erreur refermerait le bloc à l'instant où l'auteur
    // corrige la dernière, en pleine saisie ; et le mémoriser via `onToggle` ne suffit
    // pas, cet événement étant asynchrone.
    const blocs = useRef<(HTMLDetailsElement | null)[]>([]);
    const erreurPrecedente = useRef<Record<number, boolean>>({});
    useEffect(() => {
        drafts.forEach((_, i) => {
            const erreur = enErreur(i);
            if (erreur && !erreurPrecedente.current[i] && blocs.current[i]) {
                blocs.current[i]!.open = true;
            }
            erreurPrecedente.current[i] = erreur;
        });
    });

    const ajouter = () => onChange([...drafts, nouvelleCapacite()]);
    const supprimer = (i: number) => onChange(drafts.filter((_, idx) => idx !== i));
    const deplacer = (i: number, sens: -1 | 1) => {
        const j = i + sens;
        if (j < 0 || j >= drafts.length) return;
        const next = [...drafts];
        [next[i], next[j]] = [next[j], next[i]];
        // Les rangs suivent l'ordre des blocs. Sans ce recalcul, déplacer une capacité
        // n'aurait aucun effet visible : l'aperçu comme la fiche trient par rang, et
        // l'auteur croirait avoir réordonné sa voie sans que rien ne bouge.
        onChange(next.map((d, idx) => ({ ...d, data: { ...d.data, rank: idx + 1 } })));
    };
    const modifier = (i: number, patch: Partial<ChildDraft>) =>
        onChange(drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

    // Un clic sur un bouton d'action du bandeau ne doit pas basculer le bloc — sans
    // `preventDefault`, le comportement natif de `<summary>` toggle au clic quel que
    // soit l'élément cliqué à l'intérieur.
    const sansToggle = (fn: () => void) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
    };

    return (
        <div className="border-t border-white/5 pt-4 space-y-3">
            <p className="text-[11px] uppercase font-bold tracking-wider text-primary-400/70">Capacités</p>

            {drafts.map((draft, i) => {
                const prefix = prefixDe(i);
                const erreurNom = errors[`${prefix}name`];
                const blocEnErreur = enErreur(i);
                return (
                    <details
                        key={i}
                        ref={el => { blocs.current[i] = el; }}
                        className={`group rounded-xl border overflow-hidden ${blocEnErreur ? 'border-red-500/50' : 'border-white/10'}`}
                    >
                        <summary className="cursor-pointer list-none select-none flex items-center justify-between gap-2 px-3 py-2 bg-stone-950/40">
                            <span className="flex items-center gap-2 text-sm font-bold text-stone-200 min-w-0">
                                <ChevronRight size={14} className="shrink-0 text-primary-500/60 transition-transform duration-200 group-open:rotate-90" />
                                <span className="truncate">Capacité {i + 1}{draft.name ? ` — ${draft.name}` : ''}</span>
                                {blocEnErreur && <AlertCircle size={14} className="shrink-0 text-red-400" aria-label="Erreur dans cette capacité" />}
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                                <button type="button" onClick={sansToggle(() => deplacer(i, -1))} disabled={i === 0} className="p-1 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:text-stone-400" aria-label="Monter la capacité">
                                    <ArrowUp size={14} />
                                </button>
                                <button type="button" onClick={sansToggle(() => deplacer(i, 1))} disabled={i === drafts.length - 1} className="p-1 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:text-stone-400" aria-label="Descendre la capacité">
                                    <ArrowDown size={14} />
                                </button>
                                <button type="button" onClick={sansToggle(() => supprimer(i))} className="p-1 text-stone-400 hover:text-red-400" aria-label="Supprimer la capacité">
                                    <Trash2 size={14} />
                                </button>
                            </span>
                        </summary>

                        <div className="px-3 pb-3 pt-3 space-y-3 border-t border-white/5">
                            <div id={`champ-${prefix}name`}>
                                <label className={labelCls}>Nom</label>
                                <input
                                    value={draft.name}
                                    onChange={e => modifier(i, { name: e.target.value })}
                                    placeholder="Nom de la capacité"
                                    maxLength={255}
                                    className={erreurNom ? inputErrCls : inputCls}
                                />
                                {erreurNom && <p className="text-red-400 text-xs mt-1">{erreurNom}</p>}
                            </div>

                            <HomebrewFields
                                schema={HOMEBREW_SCHEMAS.capacite}
                                data={draft.data}
                                onChange={d => modifier(i, { data: d })}
                                errors={erreursEnfant(errors, prefix)}
                                prefix={prefix}
                                references={references}
                            />
                        </div>
                    </details>
                );
            })}

            <button
                type="button"
                onClick={ajouter}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary-400 hover:text-primary-300"
            >
                <Plus size={14} /> Ajouter une capacité
            </button>
        </div>
    );
};
