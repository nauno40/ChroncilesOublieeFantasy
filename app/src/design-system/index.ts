/**
 * Point d'entrée du design system — les briques d'interface transverses, sans rien de
 * l'état applicatif.
 *
 * Il existe pour que ces composants soient consommables hors de l'application : par les
 * maquettes de claude.ai/design, qui construisent alors avec les vrais composants plutôt
 * qu'avec des approximations. Ce qui vit ici est du vocabulaire partagé ; tout ce qui
 * connaît une fiche de personnage, une campagne ou une entrée de bibliothèque n'y a pas
 * sa place.
 */
export * from '../components/common';
export { DesignSystemProvider } from './provider';
export { LEXIQUE } from '../domain/lexique';
