// Résolution du peuple / profil d'un personnage dans le compendium.
//
// `character.race` et `character.profile` sont des références souples (héritage de
// l'API / des fixtures Drupal) : soit une chaîne (nom OU IRI), soit un objet imbriqué
// `{ '@id', id, name }`. Ces helpers centralisent le matching, jusque-là dupliqué dans
// ~6 composants avec des variantes. Le type de retour est générique : chaque appelant
// récupère sa forme enrichie (RefRace/RefProfile…) sans downcast.

// Le peuple est référencé par son nom (ou son IRI). `nom` couvre le champ legacy Drupal.
export const findRace = <R extends { '@id'?: string; name?: string; nom?: string }>(
  race: unknown,
  races: R[],
): R | undefined => races.find(r => (r.name || r.nom) === race || r['@id'] === race);

// IRI du profil : `@id` de l'objet imbriqué, sinon la chaîne (IRI ou nom) telle quelle.
export const profileIri = (profile: unknown): string => {
  const asObj = profile as { '@id'?: string } | null | undefined;
  return asObj?.['@id'] ?? (typeof profile === 'string' ? profile : '');
};

// Le profil est référencé par IRI ou par nom.
export const findProfile = <P extends { '@id'?: string; name?: string }>(
  profile: unknown,
  profiles: P[],
): P | undefined => {
  const ref = profileIri(profile);
  return profiles.find(p => p['@id'] === ref || p.name === ref);
};
