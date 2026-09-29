import React from 'react';
import type { Character } from '../../../../types/character';
import { WizardShellLayout } from '../WizardShellLayout';

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    onNext: () => void;
}

/**
 * Première étape : nom + niveau de départ. Le niveau est réglé ici (pas dans une étape
 * « identité » tardive) car il alimente le budget de capacités consommé par les étapes
 * Voies/Caractéristiques plus loin dans le parcours.
 */
export const StepWelcome: React.FC<Props> = ({ character, setCharacter, onNext }) => {
    const canContinue = !!character.name?.trim();

    return (
        <WizardShellLayout onNext={onNext} nextLabel="Commencer l'aventure" nextDisabled={!canContinue}>
            <div className="space-y-6 max-w-xl mx-auto text-center">
                <h2 className="font-display text-3xl text-stone-200">Qui êtes-vous ?</h2>
                <p className="text-stone-500 text-sm italic">
                    Avant de choisir votre peuple et votre profil, donnez un nom à votre héros.
                    Laissez le niveau à 1 pour une création standard.
                </p>
                <div className="space-y-1 text-left">
                    <label className="text-[11px] uppercase tracking-[0.15em] text-stone-500 ml-1">Nom du personnage</label>
                    <input
                        type="text"
                        autoFocus
                        aria-label="Nom du personnage"
                        className="w-full bg-transparent border-0 border-b border-stone-400/40 px-1 py-2 text-2xl font-display text-stone-200 outline-none focus:border-primary-600/60 transition-all placeholder:text-stone-500"
                        value={character.name || ''}
                        onChange={e => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom du héros"
                    />
                </div>
                <div className="space-y-1 text-left">
                    <label className="text-[11px] uppercase tracking-[0.15em] text-stone-500 ml-1">Niveau de départ</label>
                    <input
                        type="number"
                        min={1}
                        aria-label="Niveau du personnage"
                        className="w-32 bg-transparent border-0 border-b border-stone-400/40 px-1 py-2 text-xl font-display text-stone-200 outline-none focus:border-primary-600/60 transition-all text-center"
                        value={character.level || 1}
                        onChange={e => setCharacter(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                    />
                </div>
            </div>
        </WizardShellLayout>
    );
};
