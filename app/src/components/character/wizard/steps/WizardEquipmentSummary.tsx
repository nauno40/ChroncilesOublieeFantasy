import React from 'react';
import { Sword, Backpack } from 'lucide-react';
import type { Character } from '../../../../types/character';
import { findProfile } from '../../../../domain/rules';
import type { ProfileList } from '../../types';

interface Props {
    character: Partial<Character>;
    profiles: ProfileList;
}

/**
 * Résumé en lecture seule de ce que la cascade de départ (`applyProfileSelection`, jouée à
 * l'étape Profil) a déjà posé : armes, sac d'aventurier, maîtrises du profil. Contrairement
 * à `WeaponsSection`/`InventorySection` (fiche classique, tableau et texte libre éditables),
 * rien ne se modifie ici — l'édition fine reste possible après coup sur la fiche.
 */
export const WizardEquipmentSummary: React.FC<Props> = ({ character, profiles }) => {
    const weapons = (character.playState?.weapons ?? []).filter(w => w.name);
    const inventory = character.playState?.equipment ?? [];
    const masteries = findProfile(character.profile, profiles)?.masteries;
    const masteryText = [masteries?.weaponsAndArmors, masteries?.weapons, masteries?.armors, masteries?.shields]
        .filter(Boolean).join(' · ');

    return (
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-5">
            <div>
                <h3 className="flex items-center gap-2 text-primary-400/80 font-display font-bold uppercase text-[11px] tracking-[0.2em] mb-2">
                    <Sword size={14} /> Armes
                </h3>
                {weapons.length === 0 ? (
                    <p className="text-sm text-stone-400 italic">Aucune arme pour l'instant.</p>
                ) : (
                    <ul className="space-y-1">
                        {weapons.map((w, i) => (
                            <li key={i} className="text-sm text-stone-200">
                                <span className="font-bold">{w.name}</span>
                                {w.dmg && <span className="text-stone-400"> — {w.dmg}</span>}
                                {w.special && <span className="text-stone-500 italic text-xs"> ({w.special})</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div>
                <h3 className="flex items-center gap-2 text-stone-400 font-display font-bold uppercase text-[11px] tracking-[0.2em] mb-2">
                    <Backpack size={14} /> Sac d'aventurier
                </h3>
                {inventory.length === 0 ? (
                    <p className="text-sm text-stone-400 italic">Rien pour l'instant.</p>
                ) : (
                    <p className="text-sm text-stone-300 leading-relaxed">{inventory.join(', ')}</p>
                )}
            </div>

            {masteryText && (
                <p className="text-xs text-stone-400 leading-snug">
                    <span className="uppercase font-bold tracking-wider text-stone-500">Maîtrises : </span>
                    {masteryText}
                </p>
            )}
        </div>
    );
};
