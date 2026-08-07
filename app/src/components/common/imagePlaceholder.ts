/**
 * Vignette générique (l'initiale sur fond sombre), en SVG encodé dans l'URL : aucune
 * requête réseau, donc elle s'affiche même quand rien d'autre ne charge.
 *
 * Sert dans deux cas distincts qu'il ne faut pas confondre : *aucune* illustration
 * fournie (on la met d'emblée), et illustration fournie mais **injoignable** (on y
 * retombe dans `onError`). Le second cas arrive pour de bon : les illustrations
 * officielles du compendium sont hébergées sur un site tiers.
 */
export const imagePlaceholder = (name: string, ratio: 'card' | 'portrait' = 'card'): string => {
    const [width, height, fontSize] = ratio === 'portrait' ? [400, 533, 160] : [400, 300, 120];
    // `charAt(0)` seul suffit : un nom vide donne une vignette sans lettre, pas une erreur.
    const initiale = encodeURIComponent(name.charAt(0).toUpperCase());
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"%3E%3Crect fill="%23292524" width="${width}" height="${height}"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="${fontSize}" fill="%23f59e0b"%3E${initiale}%3C/text%3E%3C/svg%3E`;
};

/**
 * Handler `onError` d'une balise `<img>` : bascule sur la vignette générique. Idempotent —
 * remplacer la source déclenche un nouvel `error` si la vignette elle-même échouait, d'où
 * la garde qui évite la boucle.
 */
export const onImageError = (name: string, ratio: 'card' | 'portrait' = 'card') =>
    (e: React.SyntheticEvent<HTMLImageElement>) => {
        const repli = imagePlaceholder(name, ratio);
        if (e.currentTarget.src !== repli) e.currentTarget.src = repli;
    };
