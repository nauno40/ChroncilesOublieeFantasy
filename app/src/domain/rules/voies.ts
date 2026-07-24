// Index des voies du compendium par IRI (`@id`), pour résoudre les entrées de voie
// d'un personnage (`characterVoies[].voie` est un IRI). Sources agrégées, dans l'ordre :
// voies de peuple (`race.availableVoies`), voies de profil (`profile.voies`), puis la
// collection plate `allVoies` (voies de prestige incluses) — les dernières écrasent.
// `allVoies` est optionnelle : certains calculs (PM) n'ont besoin que du peuple/profil.
//
// Générique sur le type de voie `V` (seul l'IRI `@id` est requis) : les appelants qui
// manipulent une forme enrichie (`RefVoie` avec description/catégorie…) récupèrent une
// `Map<string, V>` typée sans downcast, la logique d'agrégation restant unique.
export const buildVoieIndex = <V extends { '@id'?: string }>(
  races: { availableVoies?: V[] }[],
  profiles: { voies?: V[] }[],
  allVoies: V[] = [],
): Map<string, V> => {
  const byIri = new Map<string, V>();
  for (const r of races) for (const v of r.availableVoies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const p of profiles) for (const v of p.voies ?? []) if (v['@id']) byIri.set(v['@id'], v);
  for (const v of allVoies) if (v['@id']) byIri.set(v['@id'], v);
  return byIri;
};
