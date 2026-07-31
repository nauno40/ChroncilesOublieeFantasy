import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // '.test.tsx' : tests de rendu (JSX) des feuilles de présentation — l'environnement
    // reste 'node' par défaut pour les 209 tests existants (fonctions pures) ; les
    // fichiers de rendu basculent en jsdom via un commentaire d'en-tête par fichier
    // (`// @vitest-environment jsdom`), pas ici.
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
