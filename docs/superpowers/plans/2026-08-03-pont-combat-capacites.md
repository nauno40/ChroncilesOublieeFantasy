# États déclarés et invocations — plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser superpowers:subagent-driven-development
> (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes
> utilisent la syntaxe à cases (`- [ ]`) pour le suivi.

**But :** une capacité de créature déclare les états qu'elle inflige et les entités qu'elle
invoque ; la fiche de créature les affiche en liens, et le suivi de combat permet de poser
l'état sur une cible ou d'ajouter la créature invoquée au combat.

**Architecture :** deux clés facultatives (`states`, `summons`) sur le JSON déjà libre des
capacités de créatures ; cinq fonctions pures dans `app/src/domain/capabilityRefs.ts` qui
résolvent ces déclarations vers des entités existantes ; un composant de rendu unique,
`CapabilityRefs`, consommé par la fiche **et** par le suivi de combat.

**Pile :** React 19 + TypeScript + Vite, Tailwind v4 (thème CSS dans `src/index.css`, **pas**
de `tailwind.config.js`), Vitest, données de bestiaire en JSON dans `backend/data/`.

## Contraintes globales

- **Code et commentaires en français.** Messages de commit en français, conventionnels.
- **Contrat de dégradation propre :** un champ absent vaut `undefined` — jamais `null`, `""`,
  `0`, tableau ou objet vide. Une section sans donnée n'est pas rendue.
- **La valeur `0` est légitime**, jamais « vide ».
- **Aucune automatisation :** une déclaration n'offre qu'un bouton, le MJ agit.
- **Une invocation désigne toujours une entité existante.** Aucune création implicite.
- **Un champ présent dans un modèle et couvert par un test unitaire ne prouve rien sur son
  affichage** — deux défauts de ce type ont déjà échappé aux revues de ce dépôt. Tout rendu
  se vérifie dans le DOM.
- **Un seul composant de rendu** pour les états et invocations d'une capacité. Deux rendus
  parallèles divergeront : c'est arrivé trois fois dans ce dépôt (cartes de capacité).
- **Tests de rendu :** environnement déclaré par fichier via `// @vitest-environment jsdom` ;
  `globals: true` n'est **pas** activé — importer explicitement `describe`/`it`/`expect`/`vi`
  depuis `vitest`, et appeler explicitement `afterEach(cleanup)`.
- **Portes, à lancer dans le conteneur** (le `node_modules` de l'hôte est incomplet), depuis
  la racine du dépôt :
  ```
  docker compose exec -T frontend sh -lc 'npx vitest run'
  docker compose exec -T frontend sh -lc 'npx tsc -b'
  docker compose exec -T frontend sh -lc 'npx eslint .'
  ```
  Référence de départ : **303 tests verts**, `tsc` propre, **46 problèmes eslint préexistants**
  (40 erreurs `no-explicit-any` + 6 avertissements). La porte est « aucune erreur **nouvelle** ».
- **Commiter au fil de l'eau**, un commit par étape logique. Ne pas pousser, ne pas créer de
  branche : le travail se fait sur la branche déjà en place.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `app/src/types/normalized.ts` *(modifié)* | `CapabilitySummon` ; `states`/`summons` sur `CustomCreatureCapability` |
| `app/src/domain/capabilityRefs.ts` *(créé)* | Les cinq fonctions pures : résolution d'états, d'invocations, capacités d'un combattant |
| `app/src/domain/capabilityRefs.test.ts` *(créé)* | Leurs tests unitaires (Node, sans DOM) |
| `scripts/declarer-etats.mjs` *(créé)* | Outil d'amorçage, exécuté une fois, hors application |
| `backend/data/creatures.json` *(modifié)* | Déclarations `states` amorcées puis relues |
| `app/src/components/creature/CapabilityRefs.tsx` *(créé)* | **Le** rendu des pastilles d'état et liens d'invocation |
| `app/src/components/creature/CapabilityRefs.test.tsx` *(créé)* | Son test de rendu (jsdom) |
| `app/src/pages/CreatureDetail.tsx` *(modifié)* | Consomme `CapabilityRefs` sous chaque capacité |
| `app/src/pages/States.tsx` *(modifié)* | Lit `?q=` pour servir de cible aux liens d'états |
| `app/src/components/creature/CombatantCapabilities.tsx` *(créé)* | Le panneau replié des capacités d'un combattant |
| `app/src/components/creature/CombatantCapabilities.test.tsx` *(créé)* | Son test de rendu (jsdom) |
| `app/src/pages/CombatTracker.tsx` *(modifié)* | Monte le panneau, choisit la cible d'un état, ajoute l'invocation |

**Écart assumé par rapport à la conception :** celle-ci annonçait une source `objets:
Equipment[]`. Le plan utilise `armes: Weapon[]` et `armures: Armor[]` séparément, parce que
le lien vers la liste d'équipement a besoin de l'onglet (`?tab=weapons` ou `?tab=armors`) et
que `Equipment` n'existe pas comme type unique dans `app/src/types/normalized.ts` — seuls
`Weapon` et `Armor` y sont définis. Le comportement visé est inchangé.

---

### Task 1 : Types et résolution canonique des états

**Fichiers :**
- Modifier : `app/src/types/normalized.ts` (après `CustomCreatureCapability`, ligne ~344)
- Créer : `app/src/domain/capabilityRefs.ts`
- Créer : `app/src/domain/capabilityRefs.test.ts`

**Interfaces :**
- Consomme : `HarmfulState` (`app/src/types/normalized.ts:211`), qui porte `{ id, name, description, image }`.
- Produit :
  - `interface CapabilitySummon { type: 'creature' | 'item'; ref: string; quantity?: number }`
  - `CustomCreatureCapability` gagne `states?: string[]` et `summons?: CapabilitySummon[]`
  - `resoudreEtat(declare: string, etatsConnus: HarmfulState[]): string | undefined`
  - `etatsDeclares(capacite: CustomCreatureCapability, etatsConnus: HarmfulState[]): string[]`
  - `lienEtat(nom: string): string`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

Créer `app/src/domain/capabilityRefs.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { resoudreEtat, etatsDeclares, lienEtat } from './capabilityRefs';
import type { HarmfulState } from '../types/normalized';

// Les 8 états du compendium, dans leur orthographe canonique.
const ETATS: HarmfulState[] = [
    'Affaibli', 'Aveuglé', 'Étourdi', 'Immobilisé',
    'Paralysé', 'Ralenti', 'Renversé', 'Surpris',
].map((name, i) => ({ id: String(i + 1), name, description: '', image: '' }));

describe('resoudreEtat', () => {
    it('accepte l’orthographe canonique', () => {
        expect(resoudreEtat('Étourdi', ETATS)).toBe('Étourdi');
    });

    it('ignore la casse et les accents', () => {
        expect(resoudreEtat('etourdi', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('ÉTOURDI', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('ETOURDI', ETATS)).toBe('Étourdi');
    });

    it('ignore l’accord — le féminin et le pluriel n’ajoutent qu’un suffixe', () => {
        expect(resoudreEtat('Étourdie', ETATS)).toBe('Étourdi');
        expect(resoudreEtat('Renversée', ETATS)).toBe('Renversé');
        expect(resoudreEtat('Immobilisées', ETATS)).toBe('Immobilisé');
        // « Surprise » est la forme féminine de « Surpris » : le nom connu en est un préfixe.
        expect(resoudreEtat('Surprise', ETATS)).toBe('Surpris');
    });

    it('écarte ce qui ne correspond à aucun état connu', () => {
        expect(resoudreEtat('Enflammé', ETATS)).toBeUndefined();
        expect(resoudreEtat('', ETATS)).toBeUndefined();
    });
});

describe('etatsDeclares', () => {
    it('résout chaque déclaration vers son nom canonique', () => {
        const cap = { name: 'Fauchage', states: ['Renversée', 'surpris'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Renversé', 'Surpris']);
    });

    it('fusionne deux orthographes du même état en une seule entrée', () => {
        // Sinon le suivi de combat poserait deux pastilles pour une seule mécanique.
        const cap = { name: 'Choc', states: ['Renversé', 'Renversée', 'RENVERSEES'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Renversé']);
    });

    it('écarte une déclaration périmée sans faire disparaître les autres', () => {
        const cap = { name: 'Mixte', states: ['Enflammé', 'Ralenti'] };
        expect(etatsDeclares(cap, ETATS)).toEqual(['Ralenti']);
    });

    it('rend un tableau vide quand rien n’est déclaré', () => {
        expect(etatsDeclares({ name: 'Rien' }, ETATS)).toEqual([]);
        expect(etatsDeclares({ name: 'Vide', states: [] }, ETATS)).toEqual([]);
    });
});

describe('lienEtat', () => {
    it('mène à la liste des états filtrée sur le nom', () => {
        expect(lienEtat('Étourdi')).toBe('/states?q=%C3%89tourdi');
    });
});
```

- [ ] **Étape 2 : lancer les tests pour vérifier qu'ils échouent**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/domain/capabilityRefs.test.ts'
```
Attendu : ÉCHEC — le module `./capabilityRefs` n'existe pas.

- [ ] **Étape 3 : ajouter les types**

Dans `app/src/types/normalized.ts`, juste après l'interface `CustomCreatureCapability` :

```ts
/**
 * Entité invoquée par une capacité. Elle EXISTE toujours déjà : on ne crée rien depuis
 * une invocation, ce qui interdit l'enchaînement sans fin de formulaires.
 *
 * `ref` désigne le **nom** pour le contenu officiel — `Creature` comme les tables
 * d'équipement utilisent `#[ORM\GeneratedValue]`, leurs identifiants changent à chaque
 * rechargement des fixtures — `custom-<id>` pour un monstre maison, `homebrew-<id>` pour
 * une entrée communautaire.
 */
export interface CapabilitySummon {
    type: 'creature' | 'item';
    ref: string;
    /** Nombre d'exemplaires ; absent, vaut 1. Sans objet pour un objet. */
    quantity?: number;
}
```

Puis, dans `CustomCreatureCapability`, ajouter les deux champs :

```ts
export interface CustomCreatureCapability {
    name: string;
    // Les capacités SRD (Creature.capabilities) nomment parfois via `label` plutôt que `name`.
    label?: string;
    rank?: number;
    description?: string;
    /** États infligés, déclarés — jamais devinés du texte à l'exécution. */
    states?: string[];
    /** Entités invoquées, toujours existantes. */
    summons?: CapabilitySummon[];
}
```

- [ ] **Étape 4 : écrire l'implémentation**

Créer `app/src/domain/capabilityRefs.ts` :

```ts
import type { CustomCreatureCapability, HarmfulState } from '../types/normalized';

/** Forme comparable d'un nom : sans casse ni accents, pour rapprocher « ÉTOURDI »,
 *  « etourdi » et « Étourdi ». */
const normaliser = (x: string): string =>
    x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Nom canonique de l'état désigné, quelles que soient sa casse, ses accents et son accord.
 *
 * Le rapprochement se fait par préfixe sur la forme normalisée : en français, le féminin et
 * le pluriel n'ajoutent qu'un suffixe (« Renversée », « Immobilisées », « Surprise »). Les
 * 8 noms connus ne sont préfixes d'aucun autre, donc au plus un correspond ; le tri par
 * longueur décroissante rend le choix déterministe si la liste venait à s'enrichir.
 *
 * `undefined` si rien ne correspond : une déclaration périmée ne doit pas produire une
 * pastille inapplicable.
 */
export const resoudreEtat = (declare: string, etatsConnus: HarmfulState[]): string | undefined => {
    const cible = normaliser(declare);
    if (cible === '') return undefined;
    return [...etatsConnus]
        .sort((a, b) => normaliser(b.name).length - normaliser(a.name).length)
        .find(e => cible.startsWith(normaliser(e.name)))
        ?.name;
};

/**
 * États d'une capacité, résolus vers leur nom canonique, sans doublon et dans l'ordre de
 * déclaration : deux orthographes du même état n'en font qu'un.
 */
export const etatsDeclares = (
    capacite: CustomCreatureCapability,
    etatsConnus: HarmfulState[],
): string[] => {
    const out: string[] = [];
    for (const declare of capacite.states ?? []) {
        const canonique = resoudreEtat(declare, etatsConnus);
        if (canonique && !out.includes(canonique)) out.push(canonique);
    }
    return out;
};

/** Chemin interne vers un état : la liste des états, filtrée sur son nom. Le compendium
 *  n'a pas de fiche d'état — cf. la conception, section « Cibles de liens ». */
export const lienEtat = (nom: string): string => `/states?q=${encodeURIComponent(nom)}`;
```

- [ ] **Étape 5 : lancer les tests pour vérifier qu'ils passent**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/domain/capabilityRefs.test.ts'
```
Attendu : SUCCÈS, 11 tests.

- [ ] **Étape 6 : lancer les portes complètes**

```
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
```
Attendu : tous les tests verts, `tsc` muet, eslint toujours à 46 problèmes.

- [ ] **Étape 7 : commiter**

```bash
git add app/src/types/normalized.ts app/src/domain/capabilityRefs.ts app/src/domain/capabilityRefs.test.ts
git commit -m "feat(domain): résolution canonique d'un état déclaré

Une capacité peut déclarer les états qu'elle inflige. La déclaration est ramenée
au nom canonique du compendium quelles que soient sa casse, ses accents et son
accord, et deux orthographes du même état n'en produisent qu'un."
```

---

### Task 2 : Résolution des invocations et capacités d'un combattant

**Fichiers :**
- Modifier : `app/src/domain/capabilityRefs.ts`
- Modifier : `app/src/domain/capabilityRefs.test.ts`

**Interfaces :**
- Consomme : `CapabilitySummon` (Task 1) ; `Combatant` (`app/src/types/campaign.ts:72`, champs
  utiles `source?: 'manual' | 'bestiary' | 'character'` et `referenceId?: string`) ;
  `Creature` (`normalized.ts:295`, `id: number`), `CustomCreature` (`id`, `capabilities?`),
  `Weapon` et `Armor` (`normalized.ts:154` et `:167`, tous deux `{ id: string; name: string }`),
  `HomebrewEntry` (`app/src/services/homebrewService.ts`, `{ id: number; name: string }`).
- Produit :
  - `type SourcesInvocation = { creatures: Creature[]; monstresMaison: CustomCreature[]; armes: Weapon[]; armures: Armor[]; communautaire: HomebrewEntry[] }`
  - `type InvocationResolue = { type: 'creature'; creature: Creature | CustomCreature; lien: string } | { type: 'item'; nom: string; lien: string }`
  - `resoudreInvocation(invocation: CapabilitySummon, sources: SourcesInvocation): InvocationResolue | undefined`
  - `capacitesDuCombattant(combattant: Combatant, creatures: Creature[], monstresMaison: CustomCreature[]): CustomCreatureCapability[] | undefined`

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

Ajouter à la fin de `app/src/domain/capabilityRefs.test.ts` :

```ts
import { resoudreInvocation, capacitesDuCombattant } from './capabilityRefs';
import type { Creature, CustomCreature, Weapon, Armor } from '../types/normalized';
import type { Combatant } from '../types/campaign';
import type { HomebrewEntry } from '../services/homebrewService';

const loup = { id: 7, name: 'Loup', capabilities: [{ name: 'Morsure' }] } as unknown as Creature;
const golem = { id: 3, name: 'Golem maison', capabilities: [{ name: 'Poing' }] } as unknown as CustomCreature;
const epee = { id: '11', name: 'Épée longue' } as unknown as Weapon;
const cotte = { id: '12', name: 'Cotte de mailles' } as unknown as Armor;
const relique = { id: 90, name: 'Relique communautaire' } as unknown as HomebrewEntry;

const SOURCES = {
    creatures: [loup],
    monstresMaison: [golem],
    armes: [epee],
    armures: [cotte],
    communautaire: [relique],
};

const combattant = (extra: Partial<Combatant>): Combatant => ({
    id: 'c1', name: 'X', type: 'monster', initiative: 10,
    hp: { current: 5, max: 5 }, def: 12, per: 0, tiebreak: 1, states: [],
    ...extra,
});

describe('resoudreInvocation', () => {
    it('résout une créature officielle par son nom, vers sa fiche', () => {
        const r = resoudreInvocation({ type: 'creature', ref: 'Loup' }, SOURCES);
        expect(r).toEqual({ type: 'creature', creature: loup, lien: '/bestiary/7' });
    });

    it('résout un monstre maison par le préfixe custom-', () => {
        const r = resoudreInvocation({ type: 'creature', ref: 'custom-3' }, SOURCES);
        expect(r).toEqual({ type: 'creature', creature: golem, lien: '/tools/monsters' });
    });

    it('résout une arme officielle vers la liste filtrée, onglet armes', () => {
        const r = resoudreInvocation({ type: 'item', ref: 'Épée longue' }, SOURCES);
        expect(r).toEqual({
            type: 'item', nom: 'Épée longue',
            lien: '/equipment?q=%C3%89p%C3%A9e%20longue&tab=weapons',
        });
    });

    it('résout une armure officielle vers l’onglet armures', () => {
        const r = resoudreInvocation({ type: 'item', ref: 'Cotte de mailles' }, SOURCES);
        expect(r && r.type === 'item' && r.lien).toContain('tab=armors');
    });

    it('résout un objet communautaire vers sa fiche pleine page', () => {
        const r = resoudreInvocation({ type: 'item', ref: 'homebrew-90' }, SOURCES);
        expect(r).toEqual({ type: 'item', nom: 'Relique communautaire', lien: '/homebrew/90' });
    });

    it('ne crée rien quand la référence ne désigne rien d’existant', () => {
        expect(resoudreInvocation({ type: 'creature', ref: 'Dragon' }, SOURCES)).toBeUndefined();
        expect(resoudreInvocation({ type: 'creature', ref: 'custom-999' }, SOURCES)).toBeUndefined();
        expect(resoudreInvocation({ type: 'item', ref: 'homebrew-999' }, SOURCES)).toBeUndefined();
        expect(resoudreInvocation({ type: 'item', ref: 'Bâton' }, SOURCES)).toBeUndefined();
    });
});

describe('capacitesDuCombattant', () => {
    it('rend les capacités d’un combattant venu du bestiaire', () => {
        const c = combattant({ source: 'bestiary', referenceId: '7' });
        expect(capacitesDuCombattant(c, [loup], [golem])).toEqual([{ name: 'Morsure' }]);
    });

    it('reconnaît un monstre maison par son préfixe', () => {
        const c = combattant({ source: 'bestiary', referenceId: 'custom-3' });
        expect(capacitesDuCombattant(c, [loup], [golem])).toEqual([{ name: 'Poing' }]);
    });

    it('ne rend rien pour un combattant ajouté à la main ou un personnage joueur', () => {
        expect(capacitesDuCombattant(combattant({ source: 'manual' }), [loup], [golem])).toBeUndefined();
        expect(capacitesDuCombattant(combattant({ source: 'character', referenceId: '7' }), [loup], [golem])).toBeUndefined();
    });

    it('ne rend rien quand la créature référencée n’existe plus', () => {
        // Le suivi de combat est persisté : un monstre maison peut avoir été supprimé depuis.
        const c = combattant({ source: 'bestiary', referenceId: 'custom-999' });
        expect(capacitesDuCombattant(c, [loup], [golem])).toBeUndefined();
    });

    it('ne rend rien plutôt qu’un tableau vide quand la créature n’a aucune capacité', () => {
        const muet = { id: 8, name: 'Rat', capabilities: [] } as unknown as Creature;
        const c = combattant({ source: 'bestiary', referenceId: '8' });
        expect(capacitesDuCombattant(c, [muet], [])).toBeUndefined();
    });
});
```

- [ ] **Étape 2 : lancer les tests pour vérifier qu'ils échouent**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/domain/capabilityRefs.test.ts'
```
Attendu : ÉCHEC — `resoudreInvocation` et `capacitesDuCombattant` ne sont pas exportées.

- [ ] **Étape 3 : écrire l'implémentation**

Ajouter à `app/src/domain/capabilityRefs.ts`. **Compléter l'import existant** posé par la
Task 1 (`CustomCreatureCapability`, `HarmfulState`) plutôt que d'en ouvrir un second sur le
même module :

```ts
import type {
    CapabilitySummon, CustomCreatureCapability, HarmfulState,
    Creature, CustomCreature, Weapon, Armor,
} from '../types/normalized';
import type { Combatant } from '../types/campaign';
import type { HomebrewEntry } from '../services/homebrewService';

/** Préfixe des identifiants de monstres maison, déjà employé par `CombatTracker`
 *  et `CampaignEncounters` pour distinguer un monstre maison d'une créature du bestiaire. */
const PREFIXE_MAISON = 'custom-';
/** Préfixe des entrées communautaires (`HomebrewEntry`). */
const PREFIXE_COMMUNAUTAIRE = 'homebrew-';

export type SourcesInvocation = {
    creatures: Creature[];
    monstresMaison: CustomCreature[];
    armes: Weapon[];
    armures: Armor[];
    communautaire: HomebrewEntry[];
};

export type InvocationResolue =
    | { type: 'creature'; creature: Creature | CustomCreature; lien: string }
    | { type: 'item'; nom: string; lien: string };

/**
 * Entité désignée par une invocation. Ne crée jamais rien : si la référence ne correspond
 * à rien d'existant, renvoie `undefined` et l'appelant n'affiche ni bouton ni lien.
 */
export const resoudreInvocation = (
    invocation: CapabilitySummon,
    sources: SourcesInvocation,
): InvocationResolue | undefined => {
    const { type, ref } = invocation;

    if (type === 'creature') {
        if (ref.startsWith(PREFIXE_MAISON)) {
            const maison = sources.monstresMaison.find(m => `${PREFIXE_MAISON}${m.id}` === ref);
            return maison ? { type: 'creature', creature: maison, lien: '/tools/monsters' } : undefined;
        }
        const officielle = sources.creatures.find(c => c.name === ref);
        return officielle
            ? { type: 'creature', creature: officielle, lien: `/bestiary/${officielle.id}` }
            : undefined;
    }

    if (ref.startsWith(PREFIXE_COMMUNAUTAIRE)) {
        const entree = sources.communautaire.find(e => `${PREFIXE_COMMUNAUTAIRE}${e.id}` === ref);
        return entree ? { type: 'item', nom: entree.name, lien: `/homebrew/${entree.id}` } : undefined;
    }

    // Objet officiel : le compendium n'a pas de fiche d'objet, on ouvre la liste
    // d'équipement filtrée — `Equipment.tsx` lit déjà `?q=` et `?tab=`.
    const arme = sources.armes.find(a => a.name === ref);
    const armure = arme ? undefined : sources.armures.find(a => a.name === ref);
    const trouve = arme ?? armure;
    if (!trouve) return undefined;
    const onglet = arme ? 'weapons' : 'armors';
    return {
        type: 'item',
        nom: trouve.name,
        lien: `/equipment?q=${encodeURIComponent(trouve.name)}&tab=${onglet}`,
    };
};

/**
 * Capacités d'un combattant, quand il vient du bestiaire. `undefined` pour un ajout manuel
 * ou un personnage joueur, dont les capacités passent par un tout autre chemin, et
 * `undefined` aussi quand la créature référencée n'existe plus — le suivi de combat est
 * persisté en `localStorage`, un monstre maison peut avoir été supprimé entre-temps.
 */
export const capacitesDuCombattant = (
    combattant: Combatant,
    creatures: Creature[],
    monstresMaison: CustomCreature[],
): CustomCreatureCapability[] | undefined => {
    if (combattant.source !== 'bestiary' || !combattant.referenceId) return undefined;
    const ref = combattant.referenceId;
    const source = ref.startsWith(PREFIXE_MAISON)
        ? monstresMaison.find(m => `${PREFIXE_MAISON}${m.id}` === ref)
        : creatures.find(c => String(c.id) === ref);
    const capacites = source?.capabilities;
    return capacites && capacites.length > 0 ? capacites : undefined;
};
```

Note : `encodeURIComponent` encode l'espace en `%20`, ce qu'attend le test.

- [ ] **Étape 4 : lancer les tests pour vérifier qu'ils passent**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/domain/capabilityRefs.test.ts'
```
Attendu : SUCCÈS, 22 tests.

- [ ] **Étape 5 : lancer les portes complètes et commiter**

```bash
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
git add app/src/domain/capabilityRefs.ts app/src/domain/capabilityRefs.test.ts
git commit -m "feat(domain): résolution des invocations et capacités d'un combattant

Une invocation désigne toujours une entité existante — créature du bestiaire,
monstre maison, arme, armure ou entrée communautaire — et n'en crée jamais.
Une référence qui ne correspond à rien ne produit aucun lien."
```

---

### Task 3 : Amorçage des déclarations sur le bestiaire officiel

**Fichiers :**
- Créer : `scripts/declarer-etats.mjs`
- Modifier : `backend/data/creatures.json`

**Interfaces :**
- Consomme : rien du code applicatif — le script est autonome, en Node ESM, et n'est **jamais**
  exécuté par l'application.
- Produit : les clés `states` sur les capacités de `creatures.json`.

**Contexte pour l'implémenteur.** Sans cet amorçage, la fonctionnalité est muette sur les
219 créatures officielles : la déclaration a été préférée à la détection textuelle
précisément parce qu'elle est relisible et corrigeable, mais elle doit bien être écrite une
première fois. Le script propose, un humain tranche.

Mesures faites sur les données actuelles, à retrouver après exécution : **393 capacités**, dont
**122** mentionnent un état, réparties sur **92 créatures**. Le rapprochement par préfixe
produit **4 correspondances** au-delà de l'accord simple, sur **3 formes distinctes** :
« aveuglées » et « aveuglent » (de vrais états), et « affaiblissements » — un **faux positif**,
dans une capacité de *guérison* qui retire les affaiblissements.

- [ ] **Étape 1 : écrire le script**

Créer `scripts/declarer-etats.mjs` :

```js
#!/usr/bin/env node
/**
 * Outil d'amorçage — À EXÉCUTER À LA MAIN, JAMAIS PAR L'APPLICATION.
 *
 * Propose une clé `states` sur chaque capacité de `backend/data/creatures.json`, à partir
 * des noms d'états trouvés dans son texte. Ce qui tourne en production ne lit qu'une
 * déclaration : cette détection n'est qu'une aide à la saisie, dont le résultat est relu
 * puis commité comme donnée.
 *
 * Usage :
 *   node scripts/declarer-etats.mjs            # rapport seul, n'écrit rien
 *   node scripts/declarer-etats.mjs --ecrire   # applique les déclarations au fichier
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FICHIER = 'backend/data/creatures.json';
const ETATS = ['Affaibli', 'Aveuglé', 'Étourdi', 'Immobilisé',
    'Paralysé', 'Ralenti', 'Renversé', 'Surpris'];

const normaliser = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sansBalises = x => String(x ?? '').replace(/<[^>]+>/g, ' ');

/** États cités par un texte, dans l'ordre des 8 noms connus, sans doublon. */
const etatsDuTexte = texte => {
    const mots = sansBalises(texte).match(/[A-Za-zÀ-ÿ]+/g) ?? [];
    const trouves = new Set();
    const suspects = [];
    for (const mot of mots) {
        const n = normaliser(mot);
        for (const etat of ETATS) {
            const ne = normaliser(etat);
            if (!n.startsWith(ne)) continue;
            trouves.add(etat);
            // Au-delà d'un accord simple (« Renversée », « Immobilisées »), la forme
            // mérite un œil : « affaiblissements » n'est pas l'état Affaibli.
            if (n.length > ne.length + 1) suspects.push({ mot, etat });
        }
    }
    return { etats: [...trouves], suspects };
};

const creatures = JSON.parse(readFileSync(FICHIER, 'utf8'));
const liste = Array.isArray(creatures) ? creatures : creatures.data;

let capacites = 0, declarees = 0;
const aRelire = [];

for (const creature of liste) {
    for (const cap of creature.capabilities ?? []) {
        capacites++;
        const { etats, suspects } = etatsDuTexte(cap.description);
        if (etats.length === 0) continue;
        declarees++;
        cap.states = etats;
        for (const s of suspects) {
            aRelire.push(`${creature.name} / ${cap.label ?? cap.name} : « ${s.mot} » → ${s.etat}`);
        }
    }
}

console.log(`${capacites} capacités, ${declarees} porteuses d'au moins un état.`);
console.log(`\n${aRelire.length} forme(s) à relire à la main :`);
for (const ligne of aRelire) console.log(`  - ${ligne}`);

if (process.argv.includes('--ecrire')) {
    writeFileSync(FICHIER, JSON.stringify(creatures, null, 2) + '\n', 'utf8');
    console.log(`\n${FICHIER} mis à jour.`);
} else {
    console.log('\nRapport seul — relancer avec --ecrire pour appliquer.');
}
```

- [ ] **Étape 2 : lancer le rapport, sans écrire**

```
node scripts/declarer-etats.mjs
```
Attendu : « 393 capacités, 122 porteuses d'au moins un état. » puis 3 formes à relire.
**Si les nombres diffèrent nettement, s'arrêter et le signaler** — les données ont changé
depuis la conception, et la relecture doit être refaite.

- [ ] **Étape 3 : appliquer, puis corriger le faux positif à la main**

```
node scripts/declarer-etats.mjs --ecrire
```

Puis ouvrir `backend/data/creatures.json` et **retirer** la déclaration fautive sur la
capacité de guérison du **Naga bon** : « affaiblissements » y désigne ce que la capacité
*retire*, pas ce qu'elle inflige. Vérifier de même les deux autres formes signalées
(« aveuglées », « aveuglent ») : celles-ci sont de vrais états et se conservent.

- [ ] **Étape 4 : vérifier le résultat dans la donnée**

```
node -e "const d=require('./backend/data/creatures.json');const l=Array.isArray(d)?d:d.data;
const c=l.flatMap(x=>x.capabilities??[]);
console.log('avec states :', c.filter(x=>x.states?.length).length);
console.log('exemple :', JSON.stringify(c.find(x=>x.states?.length)));"
```
Attendu : 121 capacités déclarées (122 moins le faux positif retiré), et un exemple
montrant `states`.

- [ ] **Étape 5 : recharger les fixtures et vérifier que l'API sert bien les déclarations**

```
docker compose exec -T backend bin/console doctrine:fixtures:load --no-interaction
curl -s 'http://localhost:8000/api/creatures?pagination=false' -H 'Accept: application/ld+json' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); m=d.get('hydra:member') or d.get('member') or []; \
c=[x for cr in m for x in (cr.get('capabilities') or []) if x.get('states')]; \
print('capacités déclarées servies par l API :', len(c)); print(c[0] if c else 'AUCUNE')"
```
Attendu : un compte non nul et un exemple portant `states`. **Si le compte est nul**, la clé
n'est pas sérialisée : s'arrêter et le signaler plutôt que de contourner.

- [ ] **Étape 6 : commiter**

```bash
git add scripts/declarer-etats.mjs backend/data/creatures.json
git commit -m "feat(data): déclaration des états infligés par les capacités du bestiaire

Amorçage des clés states sur les capacités de créatures, proposé par un script
d'auteur puis relu. Le faux positif signalé (« affaiblissements », dans une
capacité de guérison qui les retire) a été retiré à la main.

