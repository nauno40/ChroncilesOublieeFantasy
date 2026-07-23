import React from 'react';
import type { Character } from '../../types/character';
import type { ProfileList } from './types';

interface Mastery {
    weapons?: string; armors?: string; shields?: string;
    weaponsAndArmors?: string; special?: string; constraints?: string;
}
interface ProfileLite { name?: string; '@id'?: string; masteries?: Mastery | null }

// Champs de maîtrise affichés, dans l'ordre, avec leur libellé.
const FIELDS: { key: keyof Mastery; label: string }[] = [
    { key: 'weaponsAndArmors', label: 'Armes & armures' },
    { key: 'weapons', label: 'Armes' },
    { key: 'armors', label: 'Armures' },
    { key: 'shields', label: 'Boucliers' },
    { key: 'special', label: 'Spécial' },
    { key: 'constraints', label: 'Contraintes' },
];

interface Props {
    character: Partial<Character>;
    profiles: ProfileList;
}

/** Maîtrises du profil (armes/armures/boucliers/contraintes), en lecture seule sur la fiche.
 *  Descriptif (COF2 ne définit pas de pénalité mécanique pour une arme non maîtrisée). */
export const MasteriesBlock: React.FC<Props> = ({ character, profiles }) => {
    const pRef = (character.profile as { '@id'?: string })?.['@id']
        ?? (typeof character.profile === 'string' ? character.profile : '');
    const profile = (profiles as ProfileLite[]).find(p => p['@id'] === pRef || p.name === pRef || p['@id'] === character.profile);
    const m = profile?.masteries;
    const rows = m ? FIELDS.filter(f => m[f.key]) : [];
    if (rows.length === 0) return null;

    return (
        <div className="glass-panel p-4 rounded-2xl border-white/5 bg-stone-900/10">
            <h3 className="text-stone-400 font-display font-bold uppercase text-[10px] tracking-[0.2em] mb-3">Maîtrises</h3>
            <div className="space-y-2">
                {rows.map(f => (
                    <div key={f.key}>
                        <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider">{f.label}</span>
                        <p className="text-xs text-stone-300 leading-snug">{m![f.key]}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
