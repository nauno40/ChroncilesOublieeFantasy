import type { CharacterVoieRef } from '../../types/character';
import type { CompendiumRace, CompendiumProfile } from './types';
import { PROFILE_FAMILIES } from './health';
import { isCapabilityGrantedByEntry } from './progression';
import { buildVoieIndex } from './voies';

export const computeLuckPoints = (
  profileName: string | undefined,
  chaMod: number,
  // Voie de peuple résolue (nom + rang) — le rang 1 « Diversité » de la Voie de
  // l'humain accorde +1 PC. Le nom est résolu depuis le compendium par l'appelant.
  racialVoie?: { name?: string; rank?: number },
): number => {
  let pc = 2 + chaMod;
  if (pc < 1) pc = 0;
  if (profileName && PROFILE_FAMILIES[profileName]?.id === 'aventuriers') pc += 1;
  if (racialVoie && racialVoie.name === "Voie de l'humain" && (racialVoie.rank ?? 0) >= 1) pc += 1;
  return pc;
};

// PM = VOL + nombre de sorts connus (COF2, Magie et sorts). Le rang 4 « Perception
// héroïque » des voies druide/ensorceleur ajoute en plus la PER (d'où `perMod`).
export const computeManaPoints = (
  voies: CharacterVoieRef[] | undefined,
  races: CompendiumRace[],
  profiles: CompendiumProfile[],
  volMod: number,
  perMod = 0,
): number => {
  // Résolution des voies du perso par IRI dans le compendium (peuple + profil, pas de prestige).
  const byIri = buildVoieIndex(races, profiles);

  // Voies des profils druide/ensorceleur dont le rang 4 « Perception héroïque » ajoute la PER aux PM.
  const perManaIris = new Set<string>();
  for (const profile of profiles) {
    if (profile.name === 'Druide' || profile.name === 'Ensorceleur') {
      profile.voies?.forEach(v => v['@id'] && perManaIris.add(v['@id']));
    }
  }

  let spellCount = 0;
  let perBonus = false;
  (voies ?? []).forEach(entry => {
    // Parité : la magie de peuple/profil compte, pas les voies de prestige.
    if (entry.source === 'prestige') return;
    const v = byIri.get(entry.voie);
    if (!v) return;
    (v.capabilities ?? []).forEach(c => {
      if (isCapabilityGrantedByEntry(c.rank, entry) && c.isSpell) spellCount++;
    });
    if (entry.rank >= 4 && perManaIris.has(entry.voie)) {
      const r4 = (v.capabilities ?? []).find(c => c.rank === 4);
      if (/perception h[ée]ro[ïi]que/i.test(r4?.name || '')) perBonus = true;
    }
  });

  if (spellCount === 0) return 0;
  return volMod + spellCount + (perBonus ? perMod : 0);
};
