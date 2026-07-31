/**
 * Conversions partagées entre les deux adaptateurs (`fromOfficial.ts`, `fromHomebrew.ts`).
 *
 * Avant ce module, chaque adaptateur définissait son propre `str`/`num`. `str` était
 * identique dans les deux ; `num` divergeait — la version officielle rejetait les
 * chaînes numériques (`typeof v === 'number'` strict) quand la communautaire les
 * acceptait. Cette duplication était la racine déclarée du seul défaut critique
 * rencontré pendant le chantier « iso officiel/communautaire ». Sémantique unique
 * désormais : `num` accepte un nombre ou une chaîne numérique, rejette le reste.
 */

/** Vide → undefined : une section sans contenu ne doit pas être rendue. */
export const str = (v: unknown): string | undefined => {
    const s = typeof v === 'string' ? v.trim() : '';
    return s === '' ? undefined : s;
};

/** Nombre ou chaîne numérique → nombre ; toute autre valeur (y compris NaN) → undefined. */
export const num = (v: unknown): number | undefined => {
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
    return Number.isNaN(n) ? undefined : n;
};

/**
 * Identifiant d'entité API Platform : l'API renvoie toujours un entier (`"id": 35651`)
 * en JSON, même si `normalized.ts` déclare `id: string` sur `Voie`/`Capacity` — un type
 * de façade qui ne reflète pas la forme réelle des réponses. `str()` ne convertit pas
 * les nombres et rendrait ces identifiants toujours `undefined` (clé React de repli
 * systématique, lien capacité → voie qui ne se forme jamais). `idStr` accepte les deux.
 */
export const idStr = (v: unknown): string | undefined => {
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
    return str(v);
};