Le script reste au dépôt comme outil de saisie, jamais exécuté par l'application."
```

---

### Task 4 : Rendu partagé et fiche de créature

**Fichiers :**
- Créer : `app/src/components/creature/CapabilityRefs.tsx`
- Créer : `app/src/components/creature/CapabilityRefs.test.tsx`
- Modifier : `app/src/pages/CreatureDetail.tsx` (bloc des capacités, autour de la ligne 237)
- Modifier : `app/src/pages/States.tsx` (lecture de `?q=`)

**Interfaces :**
- Consomme : `etatsDeclares`, `lienEtat`, `resoudreInvocation`, `SourcesInvocation`,
  `InvocationResolue` (Tasks 1 et 2) ; `CustomCreatureCapability`, `HarmfulState`.
- Produit : `CapabilityRefs`, de signature
  `({ capacite, etatsConnus, sources, onEtat }: { capacite: CustomCreatureCapability; etatsConnus: HarmfulState[]; sources: SourcesInvocation; onEtat?: (etat: string) => void }) => JSX.Element | null`.
  Quand `onEtat` est fourni, un état est un **bouton** qui l'appelle (suivi de combat) ; sinon
  c'est un **lien** vers la liste des états (fiche). Les invocations sont toujours des liens ;
  la Task 5 ajoute l'action de combat à côté, sans toucher ce composant.

- [ ] **Étape 1 : écrire le test de rendu (il doit échouer)**

Créer `app/src/components/creature/CapabilityRefs.test.tsx` :

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CapabilityRefs } from './CapabilityRefs';
import type { HarmfulState, Creature } from '../../types/normalized';

afterEach(cleanup);

const ETATS: HarmfulState[] = [{ id: '1', name: 'Renversé', description: '', image: '' }];
const loup = { id: 7, name: 'Loup' } as unknown as Creature;
const SOURCES = { creatures: [loup], monstresMaison: [], armes: [], armures: [], communautaire: [] };

const rendre = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('CapabilityRefs', () => {
    it('affiche un état déclaré en lien vers la liste des états', () => {
        const capacite = { name: 'Fauchage', states: ['Renversée'] };
        rendre(<CapabilityRefs capacite={capacite} etatsConnus={ETATS} sources={SOURCES} />);
        const lien = screen.getByText('Renversé');
        expect(lien.closest('a')?.getAttribute('href')).toBe('/states?q=Renvers%C3%A9');
    });

    it('appelle onEtat au lieu de naviguer quand un gestionnaire est fourni', () => {
        const onEtat = vi.fn();
        const capacite = { name: 'Fauchage', states: ['Renversé'] };
        rendre(<CapabilityRefs capacite={capacite} etatsConnus={ETATS} sources={SOURCES} onEtat={onEtat} />);
        fireEvent.click(screen.getByText('Renversé'));
        expect(onEtat).toHaveBeenCalledWith('Renversé');
    });

    it('affiche une invocation résolue en lien vers son entité', () => {
        const capacite = { name: 'Appel', summons: [{ type: 'creature' as const, ref: 'Loup' }] };
        rendre(<CapabilityRefs capacite={capacite} etatsConnus={ETATS} sources={SOURCES} />);
        expect(screen.getByText(/Loup/).closest('a')?.getAttribute('href')).toBe('/bestiary/7');
    });

    it('n’affiche rien du tout quand la capacité ne déclare rien', () => {
        const { container } = rendre(
            <CapabilityRefs capacite={{ name: 'Simple' }} etatsConnus={ETATS} sources={SOURCES} />);
        expect(container.innerHTML).toBe('');
    });

    it('n’affiche ni état inconnu ni invocation introuvable', () => {
        const capacite = {
            name: 'Périmée',
            states: ['Enflammé'],
            summons: [{ type: 'creature' as const, ref: 'Dragon' }],
        };
        const { container } = rendre(
            <CapabilityRefs capacite={capacite} etatsConnus={ETATS} sources={SOURCES} />);
        expect(container.innerHTML).toBe('');
    });
});
```

