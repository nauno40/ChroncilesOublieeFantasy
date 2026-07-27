/**
 * Préchargement des chunks de route au survol / focus d'un lien de navigation.
 *
 * Chaque entrée est un thunk d'import dynamique vers le module de page. Comme le
 * bundler mémoïse un module par son URL, appeler ce thunk au survol démarre le
 * téléchargement du chunk ; quand l'utilisateur clique, le composant `React.lazy`
 * correspondant (dans App.tsx, même spécificateur d'import) se résout aussitôt.
 *
 * Les spécificateurs sont identiques à ceux d'App.tsx — à garder synchronisés si
 * une route est ajoutée/déplacée.
 */
const routeImports: Record<string, () => Promise<unknown>> = {
    '/dashboard': () => import('./pages/Home'),
    // Ma table
    '/campaign': () => import('./pages/Campaign'),
    '/characters': () => import('./pages/CharacterList'),
    // Compendium
    '/rules': () => import('./pages/Rules'),
    '/races': () => import('./pages/Races'),
    '/classes': () => import('./pages/Classes'),
    '/voies': () => import('./pages/Voies'),
    '/capacites': () => import('./pages/Capacites'),
    '/creatures': () => import('./pages/Creatures'),
    '/bestiary': () => import('./pages/Creatures'),
    '/equipment': () => import('./pages/Equipment'),
    '/mounts': () => import('./pages/Mounts'),
    '/provisions': () => import('./pages/Provisions'),
    // Aide de jeu
    '/tools/tracker': () => import('./pages/CombatTracker'),
    '/tools/dice': () => import('./pages/Dice'),
    '/tools/soundboard': () => import('./pages/SoundboardPage'),
    '/tools/magic-items': () => import('./pages/MagicItems'),
    '/states': () => import('./pages/States'),
    '/poisons': () => import('./pages/Poisons'),
    '/traps': () => import('./pages/Traps'),
    '/tools/monsters': () => import('./pages/CustomMonsters'),
    '/bibliotheque': () => import('./pages/Bibliotheque'),
};

// Évite de relancer l'import pour une route déjà préchargée.
const preloaded = new Set<string>();

/** Démarre le téléchargement du chunk d'une route (no-op si inconnue ou déjà faite). */
export function preloadRoute(path: string): void {
    if (preloaded.has(path)) return;
    const thunk = routeImports[path];
    if (!thunk) return;
    preloaded.add(path);
    thunk().catch(() => preloaded.delete(path)); // échec réseau : autoriser un nouvel essai
}
