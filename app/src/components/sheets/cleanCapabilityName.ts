/**
 * Nettoie les marqueurs hérités de l'import Drupal encore présents dans certains noms
 * de capacité (astérisques, suffixe "(L)"/" L") — repris tel quel de `VoieDetail.tsx`/
 * `CapaciteDetail.tsx`. Purement cosmétique : le badge « Limité » reste piloté par le
 * champ `limited` (déjà calculé côté back à partir du même marqueur, cf.
 * `AppFixtures::loadPrestigeVoies`). Partagé par `VoieSheet` et `CapaciteSheet`.
 */
export const cleanCapabilityName = (name: string): string => {
    let displayName = name.replace(/\*/g, '');
    if (displayName.includes('(L)')) {
        displayName = displayName.replace('(L)', '').trim();
    } else if (displayName.endsWith(' L')) {
        displayName = displayName.slice(0, -2).trim();
    }
    return displayName;
};