- [ ] **Étape 2 : lancer le test pour vérifier qu'il échoue**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/components/creature/CapabilityRefs.test.tsx'
```
Attendu : ÉCHEC — le module n'existe pas.

- [ ] **Étape 3 : écrire le composant**

Créer `app/src/components/creature/CapabilityRefs.tsx` :

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap } from 'lucide-react';
import type { CustomCreatureCapability, HarmfulState } from '../../types/normalized';
import { etatsDeclares, lienEtat, resoudreInvocation, type SourcesInvocation } from '../../domain/capabilityRefs';

/**
 * États et invocations déclarés par une capacité — LE rendu de ces références, partagé par
 * la fiche de créature et le suivi de combat. Deux rendus parallèles divergeraient : ce
 * dépôt l'a déjà payé trois fois sur les cartes de capacité.
 *
 * Sans `onEtat`, un état est un lien vers la liste des états (lecture au compendium) ; avec,
 * c'est un bouton qui remonte le nom canonique à l'appelant (pose sur un combattant).
 * Rien n'est rendu quand la capacité ne déclare rien de résoluble.
 */
export const CapabilityRefs: React.FC<{
    capacite: CustomCreatureCapability;
    etatsConnus: HarmfulState[];
    sources: SourcesInvocation;
    onEtat?: (etat: string) => void;
}> = ({ capacite, etatsConnus, sources, onEtat }) => {
    const etats = etatsDeclares(capacite, etatsConnus);
    const invocations = (capacite.summons ?? [])
        .map(s => ({ invocation: s, resolue: resoudreInvocation(s, sources) }))
        .filter((x): x is { invocation: typeof x.invocation; resolue: NonNullable<typeof x.resolue> } => x.resolue !== undefined);

    if (etats.length === 0 && invocations.length === 0) return null;

    const styleEtat = 'inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-purple-900/40 text-purple-200 px-2 py-0.5 rounded border border-purple-500/30 hover:bg-purple-800/50 transition-colors';

    return (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {etats.map(etat => (onEtat ? (
                <button key={etat} type="button" onClick={() => onEtat(etat)} className={styleEtat}>
                    <Zap size={10} /> {etat}
                </button>
            ) : (
                <Link key={etat} to={lienEtat(etat)} className={styleEtat}>
                    <Zap size={10} /> {etat}
                </Link>
            )))}

            {invocations.map(({ invocation, resolue }, i) => (
                <Link
                    key={`${invocation.ref}-${i}`}
                    to={resolue.lien}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide bg-primary-950/40 text-primary-200 px-2 py-0.5 rounded border border-primary-500/30 hover:bg-primary-900/50 transition-colors"
                >
                    <Sparkles size={10} />
                    {resolue.type === 'creature' ? resolue.creature.name : resolue.nom}
                    {(invocation.quantity ?? 1) > 1 && ` ×${invocation.quantity}`}
                </Link>
            ))}
        </div>
    );
};
```

