# Capacités de personnage au suivi de combat — plan d'implémentation

> **Pour les agents :** SOUS-COMPÉTENCE REQUISE — utiliser superpowers:subagent-driven-development
> (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes
> utilisent la syntaxe à cases (`- [ ]`).

**But :** le suivi de combat affiche les capacités d'un personnage joueur selon son rang acquis,
et les capacités officielles de personnage déclarent les états qu'elles infligent.

**Architecture :** deux colonnes JSON nullables (`states`, `summons`) sur l'entité `Capability` ;
une fonction pure `capacitesDuPersonnage` sœur de `capacitesDuCombattant` ; le suivi de combat
essaie les deux chemins. Le rendu ne bouge pas — `CapabilityRefs` et `CombatantCapabilities`
prennent déjà la forme attendue.

**Pile :** Symfony 7.4 + API Platform 4.2 + Doctrine ORM 3 (PHP 8.3, PostgreSQL) ; React 19 +
TypeScript + Vite, Vitest ; données de compendium en JSON dans `backend/data/`.

## Contraintes globales

- **Code, commentaires et messages de commit en français**, conventionnels.
- **NE JAMAIS lancer `doctrine:fixtures:load`** — la commande purge les tables et la base de
  développement porte du contenu à conserver. Les migrations, elles, sont sûres : les deux
  colonnes sont **nullables**.
- **Contrat de dégradation propre :** un champ absent vaut `undefined` — jamais `null`, `""`,
  `0`, tableau ou objet vide. Une section sans donnée n'est pas rendue.
- **La valeur `0` est légitime**, jamais « vide ».
- **Aucune automatisation :** une déclaration n'offre qu'un bouton, le MJ agit.
- **Un champ présent dans un modèle et couvert par un test unitaire ne prouve rien sur son
  affichage.** Tout rendu se vérifie dans le DOM.
- **Tests de rendu :** environnement déclaré par fichier via `// @vitest-environment jsdom` ;
  `globals: true` n'est pas activé — importer explicitement `describe`/`it`/`expect`/`vi` depuis
  `vitest`, et appeler explicitement `afterEach(cleanup)`.
- **Portes front, dans le conteneur** (le `node_modules` de l'hôte est incomplet), depuis la
  racine du dépôt :
  ```
  docker compose exec -T frontend sh -lc 'npx vitest run'
  docker compose exec -T frontend sh -lc 'npx tsc -b'
  docker compose exec -T frontend sh -lc 'npx eslint .'
  ```
  Référence : **333 tests verts**, `tsc` propre, **46 problèmes eslint préexistants**. La porte
  est « aucune erreur **nouvelle** ».
- **Portes dorsales :** `docker compose exec -T backend bin/phpunit tests/Api/<Fichier>.php`
  (la suite complète est lente — lancer par fichier).
- **L'API omet les valeurs nulles** (`skip_null_values`) : une capacité sans `states` ne portera
  pas la clé, ce qui est normal — 230 des 650 capacités exposent déjà `effect` pour la même
  raison. Ne pas conclure à un défaut de sérialisation devant une clé absente.
- **Commiter au fil de l'eau.** Ne pas pousser, ne pas créer de branche.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `backend/src/Entity/Capability.php` *(modifié)* | Colonnes `states` et `summons`, leurs accesseurs |
| `backend/migrations/VersionYYYYMMDDHHMMSS.php` *(généré)* | Ajout des deux colonnes nullables |
| `backend/src/DataFixtures/AppFixtures.php` *(modifié)* | Lecture des deux clés aux **quatre** sites de création |
| `backend/tests/Api/CapabilityStatesTest.php` *(créé)* | L'API sert `states` quand il est renseigné |
| `app/src/types/normalized.ts` *(modifié)* | `states` / `summons` sur `Capacity` |
| `app/src/domain/capabilityRefs.ts` *(modifié)* | `capacitesDuPersonnage`, filtrée par rang acquis |
| `app/src/domain/capabilityRefs.test.ts` *(modifié)* | Ses tests unitaires |
| `app/src/pages/CombatTracker.tsx` *(modifié)* | Essaie le chemin bestiaire puis le chemin personnage |
| `scripts/declarer-etats.mjs` *(modifié)* | Accepte un fichier en argument, pour profils et peuples |
| `backend/data/Profils/*.json`, `backend/data/Races/*.json` *(modifiés)* | Déclarations amorcées puis relues |

---

### Task 1 : Colonnes `states` et `summons` sur `Capability`

**Fichiers :**
- Modifier : `backend/src/Entity/Capability.php`
- Modifier : `backend/src/DataFixtures/AppFixtures.php` (**quatre** sites)
- Créer : `backend/tests/Api/CapabilityStatesTest.php`
- Généré : une migration dans `backend/migrations/`

**Interfaces :**
- Consomme : rien des autres tâches.
- Produit : les propriétés `states: ?array` et `summons: ?array` sur `Capability`, servies par
  l'API sur `/api/capabilities` — c'est ce que la Task 2 lira côté front.

- [ ] **Étape 1 : écrire le test (il doit échouer)**

Créer `backend/tests/Api/CapabilityStatesTest.php`. Il suit le motif des autres tests du
dossier, qui étendent `ApiSecurityTestCase` (celui-ci fournit la remise à zéro du schéma et les
utilitaires d'authentification) :

```php
<?php

namespace App\Tests\Api;

use App\Entity\Capability;
use App\Entity\Voie;

/**
 * Une capacité peut déclarer les états qu'elle inflige. La colonne doit traverser la
 * sérialisation : sans cela, le suivi de combat ne verrait jamais la déclaration.
 */
final class CapabilityStatesTest extends ApiSecurityTestCase
{
    private function creerCapacite(?array $states, ?array $summons = null): Capability
    {
        $voie = new Voie();
        $voie->setName('Voie de test');
        $this->em->persist($voie);

        $capacite = new Capability();
        $capacite->setName('Frappe étourdissante');
        $capacite->setDescription('La cible doit réussir un test ou être Étourdie.');
        $capacite->setRank(1);
        $capacite->setIsSpell(false);
        $capacite->setLimited(false);
        $capacite->setVoie($voie);
        $capacite->setStates($states);
        $capacite->setSummons($summons);
        $this->em->persist($capacite);
        $this->em->flush();

        return $capacite;
    }

    public function testLesEtatsDeclaresSontServisParLApi(): void
    {
        $capacite = $this->creerCapacite(['Étourdi']);
        $id = $capacite->getId();
        // Sans ce clear, la réponse pourrait provenir de l'identity map plutôt que de la base.
        $this->em->clear();

        static::createClient()->request('GET', "/api/capabilities/{$id}");

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['states' => ['Étourdi']]);
    }

    public function testUneCapaciteSansDeclarationNePortePasLaCle(): void
    {
        // L'API omet les valeurs nulles : l'absence de clé est le comportement attendu,
        // pas un défaut de sérialisation.
        $capacite = $this->creerCapacite(null);
        $id = $capacite->getId();
        $this->em->clear();

        $reponse = static::createClient()->request('GET', "/api/capabilities/{$id}");

        $this->assertResponseIsSuccessful();
        $this->assertArrayNotHasKey('states', $reponse->toArray());
    }

    public function testUneInvocationDeclareeEstServieTelleQuelle(): void
    {
        $capacite = $this->creerCapacite(null, [['type' => 'creature', 'ref' => 'Loup', 'quantity' => 2]]);
        $id = $capacite->getId();
        $this->em->clear();

        static::createClient()->request('GET', "/api/capabilities/{$id}");

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['summons' => [['type' => 'creature', 'ref' => 'Loup', 'quantity' => 2]]]);
    }
}
```

**Vérifier avant d'écrire** que `ApiSecurityTestCase` expose bien `$this->em` ; si la propriété
porte un autre nom, s'aligner sur ce qu'utilisent les autres tests du dossier plutôt que
d'inventer.

- [ ] **Étape 2 : lancer le test pour vérifier qu'il échoue**

```
docker compose exec -T backend bin/phpunit tests/Api/CapabilityStatesTest.php
```
Attendu : ÉCHEC — `setStates()` n'existe pas.

- [ ] **Étape 3 : ajouter les colonnes et leurs accesseurs**

Dans `backend/src/Entity/Capability.php`, juste après la propriété `$details` :

```php
    /**
     * États infligés, par leur nom (`HarmfulState.name`). Déclarés, jamais devinés du
     * texte à l'exécution — une mécanique de jeu ne doit pas dépendre d'une heuristique.
     * Colonne dédiée plutôt qu'une clé de `details` : ce dernier est rendu tel quel par
     * DynamicDetailsRenderer, la déclaration s'y afficherait en JSON brut.
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['race:read', 'profile:read', 'voie:read'])]
    private ?array $states = null;

    /**
     * Entités invoquées : `{ type: 'creature'|'item', ref, quantity? }`. Posée par symétrie
     * avec les capacités de créatures et pour qu'aucune migration ne soit nécessaire le jour
     * où une invocation apparaît — aucune capacité de personnage n'en déclare aujourd'hui.
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['race:read', 'profile:read', 'voie:read'])]
    private ?array $summons = null;
```

Les groupes sont **exactement** ceux que portent déjà `effect` et `details` : les capacités sont
sérialisées comme sous-ressources d'une race, d'un profil ou d'une voie.

Puis les accesseurs, au même endroit que ceux de `details` :

```php
    public function getStates(): ?array
    {
        return $this->states;
    }

    public function setStates(?array $states): static
    {
        $this->states = $states;

        return $this;
    }

    public function getSummons(): ?array
    {
        return $this->summons;
    }

    public function setSummons(?array $summons): static
    {
        $this->summons = $summons;

        return $this;
    }
```

- [ ] **Étape 4 : générer et appliquer la migration**

```
docker compose exec -T backend bin/console doctrine:migrations:diff --no-interaction
docker compose exec -T backend bin/console doctrine:migrations:migrate --no-interaction
```

Ouvrir la migration générée et **vérifier qu'elle ne contient que** l'ajout des deux colonnes
nullables sur `capability`. Si `doctrine:migrations:diff` y a glissé autre chose — ce dépôt a
déjà connu un `CREATE SCHEMA public` parasite dans le `down()` de migrations passées — retirer
ce qui ne relève pas de cette tâche.

**Ne pas lancer `doctrine:fixtures:load`.**

- [ ] **Étape 5 : lire les deux clés aux quatre sites de fixtures**

`backend/src/DataFixtures/AppFixtures.php` construit une `Capability` à **quatre** endroits, et
non un seul — capacités de voies de peuple, de voies de prestige, de voies de profil, et
`loadCapabilities()` qui lit `capacites.json`. Les repérer par :

```
grep -n "new Capability()" backend/src/DataFixtures/AppFixtures.php
```

À chacun, après l'affectation de `details` (ou du dernier champ JSON du site), ajouter :

```php
            // Déclarations facultatives (cf. spec 2026-08-03) : absentes du JSON, elles
            // laissent les colonnes nulles. Les quatre sites doivent les lire, sinon une
            // partie du compendium resterait muette sans que rien ne le signale.
            $cap->setStates($capData['states'] ?? null);
            $cap->setSummons($capData['summons'] ?? null);
```

En adaptant le nom de la variable locale au site (`$c`, `$cap` ou `$e` selon l'endroit) et celui
du tableau source (`$capData` ou `$item`). **Vérifier les quatre** : c'est le point que la
conception signale explicitement.

- [ ] **Étape 6 : lancer le test pour vérifier qu'il passe**

```
docker compose exec -T backend bin/phpunit tests/Api/CapabilityStatesTest.php
```
Attendu : SUCCÈS, 3 tests.

- [ ] **Étape 7 : commiter**

```bash
git add backend/src/Entity/Capability.php backend/src/DataFixtures/AppFixtures.php backend/migrations backend/tests/Api/CapabilityStatesTest.php
git commit -m "feat(compendium): une capacité déclare ses états et ses invocations

Deux colonnes JSON nullables sur Capability, servies comme effect et details.
Colonne dédiée plutôt qu'une clé de details, que DynamicDetailsRenderer rendrait
en JSON brut sur la fiche. Les quatre sites de fixtures qui construisent une
capacité lisent les deux clés."
```

---

### Task 2 : `capacitesDuPersonnage`

**Fichiers :**
- Modifier : `app/src/types/normalized.ts`
- Modifier : `app/src/domain/capabilityRefs.ts`
- Modifier : `app/src/domain/capabilityRefs.test.ts`

**Interfaces :**
- Consomme : `Combatant` (`app/src/types/campaign.ts`, champs `source?: 'manual' | 'bestiary' | 'character'`
  et `referenceId?: string`) ; `Character` (`app/src/types/character.ts`, champs `id?: number` et
  `characterVoies: CharacterVoieRef[]`) ; `CharacterVoieRef` (`{ voie: string /* IRI */, rank: number }`) ;
  `Capacity` (`app/src/types/normalized.ts`, champs `id`, `name`, `description`, `rank: number | null`,
  `voie?: string /* IRI */`, `voieId: string | null`) ; `CustomCreatureCapability`.
- Produit : `capacitesDuPersonnage(combattant, personnages, capacites): CustomCreatureCapability[] | undefined`.

- [ ] **Étape 1 : écrire les tests (ils doivent échouer)**

Ajouter à la fin de `app/src/domain/capabilityRefs.test.ts` :

```ts
import { capacitesDuPersonnage } from './capabilityRefs';
import type { Character } from '../types/character';

// Une voie de 3 capacités ; le personnage n'en a acquis que 2 rangs.
const CAPS = [
    { id: '1', name: 'Rang 1', description: 'A', rank: 1, voie: '/api/voies/50', voieId: null, active: false, profileId: null },
    { id: '2', name: 'Rang 2', description: 'B', rank: 2, voie: '/api/voies/50', voieId: null, active: false, profileId: null },
    { id: '3', name: 'Rang 3', description: 'C', rank: 3, voie: '/api/voies/50', voieId: null, active: false, profileId: null },
    // Capacité d'une AUTRE voie, que le personnage ne possède pas.
    { id: '4', name: 'Étrangère', description: 'D', rank: 1, voie: '/api/voies/99', voieId: null, active: false, profileId: null },
] as unknown as Capacity[];

const heros = {
    id: 12, name: 'Héros', level: 3,
    characterVoies: [{ voie: '/api/voies/50', rank: 2, source: 'profile' }],
} as unknown as Character;

const combattantPerso = (extra: Partial<Combatant> = {}): Combatant => ({
    id: 'c9', name: 'Héros', type: 'player', initiative: 12,
    hp: { current: 10, max: 10 }, def: 13, per: 1, tiebreak: 5, states: [],
    source: 'character', referenceId: '12',
    ...extra,
});

describe('capacitesDuPersonnage', () => {
    it('ne rend que les capacités dont le rang est acquis', () => {
        // Rang 2 acquis : les capacités 1 et 2, jamais la 3 — proposer au MJ une capacité
        // que le personnage ne possède pas serait pire que ne rien afficher.
        const out = capacitesDuPersonnage(combattantPerso(), [heros], CAPS);
        expect(out?.map(c => c.name)).toEqual(['Rang 1', 'Rang 2']);
    });

    it('écarte les capacités des voies que le personnage n’a pas', () => {
        const out = capacitesDuPersonnage(combattantPerso(), [heros], CAPS);
        expect(out?.some(c => c.name === 'Étrangère')).toBe(false);
    });

    it('reconnaît une capacité qui référence sa voie par identifiant brut', () => {
        const parId = [{ id: '5', name: 'Brut', description: 'E', rank: 1, voie: undefined, voieId: '50', active: false, profileId: null }] as unknown as Capacity[];
        const out = capacitesDuPersonnage(combattantPerso(), [heros], parId);
        expect(out?.map(c => c.name)).toEqual(['Brut']);
    });

    it('trie par rang croissant, quel que soit l’ordre reçu', () => {
        const desordre = [CAPS[1], CAPS[0]] as unknown as Capacity[];
        const out = capacitesDuPersonnage(combattantPerso(), [heros], desordre);
        expect(out?.map(c => c.name)).toEqual(['Rang 1', 'Rang 2']);
    });

    it('reporte les déclarations de la capacité', () => {
        const declarante = [{ ...CAPS[0], states: ['Renversé'], summons: [{ type: 'creature', ref: 'Loup' }] }] as unknown as Capacity[];
        const out = capacitesDuPersonnage(combattantPerso(), [heros], declarante);
        expect(out?.[0].states).toEqual(['Renversé']);
        expect(out?.[0].summons).toEqual([{ type: 'creature', ref: 'Loup' }]);
    });

    it('ne rend rien pour un combattant qui n’est pas un personnage', () => {
        expect(capacitesDuPersonnage(combattantPerso({ source: 'manual' }), [heros], CAPS)).toBeUndefined();
        expect(capacitesDuPersonnage(combattantPerso({ source: 'bestiary' }), [heros], CAPS)).toBeUndefined();
    });

    it('ne rend rien quand le personnage est introuvable', () => {
        // Le suivi de combat est persisté : un personnage peut avoir été supprimé depuis.
        expect(capacitesDuPersonnage(combattantPerso({ referenceId: '999' }), [heros], CAPS)).toBeUndefined();
    });

    it('ne rend rien plutôt qu’un tableau vide quand aucun rang n’est acquis', () => {
        const debutant = { ...heros, characterVoies: [{ voie: '/api/voies/50', rank: 0, source: 'profile' }] } as unknown as Character;
        expect(capacitesDuPersonnage(combattantPerso(), [debutant], CAPS)).toBeUndefined();
    });
});
```

- [ ] **Étape 2 : lancer les tests pour vérifier qu'ils échouent**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/domain/capabilityRefs.test.ts'
```
Attendu : ÉCHEC — `capacitesDuPersonnage` n'est pas exportée.

- [ ] **Étape 3 : déclarer les deux champs côté front**

Dans `app/src/types/normalized.ts`, dans l'interface `Capacity`, après `details` :

```ts
    /** États infligés, déclarés (cf. colonne `Capability.states`). Absent tant que rien
     *  n'est déclaré : l'API omet les valeurs nulles. */
    states?: string[];
    /** Entités invoquées, déclarées (cf. colonne `Capability.summons`). */
    summons?: CapabilitySummon[];
```

`CapabilitySummon` est déjà défini dans ce fichier — ne pas le redéclarer.

- [ ] **Étape 4 : écrire l'implémentation**

Ajouter à `app/src/domain/capabilityRefs.ts`, en complétant les imports de types existants
(`Character` vient de `../types/character`, pas de `normalized`) :

```ts
/** Identifiant de voie porté par une capacité : tantôt une IRI (`/api/voies/50`), tantôt
 *  un identifiant brut. Même ambivalence que dans `fromOfficial.ts` (`capsOfVoie`). */
const idDeVoie = (v: string | null | undefined): string | undefined => {
    if (!v) return undefined;
    return String(v).split('/').pop() || undefined;
};

/**
 * Capacités d'un combattant PERSONNAGE : celles de ses voies dont le rang est acquis.
 *
 * Un personnage porte `characterVoies[] = { voie: IRI, rank }` ; un rang 3 donne les
 * capacités 1 à 3, pas les cinq de la voie — proposer au MJ une capacité que le
 * personnage ne possède pas serait pire que ne rien afficher.
 *
 * `undefined` pour tout autre combattant, pour un personnage introuvable — le suivi de
 * combat est persisté, un personnage peut avoir été supprimé depuis — ou quand aucune
 * capacité n'est acquise.
 */
export const capacitesDuPersonnage = (
    combattant: Combatant,
    personnages: Character[],
    capacites: Capacity[],
): CustomCreatureCapability[] | undefined => {
    if (combattant.source !== 'character' || !combattant.referenceId) return undefined;

    const personnage = personnages.find(p => String(p.id) === combattant.referenceId);
    if (!personnage) return undefined;

    // Rang acquis par voie : une capacité n'est retenue que si son rang lui est inférieur
    // ou égal.
    const rangParVoie = new Map<string, number>();
    for (const entree of personnage.characterVoies ?? []) {
        const id = idDeVoie(entree.voie);
        if (id) rangParVoie.set(id, Math.max(rangParVoie.get(id) ?? 0, entree.rank));
    }
    if (rangParVoie.size === 0) return undefined;

    const acquises = capacites
        .filter(c => {
            const id = idDeVoie(c.voie ?? c.voieId);
            if (!id) return false;
            const rangAcquis = rangParVoie.get(id);
            return rangAcquis !== undefined && (c.rank ?? 0) > 0 && (c.rank ?? 0) <= rangAcquis;
        })
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map((c): CustomCreatureCapability => ({
            name: c.name,
            description: c.description,
            rank: c.rank ?? undefined,
            states: c.states,
            summons: c.summons,
        }));

    return acquises.length > 0 ? acquises : undefined;
};
```

- [ ] **Étape 5 : lancer les tests puis les portes complètes**

```
docker compose exec -T frontend sh -lc 'npx vitest run src/domain/capabilityRefs.test.ts'
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
```
Attendu : tous verts, `tsc` muet, eslint toujours à 46 problèmes.

- [ ] **Étape 6 : commiter**

```bash
git add app/src/types/normalized.ts app/src/domain/capabilityRefs.ts app/src/domain/capabilityRefs.test.ts
git commit -m "feat(domain): capacités acquises d'un personnage

Les capacités des voies d'un personnage, filtrées par le rang réellement acquis :
un rang 2 donne les capacités 1 et 2, jamais les cinq de la voie."
```

---

### Task 3 : Branchement dans le suivi de combat

**Fichiers :**
- Modifier : `app/src/pages/CombatTracker.tsx`

**Interfaces :**
- Consomme : `capacitesDuPersonnage` (Task 2) ; `capacitesDuCombattant`, `SourcesInvocation`,
  `CombatantCapabilities` — déjà importés et utilisés dans le fichier ; l'état local existant
  `characters`, `creatures`, `customMonsters`, `harmfulStates`, `sources`, et les fonctions
  `setPoseEnCours` et `ajouterInvocation`.
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : charger les capacités du compendium**

À côté du chargement existant des états (`DataService.getStates().then(setHarmfulStates)`) :

```tsx
const [capacites, setCapacites] = useState<Capacity[]>([]);
```

et, dans le même `useEffect` que les armes et armures :

```tsx
    // Capacités du compendium : nécessaires pour résoudre celles d'un personnage joueur.
    // Un échec de chargement prive du panneau, jamais du suivi de combat.
    DataService.getCapabilities().then(setCapacites).catch(() => setCapacites([]));
```

Compléter l'import de types (`Capacity` vient de `../types/normalized`) et celui de
`capabilityRefs` pour y ajouter `capacitesDuPersonnage`.

- [ ] **Étape 2 : essayer les deux chemins**

Remplacer le corps de la fonction immédiate qui rend `CombatantCapabilities` :

```tsx
{(() => {
    // Deux chemins : le bestiaire d'abord, le personnage ensuite. Aucun ne répond pour
    // un combattant ajouté à la main.
    const capacitesDuBestiaire = capacitesDuCombattant(c, creatures, customMonsters);
    const capacitesAcquises = capacitesDuBestiaire ?? capacitesDuPersonnage(c, characters, capacites);
    if (!capacitesAcquises) return null;
    return (
        <CombatantCapabilities
            capacites={capacitesAcquises}
            etatsConnus={harmfulStates}
            sources={sources}
            onPoserEtat={setPoseEnCours}
            onInvoquer={ajouterInvocation}
        />
    );
})()}
```

**Pas de test de rendu pour cette tâche, et c'est délibéré.** La conception en prévoyait un ;
il n'apporterait rien ici. Le panneau `CombatantCapabilities` est déjà couvert en isolation, la
sélection des capacités l'est par les tests unitaires de la Task 2, et il ne reste qu'un
aiguillage d'une ligne. Le tester exigerait de simuler l'amorçage complet d'une page de plus de
400 lignes — un test long et fragile qui prouverait peu. Le parcours navigateur couvre ce
raccord.

- [ ] **Étape 3 : lancer les portes complètes**

```
docker compose exec -T frontend sh -lc 'npx vitest run'
docker compose exec -T frontend sh -lc 'npx tsc -b'
docker compose exec -T frontend sh -lc 'npx eslint .'
```
Attendu : tous verts, `tsc` muet, eslint toujours à 46 problèmes.

- [ ] **Étape 4 : vérifier à la main dans le navigateur**

La pile tourne. **Attention** : le port 8000 étant occupé par un autre service, nginx écoute sur
**8001** et le front pointe dessus — application sur `http://localhost:5173`, API sur
`http://localhost:8001/api`. Compte `nauno40@gmail.com` / `chroniques`.

Ouvrir le suivi de combat (`/tools/tracker`), ajouter un personnage joueur par le bouton
« + PJ », déplier « Capacités » et vérifier que seules les capacités de son rang apparaissent.
Ce contrôle précède la vérification systématique du contrôleur ; il évite de livrer un
branchement mort.

- [ ] **Étape 5 : commiter**

```bash
git add app/src/pages/CombatTracker.tsx
git commit -m "feat(combat): les capacités d'un personnage joueur au suivi de combat

Le panneau interroge le bestiaire puis le personnage : un combattant venu d'une
fiche de personnage expose les capacités de ses voies, limitées au rang acquis."
```

---

### Task 4 : Amorçage des déclarations sur les profils et les peuples

**Fichiers :**
- Modifier : `scripts/declarer-etats.mjs`
- Modifier : `backend/data/Profils/*.json` (14), `backend/data/Races/*.json` (8)

**Interfaces :**
- Consomme : rien du code applicatif — le script est autonome et n'est **jamais** exécuté par
  l'application.
- Produit : les clés `states` sur les capacités des JSON de profils et de peuples, que la Task 1
  a rendues lisibles par les fixtures.

**Contexte pour l'implémenteur.** Le script existe déjà et a servi au bestiaire : il propose des
déclarations à partir du texte, n'écrit qu'avec `--ecrire`, et signale les tournures qui
trahissent une **non-infliction**. Sur le bestiaire il a proposé 121 déclarations dont **15
étaient fausses** — préconditions d'usage (« attaque de dos ou par surprise »), résistances
(« pour éviter d'être surpris », « s'en débarrasser »), et un adverbe (« il chute au ralenti »).
Le crible sémantique couvrait 14 de ces 15 cas. **Le script propose, tu tranches.**

- [ ] **Étape 1 : rendre le fichier traité paramétrable**

Le script vise aujourd'hui `backend/data/creatures.json` en dur et parcourt
`creature.capabilities`. **La forme de ces deux familles de fichiers est différente, et
différente entre elles** — vérifiée :

| Source | Chemin des capacités |
|---|---|
| `backend/data/Profils/*.json` (14) | `paths[].abilities[]` |
| `backend/data/Races/*.json` (8) | `voies[].abilities[]` |

Une capacité y porte `{ rank, name, type, description }` (`details` en plus selon les cas) —
le texte à examiner reste `description`, comme pour le bestiaire.

Faire accepter au script un ou plusieurs chemins en argument, et parcourir les capacités selon
la clé du fichier (`paths` ou `voies`). **Ne pas toucher** à la détection ni au crible
sémantique : ils sont éprouvés et leur comportement doit rester identique.

Repère de vérification : les 22 fichiers portent **385 capacités**.

- [ ] **Étape 2 : lancer le rapport, sans écrire**

```
node scripts/declarer-etats.mjs backend/data/Profils/*.json backend/data/Races/*.json
```
Attendu : **385 capacités**, dont **45** mentionnant au moins un état, et une liste
« à relire (sens) ». **Si les nombres s'écartent nettement, s'arrêter et le signaler** — les
données auraient changé depuis la conception.

- [ ] **Étape 3 : relire chaque proposition, puis écrire**

Lire le texte de **chaque** capacité proposée — pas seulement celles que le crible signale : sur
le bestiaire, les faux positifs sémantiques n'étaient pas tous détectables par mot-clé. La
question est unique : **la capacité inflige-t-elle l'état à quelqu'un ?** Si elle s'en protège,
s'en débarrasse, y est immunisée, ou l'exige comme condition préalable, la déclaration ne doit
pas être écrite.

```
node scripts/declarer-etats.mjs --ecrire backend/data/Profils/*.json backend/data/Races/*.json
```

Puis retirer à la main les déclarations que ta relecture a écartées.

- [ ] **Étape 4 : vérifier l'intégrité de la donnée**

```
node -e "
const fs=require('fs'), path=require('path');
let fichiers=0, caps=0, avec=0;
for (const dir of ['backend/data/Profils','backend/data/Races'])
  for (const f of fs.readdirSync(dir).filter(x=>x.endsWith('.json'))) {
    fichiers++;
    const d=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
    JSON.stringify(d, (k,v) => {
      if (v && typeof v==='object' && !Array.isArray(v) && ('states' in v || 'description' in v && 'rank' in v)) {
        caps++; if (Array.isArray(v.states) && v.states.length) avec++;
      }
      return v;
    });
  }
console.log({fichiers, caps, avec});"
```
Attendu : 22 fichiers, 385 capacités, et un compte de déclarations cohérent avec ce que tu as
retenu à l'étape 3 — au plus 45, et vraisemblablement moins après relecture.

- [ ] **Étape 5 : commiter**

```bash
git add scripts/declarer-etats.mjs backend/data/Profils backend/data/Races
git commit -m "feat(data): déclaration des états infligés par les capacités de personnage

Amorçage proposé par le script d'auteur puis relu capacité par capacité. Les
déclarations qui décrivaient une résistance, une immunité ou une précondition
d'usage — et non une infliction — ont été écartées."
```

---

## Vérification finale (contrôleur)

- [ ] **Parcours navigateur**, desktop 1280×900 et mobile 390×844, via Docker :
  `docker run --rm --network host -v "$PWD/app/node_modules:/nm:ro" -v "<tmp>:/work" mcr.microsoft.com/playwright:v1.58.2-jammy node /work/<script>.mjs`,
  le script important Playwright par `import pkg from '/nm/playwright-core/index.js'`.
  **API sur le port 8001**, application sur 5173, compte `nauno40@gmail.com` / `chroniques`,
  connexion par `POST /api/login_check` avec la clé **`email`**.
  1. Ajouter un personnage joueur au suivi de combat (bouton « + PJ ») ; déplier
     « Capacités » ; vérifier qu'une capacité de rang supérieur au rang acquis **n'apparaît
     pas**.
  2. Cliquer une pastille d'état, choisir une **autre** cible, vérifier que l'état atterrit
     sur elle.
  3. Vérifier qu'un combattant ajouté à la main n'affiche toujours aucun repli.
  4. Aucune erreur console, aucun débordement horizontal.
  **Attendre une condition, jamais `networkidle`** — et se rappeler que le mot « Capacités »
  apparaît aussi dans la navigation : attendre l'élément visé, pas le mot.
- [ ] **Non-régression** : les capacités d'un combattant venu du bestiaire s'affichent toujours,
  et la liste déroulante « + État » fonctionne.
