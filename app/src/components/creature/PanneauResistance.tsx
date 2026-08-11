import React, { useState } from 'react';
import type { Combatant } from '../../types/campaign';
import { lancerTest, DIFFICULTES } from '../../domain/rules/test';

/** Ordre du profil de créature du livre — le même que sur la fiche. */
const CARACS = ['AGI', 'CON', 'FOR', 'PER', 'CHA', 'INT', 'VOL'];

/**
 * Jet de résistance d'une cible à une capacité, au moment où on la lui applique.
 *
 * Le bonus de rendement décroissant était ANNONCÉ sur la ligne de la cible, mais le jet se
 * faisait au lanceur de dés, où le MJ reportait le chiffre à la main. Ici, il est déjà
 * là — l'application sait combien de fois cette capacité a été subie.
 *
 * Ce qu'elle ne sait pas, elle le demande : QUELLE caractéristique s'oppose, et à quelle
 * difficulté — cela dépend de la capacité, et le livre ne le déduit de rien. Mais une fois la
 * caractéristique nommée, sa VALEUR n'est plus à saisir : le combattant porte son profil.
 * Et si elle est supérieure, le dé bonus part avec (Opposition : « un dé bonus à tous les
 * tests de cette caractéristique ») — c'est justement un test, pas une attaque.
 */
interface Props {
    etat: string;
    capacite: string;
    combattants: Combatant[];
    /** Bonus déjà acquis par une cible contre cette capacité (rendement décroissant). */
    bonusPour: (cibleId: string) => number;
    /** Applique l'état à la cible — appelé seulement si elle échoue à résister. */
    onPoser: (cibleId: string) => void;
    /** Enregistre la tentative, qu'elle réussisse ou non : la cible s'y accoutume. */
    onTentative: (cibleId: string) => void;
    onAnnuler: () => void;
}

export const PanneauResistance: React.FC<Props> = ({
    etat, capacite, combattants, bonusPour, onPoser, onTentative, onAnnuler,
}) => {
    const [cibleId, setCibleId] = useState('');
    const [nomCarac, setNomCarac] = useState('');
    const [caracSaisie, setCaracSaisie] = useState(0);
    const [difficulte, setDifficulte] = useState(10);
    const [resultat, setResultat] = useState<string | null>(null);

    const cible = combattants.find(c => c.id === cibleId);
    const bonus = cible ? bonusPour(cible.id) : 0;
    // Un combattant ajouté à la main n'a pas de profil : la valeur reste saisie pour lui.
    const profil = cible?.caracs;
    const carac = profil && nomCarac ? profil[nomCarac] ?? 0 : caracSaisie;
    const superieure = !!nomCarac && (cible?.caracsSuperieures ?? []).includes(nomCarac);

    const jeter = () => {
        if (!cible) return;
        const jet = lancerTest({ carac, modificateur: bonus, difficulte, deBonus: superieure ? 1 : 0 });
        onTentative(cible.id);
        if (!jet.reussi) onPoser(cible.id);
        setResultat(
            `${cible.name} : ${nomCarac ? `${nomCarac} ` : ''}(${jet.conserve})`
            + `${carac ? (carac > 0 ? `+${carac}` : carac) : ''}`
            + `${superieure ? ' [dé bonus]' : ''}`
            + `${bonus ? ` +${bonus} rendement` : ''} = ${jet.total} contre ${difficulte}`
            + ` — ${jet.reussi ? 'résiste' : `subit « ${etat} »`}`,
        );
    };

    return (
        <div className="mb-3 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
            <div className="text-xs text-purple-200">
                Appliquer « {etat} »{capacite ? ` (${capacite})` : ''} à quel combattant ?
            </div>

            <div className="flex flex-wrap gap-2">
                {combattants.map(c => (
                    <button
                        key={c.id}
                        type="button"
                        // Choisir une cible remet la caractéristique à zéro : garder « FOR »
                        // d'une cible sur l'autre afficherait la valeur de la nouvelle sous
                        // le nom choisi pour l'ancienne.
                        onClick={() => { setCibleId(c.id); setNomCarac(''); setResultat(null); }}
                        className={`text-[11px] px-2 py-1 rounded border transition-colors ${cibleId === c.id
                            ? 'bg-purple-500/20 text-purple-100 border-purple-400/60'
                            : 'bg-black/40 text-stone-200 border-white/10 hover:border-purple-400/50'}`}
                    >
                        {c.name}
                        {bonusPour(c.id) > 0 && <span className="text-purple-300"> +{bonusPour(c.id)}</span>}
                    </button>
                ))}
                <button type="button" onClick={onAnnuler}
                    className="text-[11px] px-2 py-1 rounded text-stone-400 hover:text-white">
                    Annuler
                </button>
            </div>

            {cible && (
                <div className="flex flex-wrap items-end gap-2 pt-1 border-t border-purple-500/20">
                    <label className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-stone-400">Carac. de {cible.name}</span>
                        {profil ? (
                            <select
                                aria-label={`Caractéristique de résistance de ${cible.name}`}
                                value={nomCarac}
                                onChange={e => setNomCarac(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs focus:outline-none focus:border-purple-400/60"
                            >
                                <option value="">—</option>
                                {CARACS.filter(k => k in profil).map(k => (
                                    <option key={k} value={k}>
                                        {k} {profil[k] >= 0 ? `+${profil[k]}` : profil[k]}
                                        {(cible.caracsSuperieures ?? []).includes(k) ? ' *' : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="number"
                                aria-label={`Caractéristique de résistance de ${cible.name}`}
                                value={caracSaisie}
                                onChange={e => setCaracSaisie(parseInt(e.target.value) || 0)}
                                className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs font-mono focus:outline-none focus:border-purple-400/60"
                            />
                        )}
                    </label>
                    <label className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-stone-400">Difficulté</span>
                        <select
                            aria-label="Difficulté du test de résistance"
                            value={difficulte}
                            onChange={e => setDifficulte(parseInt(e.target.value))}
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-stone-200 text-xs focus:outline-none focus:border-purple-400/60"
                        >
                            {DIFFICULTES.map(d => <option key={d.valeur} value={d.valeur}>{d.label} ({d.valeur})</option>)}
                        </select>
                    </label>
                    {superieure && (
                        <span className="text-[11px] text-primary-300 pb-1" title="Caractéristique supérieure : un dé bonus à tous ses tests, sauf les tests d’attaque">
                            {nomCarac} supérieure — dé bonus
                        </span>
                    )}
                    {bonus > 0 && (
                        <span className="text-[11px] text-purple-200/90 pb-1">
                            +{bonus} acquis contre « {capacite} »
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={jeter}
                        className="px-3 py-1 rounded bg-purple-700/70 hover:bg-purple-600/80 text-purple-50 font-bold text-[11px] uppercase tracking-wider transition-colors"
                    >
                        Jet de résistance
                    </button>
                    <button
                        type="button"
                        onClick={() => { onTentative(cible.id); onPoser(cible.id); onAnnuler(); }}
                        title="Appliquer l'état sans jet — la cible ne résiste pas"
                        className="px-3 py-1 rounded border border-white/10 text-stone-300 hover:border-purple-400/50 text-[11px] uppercase tracking-wider transition-colors"
                    >
                        Appliquer sans jet
                    </button>
                </div>
            )}

            {resultat && <p className="text-[11px] text-purple-100 font-mono">{resultat}</p>}
        </div>
    );
};
