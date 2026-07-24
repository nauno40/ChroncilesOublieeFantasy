// Shim de compatibilité : la logique de règles a été déplacée vers `domain/rules/*`
// (voir `domain/rules/index.ts` pour le détail des modules). Conservé pour ne pas
// casser les imports existants ; ne rien ajouter ici, éditer les modules sous
// `domain/rules/`.
export * from '../domain/rules';
