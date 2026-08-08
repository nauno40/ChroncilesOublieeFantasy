/**
 * Compile la feuille de style du design system.
 *
 * Les composants sont écrits en classes utilitaires Tailwind : sans cette compilation,
 * `src/index.css` n'est qu'un `@import "tailwindcss"` que rien ne résout hors de Vite, et
 * les aperçus rendent sans style. On y ajoute l'appel aux familles de caractères, servies
 * à l'exécution comme dans l'application.
 *
 * Sortie : `src/design-system/styles.built.css` (généré, non versionné).
 * Lancer avec : `node scripts/build-ds-css.mjs` depuis `app/`.
 */
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { readFileSync, writeFileSync } from 'node:fs';

const POLICES = '@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap");\n';

const entree = 'src/index.css';
const sortie = 'src/design-system/styles.built.css';

const resultat = await postcss([tailwind.default ?? tailwind])
    .process(readFileSync(entree, 'utf8'), { from: entree, to: sortie });

writeFileSync(sortie, POLICES + resultat.css);
console.log(`${sortie} : ${Math.round((POLICES + resultat.css).length / 1024)} Ko`);
