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
    /**
     * Chaque échec porte :
     * - `position` : la position affichée à l'auteur (indice + 1, comme dans
     *   `validateHomebrew`) **dans `drafts` ci-dessous**, donc dans l'état que le
     *   formulaire affichera après l'appel — y compris pour une capacité réapparue
     *   parce que sa suppression a échoué ;
     * - `nature` : ce qui a échoué. Explicite, car elle ne se déduit pas de la
     *   position : une capacité dont la suppression échoue réapparaît dans `drafts`,
     *   sa position devient donc celle d'un bloc visible comme les autres ;
     * - `message` : l'erreur brute, jamais préfixée ici (le préfixage « Capacité N — »
     *   est le rôle de l'appelant).
     */
    failed: { position: number; nature: 'enregistrement' | 'suppression'; message: string }[];
    /**
     * L'état réel des capacités après cet appel : à substituer tel quel à l'état local
     * du formulaire, pour qu'une reprise ne recrée jamais ce qui a déjà réussi.
     *
     * - Créée avec succès → porte désormais son id serveur.
     * - Mise à jour (réussie ou non) → garde son id d'origine, inchangé.
     * - Création en échec → reste sans id, telle quelle (une reprise la recréera : il
     *   n'existe encore rien côté serveur pour elle).
     * - Retirée par l'auteur → absente d'ici, que la suppression ait réussi ou non.
     *   Une suppression en échec se rattrape par `confirmed`, pas en remettant la
     *   capacité sous les yeux de l'auteur.
     */
    drafts: ChildDraft[];
    /**
     * Les capacités qui existent réellement côté serveur après cet appel — à substituer
     * telle quelle à la liste des capacités confirmées du formulaire, et à repasser en
     * 4ᵉ argument lors d'une reprise.
     *
     * Une suppression qui a échoué y figure toujours : c'est ce qui fait qu'une reprise
     * la retente au lieu de l'oublier. Une suppression réussie en disparaît.
     */
    confirmed: ChildDraft[];
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
 * Les positions se rapportent aux brouillons renvoyés par `saveChildren` — que le
 * formulaire adopte comme nouvel état. Une suppression refusée y fait réapparaître sa
 * capacité : elle désigne donc un bloc bien visible, qu'il faut signaler comme les
 * autres. La garde sur `blocsVisibles` ne protège que du cas dégénéré où l'appelant
 * n'aurait pas adopté ces brouillons : on ne signale jamais un bloc inexistant.
 */
export const echecsCapacitesEnErreurs = (
    failed: SaveChildrenResult['failed'],
    blocsVisibles: number,
): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const f of failed) {
        if (f.position > blocsVisibles) continue;
        out[`capacites.${f.position - 1}.`] = f.nature === 'suppression'
            ? 'La suppression de cette capacité a échoué — elle existe toujours.'
            : "Échec de l'enregistrement de cette capacité — réessayez.";
    }
    return out;
};

/**
 * Phrase de synthèse du bandeau d'erreur (`#erreurs-formulaire`). La nature de chaque
 * échec est lue telle quelle : parler d'enregistrement pour une suppression refusée
 * (ou l'inverse) désignerait à l'auteur une action qu'il n'a pas demandée.
 */
export const resumeEchecsCapacites = (failed: SaveChildrenResult['failed'], blocsVisibles: number): string => {
    const total = failed.length;
    const suppressions = failed.filter(f => f.nature === 'suppression').length;
    const enregistrements = total - suppressions;

    if (suppressions === 0) {
        return `La voie est enregistrée, mais ${total} capacité(s) sur ${blocsVisibles} n'a/n'ont pas pu être enregistrée(s) — corrigez puis réessayez :`;
    }
    if (enregistrements === 0) {
        return `La voie est enregistrée, mais ${total} capacité(s) retirée(s) n'a/n'ont pas pu être supprimée(s) — réessayez :`;
    }
    return `La voie est enregistrée, mais ${total} capacité(s) n'a/n'ont pas pu être enregistrée(s) ou supprimée(s) — corrigez puis réessayez :`;
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
            failed.push({ position: index + 1, nature: 'enregistrement', message: messageDe(e) });
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
    // Capacités toujours présentes côté serveur : celles qu'on vient d'y écrire, plus
    // celles qu'on n'a pas réussi à supprimer.
    const resteEnBase: ChildDraft[] = resultDrafts.filter(d => d.id !== undefined);

    for (let i = 0; i < aSupprimer.length; i++) {
        const cible = aSupprimer[i];
        try {
            await HomebrewService.remove(cible.id as number);
            // Succès : elle est bel et bien partie, elle ne reste nulle part.
        } catch (e) {
            console.error('Échec de la suppression d\'une capacité retirée :', e);
            // Elle ne réapparaît PAS parmi les brouillons : l'auteur l'a retirée, et la
            // lui remettre sous les yeux reviendrait à défaire son geste — pire, elle
            // redeviendrait « à conserver » et la reprise la mettrait à jour au lieu de
            // la resupprimer, alors que le message promet le contraire. Elle reste dans
            // les capacités confirmées, donc la prochaine tentative retentera bien la
            // suppression. Sa position est au-delà des blocs affichés : aucun bloc ne
            // lui correspond, seul le bandeau de synthèse en rend compte.
            failed.push({
                position: resultDrafts.length + failed.filter(f => f.nature === 'suppression').length + 1,
                nature: 'suppression',
                message: messageDe(e),
            });
            resteEnBase.push(cible);
        }
    }

    return { saved, failed, drafts: resultDrafts, confirmed: resteEnBase };
};
