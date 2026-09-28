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
            <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-6 max-w-xl mx-auto text-center">
                <h2 className="font-display font-bold text-3xl text-gradient-gold">Qui êtes-vous ?</h2>
                <p className="text-stone-400 text-sm">
                    Avant de choisir votre peuple et votre profil, donnez un nom à votre héros.
                    Laissez le niveau à 1 pour une création standard.
                </p>
                <div className="space-y-1 text-left">
                    <label className="text-xs uppercase font-bold text-stone-400 tracking-wider ml-1">Nom du personnage</label>
                    <input
                        type="text"
                        autoFocus
                        aria-label="Nom du personnage"
                        className="w-full bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-2xl font-display font-bold text-white outline-none focus:border-primary-500/50 focus:bg-stone-900/50 transition-all placeholder:text-stone-700"
                        value={character.name || ''}
                        onChange={e => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom du héros"
                    />
                </div>
                <div className="space-y-1 text-left">
                    <label className="text-xs uppercase font-bold text-stone-400 tracking-wider ml-1">Niveau de départ</label>
                    <input
                        type="number"
                        min={1}
                        aria-label="Niveau du personnage"
                        className="w-32 bg-stone-950/30 border border-stone-800 rounded-lg px-4 py-3 text-xl font-mono font-bold text-primary-400 outline-none focus:border-primary-500/50 transition-all text-center"
                        value={character.level || 1}
                        onChange={e => setCharacter(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                    />
                </div>
            </div>
        </WizardShellLayout>
    );
};
