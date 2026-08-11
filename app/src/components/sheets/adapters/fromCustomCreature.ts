import type { CustomCreature } from '../../../types/normalized';
import type { CreatureSheetVM } from '../types';
import { str, num } from './shared';
import { creatureAttacksToVM, creatureCapsToVM } from './fromOfficial';

/**
 * Créature maison → feuille de créature.
 *
 * Une créature maison n'est PAS une entrée de bibliothèque (`HomebrewEntry`) : c'est une
 * entité à part (`custom_creatures`), d'où cet adaptateur distinct de `fromHomebrew`. Elle
 * partage en revanche la forme des attaques et des capacités avec le bestiaire officiel —
 * ces deux conversions sont donc importées plutôt que réécrites, ce qui est précisément
 * ce qui garantit que les deux fiches montrent les mêmes champs.
 *
 * Deux différences de nature, assumées :
 *  - ses textes sont saisis au clavier, pas en HTML : ils vont dans les champs `…Text`
 *    du view-model, que la feuille rend en `whitespace-pre-line` ;
 *  - elle n'a pas de famille de bestiaire (le champ n'existe pas côté formulaire).
 */
export const customCreatureToVM = (c: CustomCreature): CreatureSheetVM => ({
    name: c.name,
    // Pas d'illustration locale : `picture` si l'auteur en a fourni une, rien sinon —
    // la feuille masque alors le portrait et le bandeau plutôt que d'afficher un trou.
    image: str(c.picture),
    nc: num(c.nc),
    hp: num(c.hp),
    def: num(c.def),
    init: num(c.init),
    stats: c.stats as unknown as Record<string, number> | undefined,
    statsSuperior: c.statsSuperior,
    category: str(c.category),
    environment: str(c.environment),
    archetype: str(c.archetype),
    size: str(c.size),
    attacks: creatureAttacksToVM(c.attacks),
    capabilities: creatureCapsToVM(c.capabilities),
    specialAbilitiesText: str(c.specialAbilities?.text),
    descriptionText: str(c.description),
});
