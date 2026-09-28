import React from 'react';
import type { Character } from '../../../../types/character';
import type { RaceList } from '../../types';
import { onImageError } from '../../../common/imagePlaceholder';
import { WizardShellLayout } from '../WizardShellLayout';

interface RaceWithArt {
    '@id'?: string;
    name?: string;
    nom?: string;
    image?: string;
    description?: string;
    modifiers?: { value?: number; options?: string[]; stat?: string; description?: string }[];
}

interface Props {
    character: Partial<Character>;
    setCharacter: React.Dispatch<React.SetStateAction<Partial<Character>>>;
    races: RaceList;
    onBack: () => void;
    onNext: () => void;
}

const raceIri = (r: Character['race']): string => (typeof r === 'string' ? r : (r as { '@id'?: string })?.['@id'] || '');

/** Étape « Race » : grille de portraits (art local, cf. `Races.tsx`), détail à gauche. */
export const StepRace: React.FC<Props> = ({ character, setCharacter, races, onBack, onNext }) => {
    const list = races as unknown as RaceWithArt[];
    const selectedIri = raceIri(character.race);
    const selected = list.find(r => r['@id'] === selectedIri);
    const selectedName = selected?.name || selected?.nom || '';

    const pick = (iri: string) => setCharacter(prev => ({ ...prev, race: iri }));

    return (
        <WizardShellLayout
            onBack={onBack}
            onNext={onNext}
            nextDisabled={!selectedIri}
            aside={
                <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                    {selected ? (
                        <>
                            <img
                                src={selected.image || `/assets/races/${selectedName.toLowerCase()}.png.webp`}
                                onError={onImageError(selectedName, 'portrait')}
                                alt={selectedName}
                                className="w-full aspect-[3/4] object-cover"
                            />
                            <div className="p-5 space-y-4">
                                <h2 className="font-display font-bold text-2xl text-white">{selectedName}</h2>
                                {selected.description && (
                                    <p className="text-stone-300 text-sm font-body leading-relaxed">{selected.description}</p>
                                )}
                                {!!selected.modifiers?.length && (
                                    <div className="flex flex-wrap gap-2">
                                        {selected.modifiers.map((mod, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-primary-600/20 border border-primary-500/30 text-primary-100 font-mono text-xs">
                                                {mod.description
                                                    ? mod.description
                                                    : <>
                                                        <span className={(mod.value ?? 0) > 0 ? 'text-primary-300 font-bold' : 'text-red-300 font-bold'}>
                                                            {(mod.value ?? 0) > 0 ? '+' : ''}{mod.value}
                                                        </span>{' '}
                                                        {mod.options?.length ? mod.options.join(' / ') : mod.stat}
                                                    </>}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-stone-400 text-sm">
                            Choisissez un peuple dans la liste pour découvrir son portrait et ses traits.
                        </div>
                    )}
                </div>
            }
        >
            <div className="glass-panel p-5 rounded-xl border border-white/10">
                <h2 className="font-display font-bold text-primary-400 uppercase text-sm tracking-wider mb-4">Choisissez votre peuple</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {list.map(r => {
                        const name = r.name || r.nom || '';
                        const isSelected = r['@id'] === selectedIri;
                        return (
                            <button
                                key={r['@id']}
                                type="button"
                                onClick={() => pick(r['@id'] || '')}
                                className={`text-left rounded-xl overflow-hidden border transition-all ${isSelected ? 'border-primary-500 ring-2 ring-primary-500/40' : 'border-white/10 hover:border-primary-500/40'}`}
                            >
                                <img
                                    src={r.image || `/assets/races/${name.toLowerCase()}.png.webp`}
                                    onError={onImageError(name, 'card')}
                                    alt={name}
                                    className="w-full aspect-[4/3] object-cover"
                                />
                                <div className="px-3 py-2 bg-stone-900/60">
                                    <span className="font-display font-bold text-sm text-stone-100">{name}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </WizardShellLayout>
    );
};
