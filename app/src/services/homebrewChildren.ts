import { HomebrewService, type HomebrewVisibility } from './homebrewService';
import type { HomebrewChild } from './homebrewSchemas';

/** Une capacité en cours d'édition dans le formulaire de voie. `id` est absent tant que
 *  la capacité n'a pas encore été enregistrée côté serveur. */
export interface ChildDraft extends HomebrewChild {
    id?: number;
}

export interface SaveChildrenResult {
    /** Nombre de brouillons créés ou mis à jour avec succès (les suppressions n'y comptent pas). */
    saved: number;
    /** Position affichée à l'auteur (indice + 1, comme dans validateHomebrew), pas
     *  l'indice technique — et le message d'erreur brut, jamais préfixé ici (le
     *  préfixage « Capacité N — » est le rôle de l'appelant, pas de cette fonction). */
    failed: { position: number; message: string }[];
    /**
     * L'état réel des capacités après cet appel : à substituer tel quel à l'état local
     * du formulaire, pour qu'une reprise ne recrée jamais ce qui a déjà réussi.
     *
     * - Créée avec succès → porte désormais son id serveur.
     * - Mise à jour (réussie ou non) → garde son id d'origine, inchangé.
     * - Création en échec → reste sans id, telle quelle (une reprise la recréera : il
     *   n'existe encore rien côté serveur pour elle).
     * - Retirée par l'auteur mais dont la suppression a échoué → réapparaît ici (avec
     *   son contenu confirmé le plus récent, cf. `confirmed`) : elle existe toujours
     *   côté serveur, le formulaire ne doit pas prétendre le contraire.
     */
    drafts: ChildDraft[];
}

const messageDe = (e: unknown): string => (e instanceof Error ? e.message : 'Erreur inconnue.');

/**
 * Traduit les échecs renvoyés par `saveChildren` en erreurs indexées comme celles de
 * `validateHomebrew` (clé `capacites.<indice>.`), pour que l'appelant (HomebrewForm)
 * les fusionne dans les erreurs passées à `CapabilityBlocks` : un échec survenu après
 * une validation cliente réussie (réseau, refus serveur…) doit signaler son bloc
 * exactement comme une erreur de validation — sans quoi l'auteur voit un enregistrement
 * refusé sans cause visible, l'erreur restant cachée dans un bloc replié.
 *
 * La clé posée n'a pas de suffixe de champ (`capacites.2.` et non `capacites.2.rank`) :
 * l'échec ne vise pas un champ précis, seulement le bloc dans son ensemble — ce qui
 * suffit à `CapabilityBlocks` (cf. `enErreur`, qui teste un préfixe) pour ouvrir le
 * bloc et le signaler visuellement.
 *
 * Une position au-delà de `blocsVisibles` ne désigne aucun bloc affiché — le cas d'une
 * suppression refusée pour une capacité déjà retirée du formulaire par l'auteur — et
 * n'est donc pas traduite ici : seul le bandeau de synthèse en rend compte.
 */
export const echecsCapacitesEnErreurs = (
    failed: SaveChildrenResult['failed'],
    blocsVisibles: number,
): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const f of failed) {
        if (f.position > blocsVisibles) continue;
        out[`capacites.${f.position - 1}.`] = "Échec de l'enregistrement de cette capacité — réessayez.";
    }
    return out;
};

/**
 * Enregistre l'ensemble des capacités d'une voie : crée les brouillons sans `id`, met à
 * jour ceux qui en ont un, puis supprime les capacités confirmées côté serveur (`confirmed`,
 * chaque élément porte un id) absentes des brouillons finaux (capacités retirées par
 * l'auteur).
 *
 * L'API est REST par entité — il n'existe pas de point d'entrée transactionnel. Chaque
 * opération est donc isolée : un échec est collecté (sans faire échouer les suivantes)
 * pour que l'appelant puisse rendre compte précisément de ce qui est enregistré et de
 * ce qui ne l'est pas. Le `drafts` renvoyé reflète cet état réel — l'appelant DOIT
 * remplacer son état local par cette valeur avant une éventuelle reprise : une capacité
 * créée avec succès doit porter son id, sans quoi une reprise la recréerait en double
 * plutôt que de la mettre à jour.
 *
 * Le parent est transmis en IRI (`/api/homebrew_entries/<id>`) et la visibilité
 * transmise est celle de la voie — même si le serveur la réimpose de toute façon
 * (cf. HomebrewEntryStateProcessor), la couche cliente doit envoyer la bonne valeur.
 */
export const saveChildren = async (
    parentId: number,
    visibility: HomebrewVisibility,
    drafts: ChildDraft[],
    confirmed: ChildDraft[],
): Promise<SaveChildrenResult> => {
    const parent = `/api/homebrew_entries/${parentId}`;
    const failed: SaveChildrenResult['failed'] = [];
    const resultDrafts: ChildDraft[] = [];
    let saved = 0;

    for (let index = 0; index < drafts.length; index++) {
        const draft = drafts[index];
        const { id, category, name, data } = draft;
        try {
            if (id === undefined) {
                const created = await HomebrewService.create({ category, name, description: '', visibility, data, parent });
                resultDrafts.push({ category, name, data, id: created.id });
            } else {
                await HomebrewService.update(id, { category, name, data, visibility, parent });
                resultDrafts.push({ category, name, data, id });
            }
            saved++;
        } catch (e) {
            console.error('Échec de l\'enregistrement d\'une capacité :', e);
            failed.push({ position: index + 1, message: messageDe(e) });
            // Inchangée : une reprise retentera exactement la même opération (création
            // si elle n'avait pas d'id, mise à jour sinon).
            resultDrafts.push(draft);
        }
    }

    // Capacités confirmées côté serveur mais absentes des brouillons finaux : retirées
    // par l'auteur. Un brouillon sans id n'a jamais existé côté serveur, il ne peut donc
    // pas en faire partie.
    const idsConserves = new Set(drafts.map(d => d.id).filter((id): id is number => id !== undefined));
    const aSupprimer = confirmed.filter(c => c.id !== undefined && !idsConserves.has(c.id));
    for (let i = 0; i < aSupprimer.length; i++) {
        const cible = aSupprimer[i];
        try {
            await HomebrewService.remove(cible.id as number);
            // Succès : rien à rajouter à `resultDrafts`, elle est bel et bien partie.
        } catch (e) {
            console.error('Échec de la suppression d\'une capacité retirée :', e);
            // Position au-delà du nombre de blocs affichés : ces échecs ne correspondent
            // à aucun bloc visible au moment de l'appel (déjà retiré côté auteur), donc
            // l'appelant les distingue des échecs de création/mise à jour.
            failed.push({ position: drafts.length + i + 1, message: messageDe(e) });
            // Toujours là côté serveur : elle réapparaît dans le formulaire plutôt que
            // de disparaître silencieusement sur la foi d'une suppression non confirmée.
            resultDrafts.push(cible);
        }
    }

    return { saved, failed, drafts: resultDrafts };
};
