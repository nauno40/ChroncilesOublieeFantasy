/**
 * Options tactiques et manœuvres (COF2, chapitre « Combat »).
 *
 * Elles n'étaient ni listées ni jouables : un joueur qui voulait tenter une attaque assurée
 * ou désarmer son adversaire devait rouvrir le livre pour retrouver le modificateur.
 *
 * Ce module ne modélise QUE ce que le livre chiffre. Ce qu'il exprime autrement — des DM
 * divisés, un dé de DM supplémentaire, un état infligé — vit dans `effet`, une phrase
 * affichée telle quelle : le lanceur de dés ne jette pas les DM et n'applique pas d'état,
 * les appliquer à moitié serait pire que de les annoncer.
 */
export interface OptionTactique {
    id: string;
    label: string;
    /** Coût en action : `A` action d'attaque, `L` action limitée. */
    action: 'A' | 'L' | 'L ou A';
    /** Modificateur au test d'attaque, quand le livre en donne un chiffré. */
    attaque?: number;
    /**
     * Modificateur exprimé par une caractéristique (« Distraire (+CHA) ») : le lanceur ne
     * connaît pas le personnage, il l'affiche sans l'ajouter au calcul.
     */
    attaqueCarac?: string;
    /** Ce que l'option produit, dans les mots du livre. */
    effet: string;
    /** Manœuvre soumise au modificateur de taille (les lignes marquées d'un astérisque). */
    modifieParTaille?: boolean;
    /**
     * Le test se joue en OPPOSÉ, pas contre la DEF : « le PJ choisit une manœuvre et utilise
     * une action limitée pour faire un test opposé d'attaque au contact contre son
     * adversaire (pas de notion de réussite critique) ». Comparer une manœuvre à la DEF
     * donnerait un verdict qui n'existe pas dans les règles.
     */
    testOppose?: boolean;
}

/** Options tactiques ordinaires : elles remplacent ou accompagnent une attaque. */
export const OPTIONS_TACTIQUES: OptionTactique[] = [
    { id: 'assuree', label: 'Attaque assurée', action: 'A', attaque: 5, effet: 'DM divisés par 2.' },
    // Le livre donne deux dosages sur la même ligne : deux entrées plutôt qu'un choix à
    // trancher au moment du jet.
    { id: 'precise-3', label: 'Attaque précise/violente (‑3)', action: 'A', attaque: -3, effet: '+1d4° DM.' },
    { id: 'precise-7', label: 'Attaque précise/violente (‑7)', action: 'A', attaque: -7, effet: '+2d4° DM.' },
    { id: 'defense-partielle', label: 'Défense partielle', action: 'A', effet: '+3 en DEF et aux tests opposés pour résister, pendant 1 round.' },
    { id: 'defense-totale', label: 'Défense totale', action: 'L', effet: '+5 en DEF et aux tests opposés pour résister, pendant 1 round.' },
    { id: 'riposte', label: 'Riposte', action: 'L ou A', effet: 'Se préparer à riposter à une attaque au contact, une fois par round.' },
    { id: 'soutenir', label: 'Soutenir', action: 'L', effet: '+5 en attaque au contact à un allié, contre la créature désignée, pour 1 round.' },
];

/**
 * Manœuvres : un test opposé d'attaque au contact, sans notion de réussite critique, qui
 * n'inflige pas de DM mais produit un effet.
 */
export const MANOEUVRES: OptionTactique[] = [
    { id: 'distraire', label: 'Distraire', action: 'L', testOppose: true, attaqueCarac: 'CHA', effet: '‑10 aux tests de PER et ‑5 en DEF pendant 1 round ; considérée comme surprise pour les attaques sournoises.' },
    { id: 'gener', label: 'Gêner', action: 'L', testOppose: true, effet: 'Au choix : la cible est ralentie, ou subit ‑5 en attaque pendant 1 round.' },
    { id: 'repousser', label: 'Repousser', action: 'L', testOppose: true, modifieParTaille: true, effet: 'La cible recule de [FOR + 3] mètres ; acculée, elle perd autant en DEF pour 1 round.' },
    { id: 'bloquer', label: 'Bloquer', action: 'L', testOppose: true, attaque: -5, modifieParTaille: true, effet: 'La cible est immobilisée pendant 1 round.' },
    { id: 'desarmer', label: 'Désarmer', action: 'L', testOppose: true, attaque: -5, modifieParTaille: true, effet: 'La cible laisse tomber son arme au sol.' },
    { id: 'aveugler', label: 'Aveugler', action: 'L', testOppose: true, attaque: -5, effet: 'La cible est aveuglée pendant 1 round.' },
    { id: 'renverser', label: 'Renverser', action: 'L', testOppose: true, attaque: -5, modifieParTaille: true, effet: 'La cible est renversée. ‑10 au test contre un quadrupède.' },
    { id: 'etourdir', label: 'Étourdir', action: 'L', testOppose: true, attaque: -10, modifieParTaille: true, effet: 'La cible est étourdie pendant 1 round ; assommée sur un test de CON raté si elle était surprise et de NC inférieur.' },
];

/** Toutes les entrées, options puis manœuvres, dans l'ordre du livre. */
export const TOUTES_OPTIONS: OptionTactique[] = [...OPTIONS_TACTIQUES, ...MANOEUVRES];

export const optionTactique = (id: string): OptionTactique | undefined =>
    TOUTES_OPTIONS.find(o => o.id === id);

/**
 * Bonus d'attaque groupée (option réservée au MJ) : un seul d20 pour des créatures de même
 * profil agissant à la même initiative.
 *
 * « 2 créatures : +5 · 3 créatures : +10 · 4 créatures : touche automatique. » Au-delà de
 * quatre, le livre demande de répartir en deux groupes : c'est à l'appelant de le faire,
 * cette fonction décrit un groupe.
 */
export const bonusAttaqueGroupee = (nombre: number): number | 'automatique' => {
    if (nombre >= 4) return 'automatique';
    if (nombre === 3) return 10;
    if (nombre === 2) return 5;
    return 0;
};

/**
 * Note de taille des manœuvres marquées d'un astérisque, citée telle quelle.
 *
 * **Volontairement non calculée.** Le livre écrit « ‑5 au test par catégorie de taille de
 * moins par rapport à celle de l'attaquant, +5 par catégorie de taille de plus », et rien
 * ailleurs dans les règles ne lève l'ambiguïté sur le sujet de la comparaison : selon la
 * lecture, une cible plus petite rend la manœuvre plus facile ou plus difficile. Coder l'un
 * des deux sens reviendrait à trancher une règle à la place de son auteur — la note est
 * donc affichée, et le modificateur reste à la main du MJ.
 */
export const NOTE_TAILLE = '±5 par catégorie de taille d’écart avec l’attaquant (cf. livre — à arbitrer par le MJ).';