- [ ] **Étape 4 : lancer le test pour vérifier qu'il passe**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/components/creature/CapabilityRefs.test.tsx'
```
Attendu : SUCCÈS, 5 tests.

- [ ] **Étape 5 : brancher la fiche de créature**

Dans `app/src/pages/CreatureDetail.tsx`, charger les sources nécessaires puis rendre le
composant sous la description de chaque capacité.

En tête du composant, à côté des états déjà chargés ailleurs dans l'application :

```tsx
const [etatsConnus, setEtatsConnus] = useState<HarmfulState[]>([]);
const [sources, setSources] = useState<SourcesInvocation>({
    creatures: [], monstresMaison: [], armes: [], armures: [], communautaire: [],
});

useEffect(() => {
    // Les liens d'invocation ont besoin des entités existantes ; un échec de chargement
    // ne doit pas priver la page de ses capacités, seulement de ses liens.
    Promise.all([
        DataService.getStates().catch(() => []),
        DataService.getCreatures().catch(() => []),
        DataService.getWeapons().catch(() => []),
        DataService.getArmors().catch(() => []),
    ]).then(([etats, creatures, armes, armures]) => {
        setEtatsConnus(etats);
        setSources(s => ({ ...s, creatures, armes, armures }));
    });
}, []);
```

Puis, dans le bloc `creature.capabilities?.map(...)`, juste après le `<div>` de description
(vers la ligne 247), ajouter :

```tsx
<CapabilityRefs capacite={cap} etatsConnus={etatsConnus} sources={sources} />
```

Vérifier le nom réel des méthodes de `DataService` avant d'écrire (`app/src/services/dataService.ts`
expose notamment `getStates`, `getWeapons`, `getArmors`). Les monstres maison et le contenu
communautaire ne sont pas chargés ici : une créature **officielle** ne peut pas les invoquer,
puisque sa donnée est un fixture. Le champ reste vide, `resoudreInvocation` renvoie
`undefined`, et aucun lien mort n'apparaît.

- [ ] **Étape 6 : faire lire `?q=` à la liste des états**

Dans `app/src/pages/States.tsx`, remplacer l'initialisation de la recherche pour partir du
paramètre d'URL — c'est ce qui donne une cible aux liens d'états :

```tsx
import { useSearchParams } from 'react-router-dom';
// …
const [searchParams] = useSearchParams();
const { searchTerm, setSearchTerm, filteredItems } = useSearch(
    states,
    (state, term) => state.name.toLowerCase().includes(term.toLowerCase()),
    searchParams.get('q') ?? '',
);
```

Ouvrir `app/src/hooks/` pour vérifier la signature réelle de `useSearch` : **si elle
n'accepte pas de valeur initiale**, l'ajouter en troisième paramètre facultatif, avec sa
valeur par défaut `''`, sans changer le comportement des appelants existants (`Equipment.tsx`
lit déjà `?q=` de son côté — s'en inspirer plutôt que d'inventer un autre motif).

- [ ] **Étape 7 : lancer les portes complètes et commiter**

```bash
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
git add app/src/components/creature/ app/src/pages/CreatureDetail.tsx app/src/pages/States.tsx app/src/hooks/
git commit -m "feat(compendium): états et invocations sur la fiche de créature

