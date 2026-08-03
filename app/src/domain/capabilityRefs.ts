import type { CustomCreatureCapability, HarmfulState } from '../types/normalized';

/** Forme comparable d'un nom : sans casse ni accents, pour rapprocher « ÉTOURDI »,
 *  « etourdi » et « Étourdi ». */
const normaliser = (x: string): string =>
    x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Nom canonique de l'état désigné, quelles que soient sa casse, ses accents et son accord.
 *
 * Le rapprochement se fait par préfixe sur la forme normalisée : en français, le féminin et
 * le pluriel n'ajoutent qu'un suffixe (« Renversée », « Immobilisées », « Surprise »). Les
 * 8 noms connus ne sont préfixes d'aucun autre, donc au plus un correspond ; le tri par
 * longueur décroissante rend le choix déterministe si la liste venait à s'enrichir.
 *
 * `undefined` si rien ne correspond : une déclaration périmée ne doit pas produire une
 * pastille inapplicable.
 */
export const resoudreEtat = (declare: string, etatsConnus: HarmfulState[]): string | undefined => {
    const cible = normaliser(declare);
    if (cible === '') return undefined;
    return [...etatsConnus]
        .sort((a, b) => normaliser(b.name).length - normaliser(a.name).length)
        .find(e => cible.startsWith(normaliser(e.name)))
        ?.name;
};

/**
 * États d'une capacité, résolus vers leur nom canonique, sans doublon et dans l'ordre de
 * déclaration : deux orthographes du même état n'en font qu'un.
 */
export const etatsDeclares = (
    capacite: CustomCreatureCapability,
    etatsConnus: HarmfulState[],
): string[] => {
    const out: string[] = [];
    for (const declare of capacite.states ?? []) {
        const canonique = resoudreEtat(declare, etatsConnus);
        if (canonique && !out.includes(canonique)) out.push(canonique);
    }
    return out;
};

/** Chemin interne vers un état : la liste des états, filtrée sur son nom. Le compendium
 *  n'a pas de fiche d'état — cf. la conception, section « Cibles de liens ». */
export const lienEtat = (nom: string): string => `/states?q=${encodeURIComponent(nom)}`;
