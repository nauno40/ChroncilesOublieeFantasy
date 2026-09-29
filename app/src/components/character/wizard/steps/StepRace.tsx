import React from 'react';
import type { Character } from '../../../../types/character';
import type { RaceList } from '../../types';
import { onImageError } from '../../../common/imagePlaceholder';
import { WizardShellLayout } from '../WizardShellLayout';
import { WizardAvatarStrip } from '../WizardAvatarStrip';

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

/** Étape « Race » : bandeau de médaillons (art local, cf. `Races.tsx`), portrait et détail en dessous. */
export const StepRace: React.FC<Props> = ({ character, setCharacter, races, onBack, onNext }) => {
    const list = races as unknown as RaceWithArt[];
    const selectedIri = raceIri(character.race);
    const selected = list.find(r => r['@id'] === selectedIri);
    const selectedName = selected?.name || selected?.nom || '';

    const pick = (iri: string) => setCharacter(prev => ({ ...prev, race: iri }));

    const items = list.map(r => {
        const name = r.name || r.nom || '';
        return { iri: r['@id'] || '', name, image: r.image || `/assets/races/${name.toLowerCase()}.png.webp` };
    });

    return (
        <WizardShellLayout onBack={onBack} onNext={onNext} nextDisabled={!selectedIri}>
            <h2 className="font-display text-2xl text-stone-200 text-center">Choisissez votre peuple</h2>
            <WizardAvatarStrip items={items} selectedIri={selectedIri} onSelect={pick} />

            {selected ? (
                <div className="space-y-4 text-center">
                    <img
                        src={selected.image || `/assets/races/${selectedName.toLowerCase()}.png.webp`}
                        onError={onImageError(selectedName, 'portrait')}
                        alt={selectedName}
                        className="portrait-feather w-full max-w-sm mx-auto aspect-[3/4] object-cover"
                    />
                    <h2 className="font-display text-2xl text-stone-200">{selectedName}</h2>
                    {selected.description && (
                        <p className="text-stone-400 text-sm font-body leading-relaxed max-w-md mx-auto">{selected.description}</p>
                    )}
                    {!!selected.modifiers?.length && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {selected.modifiers.map((mod, i) => (
                                <span key={i} className="px-3 py-1 rounded-full border border-stone-400/30 text-stone-400 text-xs">
                                    {mod.description
                                        ? mod.description
                                        : <>
                                            <span className={(mod.value ?? 0) > 0 ? 'text-primary-700 font-bold' : 'text-red-700 font-bold'}>
                                                {(mod.value ?? 0) > 0 ? '+' : ''}{mod.value}
                                            </span>{' '}
                                            {mod.options?.length ? mod.options.join(' / ') : mod.stat}
                                        </>}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-center text-stone-500 text-sm italic py-8">
                    Choisissez un peuple ci-dessus pour découvrir son portrait et ses traits.
                </p>
            )}
        </WizardShellLayout>
    );
};
