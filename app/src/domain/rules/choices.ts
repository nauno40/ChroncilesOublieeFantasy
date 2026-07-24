// Renvoie la clé de choix (`options_*`/`choix_*`) des details d'une capacité, sinon undefined.
export const capabilityChoiceKey = (
  details: Record<string, unknown> | undefined | null,
): string | undefined =>
  details ? Object.keys(details).find(k => /^(options|choix)/i.test(k)) : undefined;

// Texte d'aide d'un choix de capacité : les options sont un tableau de chaînes (data COF2)
// que l'on joint ; on gère aussi le cas chaîne. Sinon undefined.
export const capabilityChoiceHelp = (value: unknown): string | undefined =>
  Array.isArray(value) ? value.map(String).join(' · ') : typeof value === 'string' ? value : undefined;
