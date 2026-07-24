// Langues (COF2, création) : +1 emplacement de langue par point positif d'INT ;
// personnage illettré si INT < 0. Les langues elles-mêmes sont choisies (playState).
export const computeLanguageSlots = (intMod: number): { slots: number; illiterate: boolean } => ({
  slots: Math.max(0, intMod),
  illiterate: intMod < 0,
});

// Compteur d'emplacements langues/talents (COF2 §Talent secondaire) : « Commun » est
// gratuit (base 1) ; chaque langue supplémentaire et chaque talent secondaire consomme
// un emplacement du budget partagé dérivé de l'INT. Indicatif — jamais bloquant.
export const computeLanguageUsage = (
  languages: string[] | undefined,
  talents: string[] | undefined,
  intMod: number,
): { used: number; available: number; illiterate: boolean } => {
  const { slots, illiterate } = computeLanguageSlots(intMod);
  return {
    // `languages` ne contient que les langues SUPPLÉMENTAIRES : les langues de base
    // (Commun + langue de peuple, cf. baseLanguages) sont gratuites, hors budget INT.
    used: (languages?.length ?? 0) + (talents?.length ?? 0),
    available: slots,
    illiterate,
  };
};

// Langue maternelle par peuple, hors Commun (universel). COF2 §Langues maîtrisées.
export const RACE_NATIVE_LANGUAGE: Record<string, string> = {
  'Demi-elfe': 'Sylvestre',
  'Demi-orc': 'Noir parlé',
  'Elfe haut': 'Sylvestre',
  'Elfe sylvain': 'Sylvestre',
  'Gnome': 'Runique',
  'Nain': 'Runique',
  // Humain / Halfelin : langue maternelle = Commun (rien à ajouter).
};

// Langues connues de base : le Commun (langue humaine locale) + la langue du peuple,
// dédupliquées. Gratuites (hors budget INT).
export const baseLanguages = (raceName: string | undefined): string[] => {
  const native = raceName ? RACE_NATIVE_LANGUAGE[raceName] : undefined;
  return native ? ['Commun', native] : ['Commun'];
};
