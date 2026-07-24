import React from 'react';
import type { Character } from '../../types/character';
import type { ProfileList } from './types';
import type { RacialGrant } from '../../domain/rules';

interface VoieLite { '@id'?: string; name?: string; capabilities?: { rank?: number; name?: string }[] }
interface ProfileLite { name?: string; voies?: VoieLite[] }

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    profiles: ProfileList;
    grant: RacialGrant;
}

/** Capacité octroyée par le peuple (trait `choix_capacite`) : une capacité de rang 1 d'un profil autorisé, gratuite. */
export const RacialGrantPanel: React.FC<Props> = ({ character, setCharacter, profiles, grant }) => {
    const all = grant.allowedProfiles.includes('*');
    const allowed = (profiles as ProfileLite[]).filter(p => all || (!!p.name && grant.allowedProfiles.includes(p.name)));
    const options: { iri: string; label: string }[] = [];
    for (const p of allowed) for (const v of (p.voies ?? [])) if (v['@id']) options.push({ iri: v['@id'], label: `${p.name} — ${v.name}` });

    const current = (character.characterVoies ?? []).find(e => e.source === 'trait');
    const value = current?.voie ?? '';
    const chosenRank = current?.rank ?? 1;
    const chosenVoie = allowed.flatMap(p => p.voies ?? []).find(v => v['@id'] === value);
    const grantedCap = (chosenVoie?.capabilities ?? []).find(c => c.rank === chosenRank)?.name;

    // Écrit/remplace l'entrée trait (voie + rang octroyé). Rang 1 par défaut ; rang 2 possible
    // seulement si le peuple l'autorise (Elfe haut, Humain).
    const setGrant = (iri: string, rank: number) =>
        setCharacter(prev => {
            const cv = (prev.characterVoies ?? []).filter(e => e.source !== 'trait');
            if (iri) cv.push({ voie: iri, rank, source: 'trait' });
            return { ...prev, characterVoies: cv };
        });

    return (
        <div className="glass-panel p-4 rounded-2xl border-white/5 bg-stone-900/10 space-y-2">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Capacité de peuple</h3>
            <p className="text-[10px] text-stone-500 italic leading-snug">
                Une capacité {grant.allowsRank2 ? 'de rang 1 ou 2 ' : 'de rang 1 '}{all ? "de n'importe quel profil" : `de ${grant.allowedProfiles.join(' ou ')}`}, offerte par ton peuple (gratuite).
            </p>
            <select
                className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                value={value}
                onChange={e => setGrant(e.target.value, grant.allowsRank2 ? chosenRank : 1)}
            >
                <option value="">— aucune —</option>
                {options.map(o => <option key={o.iri} value={o.iri}>{o.label}</option>)}
            </select>
            {grant.allowsRank2 && value && (
                <div className="flex items-center gap-2">
                    <label className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">Rang</label>
                    <select
                        className="bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                        value={chosenRank}
                        onChange={e => setGrant(value, Number(e.target.value))}
                    >
                        <option value={1}>Rang 1</option>
                        <option value={2}>Rang 2 (sans armure pour lancer le sort)</option>
                    </select>
                </div>
            )}
            {grantedCap && <p className="text-[10px] text-stone-400">Capacité octroyée : <strong className="text-stone-200">{grantedCap}</strong></p>}
        </div>
    );
};
