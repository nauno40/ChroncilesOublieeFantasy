/**
 * Identifiant d'une ressource, quelle que soit la forme sous laquelle l'API la référence.
 *
 * API Platform renvoie tantôt un IRI (`/api/voies/123`), tantôt l'objet résolu, tantôt un
 * identifiant brut — selon la profondeur de sérialisation demandée. Trois pages faisaient
 * chacune leur extraction, avec un `any` pour contourner le typage, et une quatrième la
 * refaisait dans les adaptateurs de fiches.
 */
export const idDepuisRef = (ref: unknown): string | null => {
    if (ref === null || ref === undefined || ref === '') return null;
    if (typeof ref === 'number') return String(ref);
    // Un IRI : l'identifiant est le dernier segment. Une chaîne sans barre oblique est
    // déjà l'identifiant.
    if (typeof ref === 'string') return ref.split('/').pop() || null;
    if (typeof ref === 'object') {
        const objet = ref as Record<string, unknown>;
        if (objet.id !== undefined && objet.id !== null) return String(objet.id);
        if (typeof objet['@id'] === 'string') return idDepuisRef(objet['@id']);
    }
    return null;
};
