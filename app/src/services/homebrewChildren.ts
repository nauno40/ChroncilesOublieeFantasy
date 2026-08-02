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
}

const messageDe = (e: unknown): string => (e instanceof Error ? e.message : 'Erreur inconnue.');

/**
 * Enregistre l'ensemble des capacités d'une voie : crée les brouillons sans `id`, met à
 * jour ceux qui en ont un, puis supprime les identifiants initiaux absents des
 * brouillons finaux (capacités retirées par l'auteur).
 *
 * L'API est REST par entité — il n'existe pas de point d'entrée transactionnel. Chaque
 * opération est donc isolée : un échec est collecté (sans faire échouer les suivantes)
 * pour que l'appelant puisse rendre compte précisément de ce qui est enregistré et de
 * ce qui ne l'est pas, plutôt que de tout perdre pour un seul échec.
 *
 * Le parent est transmis en IRI (`/api/homebrew_entries/<id>`) et la visibilité
 * transmise est celle de la voie — même si le serveur la réimpose de toute façon
 * (cf. HomebrewEntryStateProcessor), la couche cliente doit envoyer la bonne valeur.
 */
export const saveChildren = async (
    parentId: number,
    visibility: HomebrewVisibility,
    drafts: ChildDraft[],
    initialIds: number[],
): Promise<SaveChildrenResult> => {
    const parent = `/api/homebrew_entries/${parentId}`;
    const failed: SaveChildrenResult['failed'] = [];
    let saved = 0;

    for (let index = 0; index < drafts.length; index++) {
        const { id, category, name, data } = drafts[index];
        try {
            if (id === undefined) {
                await HomebrewService.create({ category, name, description: '', visibility, data, parent });
            } else {
                await HomebrewService.update(id, { category, name, data, visibility, parent });
            }
            saved++;
        } catch (e) {
            console.error('Échec de l\'enregistrement d\'une capacité :', e);
            failed.push({ position: index + 1, message: messageDe(e) });
        }
    }

    // Capacités retirées par l'auteur : présentes au chargement, absentes des brouillons
    // finaux (identifiées par leur id — un brouillon sans id n'a jamais existé côté serveur).
    const idsConserves = new Set(drafts.map(d => d.id).filter((id): id is number => id !== undefined));
    const idsRetires = initialIds.filter(id => !idsConserves.has(id));
    for (let i = 0; i < idsRetires.length; i++) {
        try {
            await HomebrewService.remove(idsRetires[i]);
        } catch (e) {
            console.error('Échec de la suppression d\'une capacité retirée :', e);
            // Position au-delà du nombre de blocs affichés : ces échecs ne correspondent
            // à aucun bloc visible (déjà retiré côté auteur), l'appelant les distingue
            // ainsi des échecs de création/mise à jour.
            failed.push({ position: drafts.length + i + 1, message: messageDe(e) });
        }
    }

    return { saved, failed };
};
