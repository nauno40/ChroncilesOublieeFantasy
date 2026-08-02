import { HOMEBREW_SCHEMAS, type HomebrewChild } from './homebrewSchemas';

/**
 * Une valeur est-elle renseignée ? `0` compte comme une valeur ; un bloc de
 * caractéristiques entièrement à zéro compte comme vide. Ce prédicat était défini dans
 * HomebrewFields ; il est remonté ici pour que formulaire et validation partagent la
 * même sémantique.
 */
export const hasValue = (v: unknown): boolean => {
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.some(x => x !== undefined && x !== null && String(x).trim() !== '');
    if (typeof v === 'object') return Object.values(v as Record<string, unknown>).some(x => Number(x) !== 0);
    return true;
};

export interface HomebrewFieldError {
    /** Clé du champ fautif, ou chaîne vide pour une erreur transverse. */
    key: string;
    message: string;
}

/** Champs de l'équipement qui s'excluent mutuellement (cf. spec). */
const CHAMPS_ARME = ['damage', 'range', 'critical'];
const CHAMPS_ARMURE = ['acBonus', 'acMaxAgi', 'acPenalty'];

export const validateHomebrew = (
    category: string,
    name: string,
    data: Record<string, unknown>,
    children: HomebrewChild[] = [],
): HomebrewFieldError[] => {
    const erreurs: HomebrewFieldError[] = [];

    if (!name || name.trim() === '') {
        erreurs.push({ key: 'name', message: 'Le nom est obligatoire.' });
    }

    for (const champ of HOMEBREW_SCHEMAS[category] ?? []) {
        if (champ.required === false) continue;
        if (!hasValue(data[champ.key])) {
            erreurs.push({ key: champ.key, message: `« ${champ.label} » est obligatoire.` });
        }
    }

    // Règle de cohérence : un équipement est une arme, ou une armure, ou ni l'un ni
    // l'autre — jamais les deux. Les champs correspondants sont donc non requis.
    if (category === 'equipement' || category === 'objet-magique') {
        const arme = CHAMPS_ARME.some(k => hasValue(data[k]));
        const armure = CHAMPS_ARMURE.some(k => hasValue(data[k]));
        if (arme && armure) {
            erreurs.push({
                key: '',
                message: "Renseignez soit les champs d'arme (dégâts, portée, critique), soit ceux d'armure (bonus de DEF, AGI max, malus) — pas les deux.",
            });
        }
    }

    children.forEach((enfant, index) => {
        const position = index + 1; // ce que l'auteur voit à l'écran
        for (const e of validateHomebrew(enfant.category, enfant.name, enfant.data)) {
            erreurs.push({
                key: `capacites.${index}.${e.key}`,
                message: `capacité ${position} — ${e.message}`,
            });
        }
    });

    return erreurs;
};