Un composant unique rend les références d'une capacité — pastilles d'état et
liens d'invocation — pour la fiche comme, plus tard, pour le suivi de combat.
La liste des états lit désormais ?q=, ce qui donne une cible aux liens."
```

---

### Task 5 : Panneau de capacités du combattant

**Fichiers :**
- Créer : `app/src/components/creature/CombatantCapabilities.tsx`
- Créer : `app/src/components/creature/CombatantCapabilities.test.tsx`

**Interfaces :**
- Consomme : `CapabilityRefs` (Task 4) ; `resoudreInvocation`, `SourcesInvocation` (Task 2) ;
  `CustomCreatureCapability`, `HarmfulState`, `Creature`, `CustomCreature`.
- Produit : `CombatantCapabilities`, de signature
  ```ts
  ({ capacites, etatsConnus, sources, onPoserEtat, onInvoquer }: {
      capacites: CustomCreatureCapability[];
      etatsConnus: HarmfulState[];
      sources: SourcesInvocation;
      onPoserEtat: (etat: string) => void;
      onInvoquer: (creature: Creature | CustomCreature, quantite: number, refOrigine: string) => void;
  }) => JSX.Element
  ```

**Pourquoi un composant séparé.** Le panneau est monté dans `CombatTracker`, une page de plus
de 400 lignes qui charge quatre services et persiste son état. L'y tester exigerait de simuler
tout son amorçage, pour un test long et fragile qui prouverait peu. Isolé, il se teste
entièrement — et le suivi de combat n'a plus qu'à le brancher (Task 6).

- [ ] **Étape 1 : écrire le test de rendu (il doit échouer)**

Créer `app/src/components/creature/CombatantCapabilities.test.tsx` :

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CombatantCapabilities } from './CombatantCapabilities';
import type { HarmfulState, Creature } from '../../types/normalized';

afterEach(cleanup);

const ETATS: HarmfulState[] = [{ id: '1', name: 'Renversé', description: '', image: '' }];
const loup = { id: 7, name: 'Loup' } as unknown as Creature;
const SOURCES = { creatures: [loup], monstresMaison: [], armes: [], armures: [], communautaire: [] };

const CAPACITES = [
    { label: 'Fauchage', description: 'La victime est Renversée.', states: ['Renversée'] },
    { label: 'Appel de la meute', summons: [{ type: 'creature' as const, ref: 'Loup', quantity: 2 }] },
];

const monter = (props: Partial<React.ComponentProps<typeof CombatantCapabilities>> = {}) =>
    render(
        <MemoryRouter>
            <CombatantCapabilities
                capacites={CAPACITES}
                etatsConnus={ETATS}
                sources={SOURCES}
                onPoserEtat={props.onPoserEtat ?? (() => {})}
                onInvoquer={props.onInvoquer ?? (() => {})}
                {...props}
            />
        </MemoryRouter>,
    );

describe('CombatantCapabilities', () => {
    it('démarre replié, en annonçant le nombre de capacités', () => {
        monter();
        expect(screen.getByText('Capacités (2)')).toBeTruthy();
        expect(screen.queryByText('Fauchage')).toBeNull();
    });

    it('affiche les capacités une fois déplié', () => {
        monter();
        fireEvent.click(screen.getByText('Capacités (2)'));
        expect(screen.getByText('Fauchage')).toBeTruthy();
        expect(screen.getByText('La victime est Renversée.')).toBeTruthy();
    });

    it('remonte le nom CANONIQUE de l’état, pas la forme déclarée', () => {
        // La capacité déclare « Renversée » ; le suivi de combat doit recevoir « Renversé »,
        // sans quoi le combattant porterait un état absent du compendium.
        const onPoserEtat = vi.fn();
        monter({ onPoserEtat });
        fireEvent.click(screen.getByText('Capacités (2)'));
        fireEvent.click(screen.getByText('Renversé'));
        expect(onPoserEtat).toHaveBeenCalledWith('Renversé');
    });

    it('remonte la créature invoquée, sa quantité et sa référence d’origine', () => {
        const onInvoquer = vi.fn();
        monter({ onInvoquer });
        fireEvent.click(screen.getByText('Capacités (2)'));
        fireEvent.click(screen.getByText(/Ajouter Loup/));
        expect(onInvoquer).toHaveBeenCalledWith(loup, 2, 'Loup');
    });

    it('n’offre pas d’ajout au combat pour un objet — un objet n’est pas un combattant', () => {
        const onInvoquer = vi.fn();
        render(
            <MemoryRouter>
                <CombatantCapabilities
                    capacites={[{ label: 'Forge', summons: [{ type: 'item' as const, ref: 'Épée longue' }] }]}
                    etatsConnus={ETATS}
                    sources={{ ...SOURCES, armes: [{ id: '11', name: 'Épée longue' } as never] }}
                    onPoserEtat={() => {}}
                    onInvoquer={onInvoquer}
                />
            </MemoryRouter>,
        );
        fireEvent.click(screen.getByText('Capacités (1)'));
        expect(screen.queryByText(/Ajouter/)).toBeNull();
        // Le lien vers la fiche de l’objet, lui, reste offert par CapabilityRefs.
        expect(screen.getByText(/Épée longue/)).toBeTruthy();
    });
});
```

