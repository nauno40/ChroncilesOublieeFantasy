import type {
    CapabilitySummon, CustomCreatureCapability, HarmfulState,
    Creature, CustomCreature, Weapon, Armor,
} from '../types/normalized';
import type { Combatant } from '../types/campaign';
import type { Character } from '../types/character';
import { isCapabilityGrantedByEntry } from './rules/progression';
import type { Capacity } from '../types/normalized';
import type { HomebrewEntry } from '../services/homebrewService';

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
        // Le préfixe seul rapprocherait « Affaiblissement » d'« Affaibli ». En français
        // l'accord n'ajoute qu'un ou deux caractères (« Renversée », « Immobilisées ») :
        // au-delà, c'est un autre mot.
        .find(e => {
            const connu = normaliser(e.name);
            return cible.startsWith(connu) && cible.length <= connu.length + 2;
        })
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

/** Préfixe des identifiants de monstres maison, déjà employé par `CombatTracker`
 *  et `CampaignEncounters` pour distinguer un monstre maison d'une créature du bestiaire. */
const PREFIXE_MAISON = 'custom-';
/** Préfixe des entrées communautaires (`HomebrewEntry`). */
const PREFIXE_COMMUNAUTAIRE = 'homebrew-';

export type SourcesInvocation = {
    creatures: Creature[];
    monstresMaison: CustomCreature[];
    armes: Weapon[];
    armures: Armor[];
    communautaire: HomebrewEntry[];
};

export type InvocationResolue =
    | { type: 'creature'; creature: Creature | CustomCreature; lien: string }
    | { type: 'item'; nom: string; lien: string };

/**
 * Entité désignée par une invocation. Ne crée jamais rien : si la référence ne correspond
 * à rien d'existant, renvoie `undefined` et l'appelant n'affiche ni bouton ni lien.
 */
export const resoudreInvocation = (
    invocation: CapabilitySummon,
    sources: SourcesInvocation,
): InvocationResolue | undefined => {
    const { type, ref } = invocation;

    if (type === 'creature') {
        if (ref.startsWith(PREFIXE_MAISON)) {
            const maison = sources.monstresMaison.find(m => `${PREFIXE_MAISON}${m.id}` === ref);
            return maison ? { type: 'creature', creature: maison, lien: '/tools/monsters' } : undefined;
        }
        const officielle = sources.creatures.find(c => c.name === ref);
        return officielle
            ? { type: 'creature', creature: officielle, lien: `/bestiary/${officielle.id}` }
            : undefined;
    }

    if (ref.startsWith(PREFIXE_COMMUNAUTAIRE)) {
        const entree = sources.communautaire.find(e => `${PREFIXE_COMMUNAUTAIRE}${e.id}` === ref);
        return entree ? { type: 'item', nom: entree.name, lien: `/homebrew/${entree.id}` } : undefined;
    }

    // Objet officiel : le compendium n'a pas de fiche d'objet, on ouvre la liste
    // d'équipement filtrée — `Equipment.tsx` lit déjà `?q=` et `?tab=`.
    const arme = sources.armes.find(a => a.name === ref);
    const armure = arme ? undefined : sources.armures.find(a => a.name === ref);
    const trouve = arme ?? armure;
    if (!trouve) return undefined;
    const onglet = arme ? 'weapons' : 'armors';
    return {
        type: 'item',
        nom: trouve.name,
        lien: `/equipment?q=${encodeURIComponent(trouve.name)}&tab=${onglet}`,
    };
};

/**
 * Capacités d'un combattant, quand il vient du bestiaire. `undefined` pour un ajout manuel
 * ou un personnage joueur, dont les capacités passent par un tout autre chemin, et
 * `undefined` aussi quand la créature référencée n'existe plus — le suivi de combat est
 * persisté en `localStorage`, un monstre maison peut avoir été supprimé entre-temps.
 */
export const capacitesDuCombattant = (
    combattant: Combatant,
    creatures: Creature[],
    monstresMaison: CustomCreature[],
): CustomCreatureCapability[] | undefined => {
    if (combattant.source !== 'bestiary' || !combattant.referenceId) return undefined;
    const ref = combattant.referenceId;
    const source = ref.startsWith(PREFIXE_MAISON)
        ? monstresMaison.find(m => `${PREFIXE_MAISON}${m.id}` === ref)
        : creatures.find(c => String(c.id) === ref);
    const capacites = source?.capabilities;
    return capacites && capacites.length > 0 ? capacites : undefined;
};

/** Identifiant de voie porté par une capacité : tantôt une IRI (`/api/voies/50`), tantôt
 *  un identifiant brut. Même ambivalence que dans `fromOfficial.ts` (`capsOfVoie`). */
const idDeVoie = (v: string | null | undefined): string | undefined => {
    if (!v) return undefined;
    return String(v).split('/').pop() || undefined;
};

/**
 * Capacités d'un combattant PERSONNAGE : celles de ses voies dont le rang est acquis.
 *
 * Un personnage porte `characterVoies[] = { voie: IRI, rank }` ; un rang 3 donne les
 * capacités 1 à 3, pas les cinq de la voie — proposer au MJ une capacité que le
 * personnage ne possède pas serait pire que ne rien afficher.
 *
 * `undefined` pour tout autre combattant, pour un personnage introuvable — le suivi de
 * combat est persisté, un personnage peut avoir été supprimé depuis — ou quand aucune
 * capacité n'est acquise.
 */
export const capacitesDuPersonnage = (
    combattant: Combatant,
    personnages: Character[],
    capacites: Capacity[],
    /** Voies du compendium, pour nommer l'origine de chaque capacité. Facultatif :
     *  sans elles, la capacité s'affiche sans son nom de voie, rien de plus. */
    voies: { id: string | number; name: string }[] = [],
): CustomCreatureCapability[] | undefined => {
    if (combattant.source !== 'character' || !combattant.referenceId) return undefined;

    const personnage = personnages.find(p => String(p.id) === combattant.referenceId);
    if (!personnage) return undefined;

    // Une entrée de voie accorde ses capacités selon une règle que le dépôt possède déjà,
    // testée et consommée par le mode jeu et les règles de combat : le cas général donne
    // tous les rangs jusqu'au rang courant, mais une entrée `trait` (octroi de capacité de
    // peuple) n'accorde QUE la capacité de son rang. Réduire les entrées à un rang maximum
    // par voie perdrait cette distinction et proposerait au MJ une capacité que le
    // personnage ne possède pas.
    const entrees = personnage.characterVoies ?? [];
    if (entrees.length === 0) return undefined;

    const acquises = capacites
        .filter(c => {
            const id = idDeVoie(c.voie ?? c.voieId);
            if (!id) return false;
            return entrees.some(entree =>
                idDeVoie(entree.voie) === id && isCapabilityGrantedByEntry(c.rank ?? undefined, entree));
        })
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((c): CustomCreatureCapability => ({
            name: c.name,
            description: c.description,
            rank: c.rank ?? undefined,
            states: c.states,
            summons: c.summons,
            voieName: voies.find(v => String(v.id) === idDeVoie(c.voie ?? c.voieId))?.name,
        }));

    return acquises.length > 0 ? acquises : undefined;
};
