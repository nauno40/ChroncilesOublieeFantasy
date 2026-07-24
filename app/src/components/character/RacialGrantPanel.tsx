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
    const chosenVoie = allowed.flatMap(p => p.voies ?? []).find(v => v['@id'] === value);
    const grantedCap = (chosenVoie?.capabilities ?? []).find(c => c.rank === 1)?.name;

    const setVoie = (iri: string) =>
        setCharacter(prev => {
            const cv = (prev.characterVoies ?? []).filter(e => e.source !== 'trait');
            if (iri) cv.push({ voie: iri, rank: 1, source: 'trait' });
            return { ...prev, characterVoies: cv };
        });

    return (
        <div className="glass-panel p-4 rounded-2xl border-white/5 bg-stone-900/10 space-y-2">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em]">Capacité de peuple</h3>
            <p className="text-[10px] text-stone-500 italic leading-snug">
                Une capacité de rang 1 {all ? "de n'importe quel profil" : `de ${grant.allowedProfiles.join(' ou ')}`}, offerte par ton peuple (gratuite).
            </p>
            <select
                className="w-full bg-stone-950/40 border border-stone-800 rounded px-2 py-1 text-xs text-stone-200 outline-none focus:border-primary-500/40"
                value={value}
                onChange={e => setVoie(e.target.value)}
            >
                <option value="">— aucune —</option>
                {options.map(o => <option key={o.iri} value={o.iri}>{o.label}</option>)}
            </select>
            {grantedCap && <p className="text-[10px] text-stone-400">Capacité octroyée : <strong className="text-stone-200">{grantedCap}</strong></p>}
        </div>
    );
};