- [ ] **Étape 2 : lancer le test pour vérifier qu'il échoue**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/components/creature/CombatantCapabilities.test.tsx'
```
Attendu : ÉCHEC — le module n'existe pas.

- [ ] **Étape 3 : écrire le composant**

Créer `app/src/components/creature/CombatantCapabilities.tsx` :

```tsx
import React, { useState } from 'react';
import { CapabilityRefs } from './CapabilityRefs';
import { resoudreInvocation, type SourcesInvocation } from '../../domain/capabilityRefs';
import type {
    CustomCreatureCapability, HarmfulState, Creature, CustomCreature,
} from '../../types/normalized';

/**
 * Capacités d'un combattant au suivi de combat, repliées par défaut : la page sert sous
 * pression, elle ne doit pas s'allonger d'office.
 *
 * Le composant ne pose rien lui-même — il remonte l'intention (`onPoserEtat`, `onInvoquer`)
 * et laisse le suivi de combat décider de la cible. Séparé de `CombatTracker` pour être
 * testable sans simuler l'amorçage complet de la page.
 */
export const CombatantCapabilities: React.FC<{
    capacites: CustomCreatureCapability[];
    etatsConnus: HarmfulState[];
    sources: SourcesInvocation;
    onPoserEtat: (etat: string) => void;
    onInvoquer: (creature: Creature | CustomCreature, quantite: number, refOrigine: string) => void;
}> = ({ capacites, etatsConnus, sources, onPoserEtat, onInvoquer }) => {
    const [ouvert, setOuvert] = useState(false);

    return (
        <div className="mt-2 w-full">
            <button
                type="button"
                onClick={() => setOuvert(o => !o)}
                className="text-[10px] uppercase tracking-wide text-stone-500 hover:text-primary-400 transition-colors"
            >
                Capacités ({capacites.length})
            </button>

            {ouvert && (
                <div className="mt-2 space-y-2">
                    {capacites.map((cap, i) => (
                        <div key={i} className="bg-black/20 rounded-lg border border-white/5 p-2">
                            <div className="text-xs font-bold text-primary-300">{cap.label ?? cap.name}</div>
                            {cap.description && (
                                <p className="text-[11px] text-stone-400 leading-relaxed mt-1">{cap.description}</p>
                            )}

                            <CapabilityRefs
                                capacite={cap}
                                etatsConnus={etatsConnus}
                                sources={sources}
                                onEtat={onPoserEtat}
                            />

                            {/* Seule une créature s'ajoute au combat : un objet n'est pas un
                                combattant, son lien vers sa fiche suffit (cf. CapabilityRefs). */}
                            {(cap.summons ?? []).map((invocation, j) => {
                                const resolue = resoudreInvocation(invocation, sources);
                                if (!resolue || resolue.type !== 'creature') return null;
                                const quantite = invocation.quantity ?? 1;
                                return (
                                    <button
                                        key={`inv-${j}`}
                                        type="button"
                                        onClick={() => onInvoquer(resolue.creature, quantite, invocation.ref)}
                                        className="mt-2 text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-primary-900/40 border border-primary-500/30 text-primary-200 hover:bg-primary-800/50 transition-colors"
                                    >
                                        + Ajouter {resolue.creature.name}{quantite > 1 && ` ×${quantite}`} au combat
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
```

- [ ] **Étape 4 : lancer le test puis les portes, et commiter**

```bash
docker compose exec -T frontend sh -lc 'npx vitest run src/components/creature/CombatantCapabilities.test.tsx'
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
git add app/src/components/creature/CombatantCapabilities.tsx app/src/components/creature/CombatantCapabilities.test.tsx
git commit -m "feat(combat): panneau des capacités d'un combattant

Replié par défaut, il remonte l'intention — poser un état, invoquer une créature —
sans décider de la cible. Séparé de CombatTracker pour être testable sans simuler
l'amorçage complet de la page."
```

---

### Task 6 : Branchement dans le suivi de combat

**Fichiers :**
- Modifier : `app/src/pages/CombatTracker.tsx`

**Interfaces :**
- Consomme : `CombatantCapabilities` (Task 5) ; `capacitesDuCombattant`, `SourcesInvocation`
  (Tasks 1-2) ; l'état local et les fonctions déjà présents dans le fichier — `harmfulStates`,
  `creatures`, `customMonsters`, `state.combatants`, `addState(id, nom)`, `setState`,
  `rollTiebreak()`, et le motif d'ajout de `addFromBestiary` (vers la ligne 99).
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : constituer les sources d'invocation**

Dans `app/src/pages/CombatTracker.tsx`, à côté du chargement existant des états
(`DataService.getStates().then(setHarmfulStates)`, vers la ligne 69) :

```tsx
const [armes, setArmes] = useState<Weapon[]>([]);
const [armures, setArmures] = useState<Armor[]>([]);

useEffect(() => {
    // Un échec de chargement prive des liens d'invocation, jamais des capacités.
    DataService.getWeapons().then(setArmes).catch(() => setArmes([]));
    DataService.getArmors().then(setArmures).catch(() => setArmures([]));
}, []);

const sources: SourcesInvocation = useMemo(
    () => ({ creatures, monstresMaison: customMonsters, armes, armures, communautaire: [] }),
    [creatures, customMonsters, armes, armures],
);
```

- [ ] **Étape 2 : ajouter la pose d'état sur une cible choisie**

Un état local, puis le sélecteur de cible rendu **une seule fois**, au-dessus de la liste des
combattants :

```tsx
// Pose d'état en cours : la capacité a désigné l'état, le MJ choisit encore la cible.
const [poseEnCours, setPoseEnCours] = useState<string | null>(null);
```

```tsx
{poseEnCours && (
    <div className="mb-3 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30">
        <div className="text-xs text-purple-200 mb-2">
            Appliquer « {poseEnCours} » à quel combattant ?
        </div>
        <div className="flex flex-wrap gap-2">
            {state.combatants.map(cible => (
                <button
                    key={cible.id}
                    type="button"
                    onClick={() => { addState(cible.id, poseEnCours); setPoseEnCours(null); }}
                    className="text-[11px] px-2 py-1 rounded bg-black/40 border border-white/10 text-stone-200 hover:border-purple-400/50"
                >
                    Sur : {cible.name}
                </button>
            ))}
            <button type="button" onClick={() => setPoseEnCours(null)}
                className="text-[11px] px-2 py-1 rounded text-stone-500 hover:text-white">
                Annuler
            </button>
        </div>
    </div>
)}
```

Le bouton « Annuler » garantit qu'aucun mode ne reste coincé si le MJ change d'avis.

- [ ] **Étape 3 : ajouter la fonction d'invocation**

Calquée sur `addFromBestiary`, déjà dans le fichier — reprendre ses dérivations plutôt que
de les réinventer :

```tsx
/** Ajoute une créature invoquée aux combattants, par le même chemin que l'ajout depuis le
 *  bestiaire, pour que son initiative et son départage suivent les mêmes règles. */
const ajouterInvocation = (
    creature: Creature | CustomCreature,
    quantite: number,
    refOrigine: string,
) => {
    const nb = Math.max(1, quantite);
    const ajouts: Combatant[] = Array.from({ length: nb }, (_, i) => ({
        id: crypto.randomUUID(),
        name: nb > 1 ? `${creature.name} ${i + 1}` : creature.name,
        type: 'monster' as const,
        initiative: creature.init,
        hp: { current: creature.hp, max: creature.hp },
        def: creature.def,
        level: creature.nc ?? 0,
        per: creature.stats?.PER ?? 0,
        tiebreak: rollTiebreak(),
        states: [],
        source: 'bestiary' as const,
        // La référence d'origine dit déjà de quel espace vient la créature : un monstre
        // maison porte le préfixe, une créature officielle est nommée. Inutile — et fragile —
        // de le redeviner à partir de la forme de l'objet résolu.
        referenceId: refOrigine.startsWith('custom-') ? refOrigine : String(creature.id),
    }));
    setState(s => ({ ...s, combatants: [...s.combatants, ...ajouts] }));
};
```

- [ ] **Étape 4 : monter le panneau dans la ligne de combattant**

Sous le bloc des états existants (vers la ligne 318), à l'intérieur du rendu d'un combattant `c` :

```tsx
{(() => {
    const capacites = capacitesDuCombattant(c, creatures, customMonsters);
    if (!capacites) return null;
    return (
        <CombatantCapabilities
            capacites={capacites}
            etatsConnus={harmfulStates}
            sources={sources}
            onPoserEtat={setPoseEnCours}
            onInvoquer={ajouterInvocation}
        />
    );
})()}
```

- [ ] **Étape 5 : lancer les portes complètes**

```
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
```
Attendu : tous les tests verts, `tsc` muet, eslint toujours à 46 problèmes.

- [ ] **Étape 6 : vérifier à la main dans le navigateur**

La pile tourne (`docker compose ps`) : application sur `http://localhost:5173`, compte
`nauno40@gmail.com` / `chroniques`. Ouvrir le suivi de combat, ajouter un troll depuis le
bestiaire et un second combattant à la main, déplier « Capacités », poser « Renversé » sur le
**second** combattant, et vérifier que l'état atterrit sur lui. Ce contrôle rapide précède la
vérification systématique du contrôleur ; il évite de livrer un branchement mort.

- [ ] **Étape 7 : commiter**

```bash
git add app/src/pages/CombatTracker.tsx
git commit -m "feat(combat): capacités du combattant branchées au suivi de combat

Un combattant venu du bestiaire expose ses capacités. Un état déclaré se pose sur
la cible choisie en deux clics, une créature invoquée s'ajoute au combat par le
même chemin que l'ajout depuis le bestiaire."
```

---

## Vérification finale (contrôleur)

À faire une fois les cinq tâches passées en revue, avant la fusion.

- [ ] **Parcours navigateur**, desktop 1280×900 **et** mobile 390×844, via Docker :
  `docker run --rm --network host -v "$PWD/app/node_modules:/nm:ro" -v "<tmp>:/work" mcr.microsoft.com/playwright:v1.58.2-jammy node /work/<script>.mjs`,
  le script important Playwright par `import pkg from '/nm/playwright-core/index.js'`.
  Compte : `nauno40@gmail.com` / `chroniques` ; connexion par `POST /api/login_check` avec la
  clé **`email`**.
  1. Fiche du Troll (`/bestiary/:id`) : la capacité « Fauchage » porte la pastille
     « Renversé », qui mène à `/states?q=Renvers%C3%A9` et y filtre la liste.
  2. Suivi de combat : ajouter le Troll et un second combattant ; déplier « Capacités » ;
     cliquer « Renversé » ; choisir le second combattant ; l'état apparaît sur **lui** et
     non sur le Troll.
  3. Créer un monstre maison dont une capacité déclare
     `summons: [{ type: 'creature', ref: 'Loup', quantity: 2 }]` ; l'ajouter au combat ;
     le bouton d'invocation ajoute **deux** loups numérotés.
  4. Aucune erreur console, aucun débordement horizontal.
  **Attendre une condition, jamais `networkidle`** : ces pages chargent l'entité puis ses
  dépendances, et une mesure prise trop tôt produit un faux écart.
- [ ] **Non-régression** : un combattant ajouté à la main n'affiche aucun repli ; la liste
  déroulante « + État » fonctionne toujours.
