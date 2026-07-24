import type { CharacterVoieRef } from '../../types/character';
import type { CompendiumRace, CompendiumProfile, CompendiumVoie, RacialGrant } from './types';
import { buildVoieIndex } from './voies';

// Éligibilité au trait racial « choisir une capacité d'un profil » (spec #6, octroi).
// null si le peuple n'a pas ce trait, ou si la voie de peuple n'a pas atteint son rang.
export const racialGrantInfo = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
): RacialGrant | null => {
  const byIri = buildVoieIndex(races, profiles, allVoies);

  const peuple = (voies ?? []).find(e => e.source === 'peuple');
  if (!peuple) return null;
  const v = byIri.get(peuple.voie);
  if (!v) return null;
  const cap = (v.capabilities ?? []).find(c => (c.effect?.choiceOptions?.length ?? 0) > 0);
  const capRank = cap?.rank ?? 0;
  if (!cap || capRank < 1 || peuple.rank < capRank) return null;

  const labels = (cap.effect?.choiceOptions ?? []).map(o => o.label);
  const allowedProfiles = labels.some(l => /importe quel profil/i.test(l))
    ? ['*']
    : labels.map(l => l.split(' (')[0].trim());
  const allowsRank2 = labels.some(l => /ou 2/i.test(l)); // « Rang 1 ou 2 » (Elfe haut, Humain)
  return { capabilityRank: capRank, allowedProfiles, allowsRank2 };
};

// Un octroi (entrée source:'trait') est valide si le perso y a toujours droit ET que la
// voie choisie relève d'un profil autorisé. Sert à purger un octroi orphelin (rang de
// peuple baissé, changement de peuple). Vrai s'il n'y a pas d'entrée trait.
// Ne pas appeler avec un compendium vide (renverrait faux à tort) : l'appelant garde
// « données chargées » — cf. purge dans useCharacterSheet.
export const isTraitGrantValid = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  allVoies: CompendiumVoie[],
): boolean => {
  const traitEntry = (voies ?? []).find(e => e.source === 'trait');
  if (!traitEntry) return true;
  const grant = racialGrantInfo(voies, races, profiles, allVoies);
  if (!grant) return false;
  if (grant.allowedProfiles.includes('*')) return true;
  const profile = profiles.find(p => (p.voies ?? []).some(v => v['@id'] === traitEntry.voie));
  return !!profile && grant.allowedProfiles.includes(profile.name ?? '');
};
