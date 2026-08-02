# Création imbriquée voie → capacités — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer une voie communautaire et ses capacités d'un seul tenant, chaque capacité devenant une entrée à part entière comme son équivalent officiel.

**Architecture:** Une colonne `parent` nullable relie une capacité à sa voie. Le formulaire de voie reçoit des blocs repliables de capacités et orchestre les appels d'enregistrement, en rendant compte précisément d'un échec partiel. Quatre prérequis hérités des chantiers précédents sont levés d'abord : élagage en profondeur, validation avec chemins, ancres de défilement préfixées, et unification des trois cartes de capacité divergentes.

**Tech Stack:** Symfony 7.4 + API Platform 4.2 + Doctrine (PHP 8.3, PostgreSQL) ; React 19 + TypeScript ; Tailwind v4 CSS-first ; Vitest (fonctions pures en Node, rendu en jsdom par commentaire de tête) ; PHPUnit ; Playwright via Docker.

**Spec:** `docs/superpowers/specs/2026-08-02-creation-imbriquee-design.md`

## Global Constraints

- **Une capacité créée dans une voie est une entrée `HomebrewEntry` à part entière**, reliée par `parent`. Pas de tableau imbriqué dans `data`.
- **`parent` est nullable** : les **8 capacités et sorts autonomes** existants (« Éclat de givre », « Chaînes d'ombre », « Murmure vorace », « Réflexe du chat », « Frappe étourdissante », « Vague déferlante », « Illusion parfaite », « Pas de brume ») doivent continuer de s'afficher, de se modifier et de se dupliquer exactement comme avant.
- **La visibilité d'un enfant est celle de son parent**, forcée côté serveur.
- **Un parent doit appartenir au même propriétaire** que l'enfant ; sinon la requête est refusée.
- **Supprimer une voie supprime ses capacités** (`onDelete: 'CASCADE'`), la confirmation annonçant leur nombre exact.
- **Échec partiel assumé** : l'API étant REST par entité, une voie et cinq capacités font six appels. En cas d'échec en cours de route, le formulaire ne navigue pas, reste rempli, rend compte de ce qui est enregistré et de ce qui ne l'est pas, et permet de reprendre les seules opérations manquantes.
- Le contrat du chantier 2 tient : `required` explicite et **non optionnel**, `0` est une valeur légitime, un bloc de caractéristiques entièrement à zéro compte comme vide.
- Aucune condition liée à la provenance dans les feuilles partagées.
- Portes à chaque tâche : `docker compose exec -T frontend npx tsc -b` (0), `docker compose exec -T frontend npx eslint <fichiers touchés>` (0 nouvelle erreur — fond pré-existant d'environ 46 problèmes ailleurs), `docker compose exec -T frontend npx vitest run` (245 tests actuellement). Pour le backend : `docker compose exec -T backend bin/phpunit <fichier>` — la suite complète est lente, lancer fichier par fichier.
- Vérification desktop (1280×900) **et** mobile (390×844) : 0 débordement horizontal, 0 erreur console. Compte `nauno40@gmail.com` / `chroniques`. Playwright via `mcr.microsoft.com/playwright:v1.58.2-jammy`, `--network host`, `-v $PWD/app/node_modules:/nm:ro`, script important `pkg from '/nm/playwright-core/index.js'`.

---

## Structure des fichiers

**Créés**

| Fichier | Responsabilité |
|---|---|
| `backend/migrations/Version<horodatage>.php` | Ajout de la colonne `parent_id`, sa clé étrangère et son index |
| `app/src/components/sheets/CapabilityCard.tsx` | Carte de capacité unique, remplaçant trois rendus divergents |
| `app/src/components/homebrew/CapabilityBlocks.tsx` | Section « Capacités » du formulaire : blocs repliables, ajout, réordonnancement, suppression |
| `app/src/services/homebrewChildren.ts` | Orchestration de l'enregistrement d'un ensemble et compte-rendu d'échec partiel |
| `app/src/services/homebrewChildren.test.ts` | Tests de l'orchestration |

**Modifiés**

| Fichier | Changement |
|---|---|
| `backend/src/Entity/HomebrewEntry.php` | Relation `parent` + exposition |
| `backend/src/State/HomebrewEntryStateProcessor.php` | Propriétaire du parent vérifié, visibilité héritée |
| `app/src/services/homebrewSchemas.ts` | `pruneChildren` (élagage en profondeur) |
| `app/src/services/homebrewValidation.ts` | Validation avec chemins d'enfants |
| `app/src/components/homebrew/HomebrewFields.tsx` | Préfixe d'ancre pour les identifiants de champ |
| `app/src/pages/HomebrewForm.tsx` | Section capacités, orchestration, compte-rendu |
| `app/src/components/sheets/{RaceSheet,ProfileSheet,VoieSheet}.tsx` | Consomment `CapabilityCard` |
| `app/src/components/sheets/adapters/fromHomebrew.ts` | `homebrewToVoieVM` consomme les enfants |
| `app/src/pages/HomebrewDetail.tsx` | Charge les enfants d'une voie ; confirmation de suppression chiffrée |

---

## Task 1 : Colonne `parent` et règles serveur

**Files:**
- Modify: `backend/src/Entity/HomebrewEntry.php`
- Modify: `backend/src/State/HomebrewEntryStateProcessor.php`
- Create: `backend/migrations/Version<horodatage>.php` (généré)
- Test: `backend/tests/Api/HomebrewEntryTest.php` (existe déjà — complète-le)

**Interfaces:**
- Produces: le champ `parent` exposé en lecture et en écriture sur la ressource `homebrew_entries`, sous forme d'IRI (`/api/homebrew_entries/42`) ou `null`.

- [ ] **Step 1 : Écrire les tests d'API (ils doivent échouer)**

Complète `backend/tests/Api/HomebrewEntryTest.php`, qui étend `ApiSecurityTestCase` — celle-ci fournit `createUser()`, `tokenFor()` et `authHeaders()`, et réinitialise le schéma entre les tests. Reprends ce style, n'invente pas d'échafaudage.

Trois comportements :

1. **Rattachement légitime** : un utilisateur crée une voie, puis une capacité avec `parent` pointant vers cette voie → 201, et la lecture de la capacité renvoie bien le `parent`.
2. **Rattachement frauduleux refusé** : l'utilisateur A crée une voie ; l'utilisateur B tente de créer une capacité avec ce `parent` → la requête échoue (403 ou 422). Le test vérifie qu'aucune entrée n'a été créée.
3. **Visibilité héritée** : une voie `public` avec une capacité envoyée en `private` → après écriture, la capacité est `public`.

Ajoute un quatrième cas de non-régression : créer une capacité **sans** `parent` reste possible et renvoie 201.

- [ ] **Step 2 : Lancer les tests pour les voir échouer**

```bash
docker compose exec -T backend bin/phpunit tests/Api/HomebrewEntryTest.php
```

Attendu : ÉCHEC — la propriété `parent` n'existe pas.

- [ ] **Step 3 : Ajouter la relation à l'entité**

Dans `backend/src/Entity/HomebrewEntry.php`, aux côtés des autres propriétés :

```php
    /**
     * Voie parente d'une capacité. Nul pour une entrée autonome — les capacités créées
     * avant l'imbrication n'ont pas de parent et doivent continuer de fonctionner.
     */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?HomebrewEntry $parent = null;
```

Ajoute l'accesseur et le mutateur, au format des autres propriétés du fichier.

- [ ] **Step 4 : Poser les deux règles serveur**

Dans `HomebrewEntryStateProcessor::process`, avant la délégation à la persistance, dans le bloc `if ($data instanceof HomebrewEntry)` :

```php
            $parent = $data->getParent();
            if (null !== $parent) {
                // Un parent d'autrui ouvrirait la porte au rattachement frauduleux.
                if ($parent->getOwner() !== $this->security->getUser()) {
                    throw new AccessDeniedException("Le parent n'appartient pas à l'utilisateur courant.");
                }
                // La visibilité de l'enfant suit celle du parent : une voie publique dont
                // les capacités seraient privées s'afficherait vide pour ses lecteurs.
                $data->setVisibility($parent->getVisibility());
            }
```

avec `use Symfony\Component\Security\Core\Exception\AccessDeniedException;` en tête de fichier.

- [ ] **Step 5 : Générer la migration**

```bash
docker compose exec -T backend bin/console doctrine:migrations:diff
```

Ouvre le fichier généré et **vérifie** qu'il ne fait qu'ajouter la colonne `parent_id`, sa clé étrangère avec `ON DELETE CASCADE` et son index. S'il contient autre chose — une modification d'une table sans rapport, par exemple —, c'est que la base locale a dérivé du schéma : signale-le dans ton rapport plutôt que d'appliquer aveuglément.

Puis applique :

```bash
docker compose exec -T backend bin/console doctrine:migrations:migrate --no-interaction
```

- [ ] **Step 6 : Lancer les tests pour les voir passer**

```bash
docker compose exec -T backend bin/phpunit tests/Api/HomebrewEntryTest.php
```

- [ ] **Step 7 : Vérifier la non-régression des entrées existantes**

```bash
docker compose exec -T database psql -U app -d app -t -c "select count(*) from homebrew_entry where parent_id is null;"
```

Attendu : toutes les entrées existantes ont `parent_id` à nul — la migration ne doit rien avoir modifié d'autre.

- [ ] **Step 8 : Commit**

```bash
git add backend/src backend/migrations backend/tests
git commit -m "feat(homebrew): relation parent entre une capacité et sa voie"
```

---

## Task 2 : Élagage en profondeur, validation avec chemins, ancres préfixées

**Files:**
- Modify: `app/src/services/homebrewSchemas.ts`
- Modify: `app/src/services/homebrewValidation.ts`
- Modify: `app/src/services/homebrewValidation.test.ts`
- Modify: `app/src/components/homebrew/HomebrewFields.tsx`

**Interfaces:**
- Consumes: `HOMEBREW_SCHEMAS`, `pruneToSchema`, `hasValue`, `HomebrewFieldError`.
- Produces:
  - `interface HomebrewChild { category: string; name: string; data: Record<string, unknown> }`
  - `pruneChildren(children: HomebrewChild[]): HomebrewChild[]`
  - `validateHomebrew(category, name, data, children?: HomebrewChild[]): HomebrewFieldError[]`
  - la prop `prefix?: string` sur `HomebrewFields`

- [ ] **Step 1 : Écrire les tests (ils doivent échouer)**

Ajoute à `app/src/services/homebrewValidation.test.ts` :

```ts
describe('validateHomebrew — enfants', () => {
    const voieValide = { category: 'profil', maxRank: 5, details: ['x'] };

    it('ne signale rien quand les capacités sont complètes', () => {
        const enfants = [{ category: 'capacite', name: 'Frappe', data: { rank: 1, actionType: 'Limitée', effect: ['e'], details: ['d'] } }];
        expect(validateHomebrew('voie', 'Voie test', voieValide, enfants)).toEqual([]);
    });

    it('préfixe l’erreur d’un enfant par sa position', () => {
        const enfants = [
            { category: 'capacite', name: 'Complète', data: { rank: 1, actionType: 'A', effect: ['e'], details: ['d'] } },
            { category: 'capacite', name: 'Incomplète', data: {} },
        ];
        const erreurs = validateHomebrew('voie', 'Voie test', voieValide, enfants);
        expect(erreurs.every(e => e.key.startsWith('capacites.1.'))).toBe(true);
        expect(erreurs.some(e => e.key === 'capacites.1.rank')).toBe(true);
    });

    it('exige le nom d’une capacité', () => {
        const enfants = [{ category: 'capacite', name: '   ', data: { rank: 1, actionType: 'A', effect: ['e'], details: ['d'] } }];
        const erreurs = validateHomebrew('voie', 'Voie test', voieValide, enfants);
        expect(erreurs.some(e => e.key === 'capacites.0.name')).toBe(true);
    });

    it('nomme la position dans le message, pas l’indice', () => {
        const enfants = [
            { category: 'capacite', name: 'A', data: { rank: 1, actionType: 'A', effect: ['e'], details: ['d'] } },
            { category: 'capacite', name: 'B', data: {} },
        ];
        const erreurs = validateHomebrew('voie', 'Voie test', voieValide, enfants);
        expect(erreurs[0].message).toContain('capacité 2');
        expect(erreurs[0].message).not.toContain('capacites.1');
    });

    it('valide la voie même sans capacité', () => {
        expect(validateHomebrew('voie', 'Voie test', voieValide, [])).toEqual([]);
        expect(validateHomebrew('voie', 'Voie test', voieValide)).toEqual([]);
    });
});

describe('pruneChildren', () => {
    it('élague chaque enfant selon le schéma de sa catégorie', () => {
        const out = pruneChildren([
            { category: 'capacite', name: 'A', data: { rank: 2, parasite: 'x', speed: '10 m' } },
        ]);
        expect(out[0].data).toEqual({ rank: 2 });
    });

    it('conserve catégorie et nom', () => {
        const out = pruneChildren([{ category: 'sort', name: 'Éclair', data: { rank: 1 } }]);
        expect(out[0]).toMatchObject({ category: 'sort', name: 'Éclair' });
    });
});
```

Importe `pruneChildren` depuis `./homebrewSchemas` en tête de fichier.

- [ ] **Step 2 : Lancer les tests pour les voir échouer**

```bash
docker compose exec -T frontend npx vitest run src/services/homebrewValidation.test.ts
```

Attendu : ÉCHEC — `pruneChildren` n'existe pas et `validateHomebrew` n'accepte pas de quatrième argument.

- [ ] **Step 3 : Écrire l'élagage en profondeur**

Dans `app/src/services/homebrewSchemas.ts`, après `pruneToSchema` :

```ts
/** Un enfant d'entrée : une capacité rattachée à sa voie. */
export interface HomebrewChild {
    category: string;
    name: string;
    data: Record<string, unknown>;
}

/**
 * Élague chaque enfant selon le schéma de **sa propre** catégorie. `pruneToSchema` ne
 * traite qu'un niveau : sans cette fonction, les champs parasites d'une capacité
 * partiraient en base.
 */
export const pruneChildren = (children: HomebrewChild[]): HomebrewChild[] =>
    children.map(c => ({ category: c.category, name: c.name, data: pruneToSchema(c.category, c.data) }));
```

- [ ] **Step 4 : Étendre la validation aux enfants**

Dans `app/src/services/homebrewValidation.ts`, élargis la signature et ajoute la boucle, en réutilisant la logique existante plutôt qu'en la dupliquant :

```ts
export const validateHomebrew = (
    category: string,
    name: string,
    data: Record<string, unknown>,
    children: HomebrewChild[] = [],
): HomebrewFieldError[] => {
    const erreurs: HomebrewFieldError[] = [/* … logique existante inchangée … */];

    children.forEach((enfant, index) => {
        const position = index + 1;   // ce que l'auteur voit à l'écran
        for (const e of validateHomebrew(enfant.category, enfant.name, enfant.data)) {
            erreurs.push({
                key: `capacites.${index}.${e.key}`,
                message: `Capacité ${position} — ${e.message}`,
            });
        }
    });

    return erreurs;
};
```

Importe `HomebrewChild` depuis `./homebrewSchemas`. L'appel récursif ne passe pas d'enfants : une capacité n'a pas d'enfants dans ce chantier.

- [ ] **Step 5 : Préfixer les ancres de défilement**

Dans `app/src/components/homebrew/HomebrewFields.tsx`, ajoute une prop optionnelle et préfixe l'identifiant :

```tsx
export const HomebrewFields: React.FC<{
    schema: HomebrewFieldDef[];
    data: Data;
    onChange: (d: Data) => void;
    errors?: Record<string, string>;
    /** Préfixe d'ancre, ex. `capacites.2.` — sans quoi deux capacités produiraient
     *  deux `champ-rank` et le défilement irait au premier. */
    prefix?: string;
}> = ({ schema, data, onChange, errors, prefix = '' }) => {
```

L'identifiant du conteneur de champ devient `id={`champ-${prefix}${f.key}`}`. Les appels existants ne passent pas `prefix` et gardent donc leurs identifiants actuels.

- [ ] **Step 6 : Lancer les tests pour les voir passer**

```bash
docker compose exec -T frontend npx vitest run src/services/homebrewValidation.test.ts
```

- [ ] **Step 7 : Portes puis commit**

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/services src/components/homebrew
docker compose exec -T frontend npx vitest run
git add app/src/services app/src/components/homebrew/HomebrewFields.tsx
git commit -m "feat(homebrew): élagage en profondeur, validation avec chemins, ancres préfixées"
```

---

## Task 3 : Carte de capacité unifiée

**Files:**
- Create: `app/src/components/sheets/CapabilityCard.tsx`
- Create: `app/src/components/sheets/CapabilityCard.test.tsx`
- Modify: `app/src/components/sheets/{RaceSheet,ProfileSheet,VoieSheet}.tsx`
- Modify: `app/src/components/sheets/index.ts`

**Interfaces:**
- Consumes: `SheetCapabilityRef` (`sheets/types.ts`), `DynamicDetailsRenderer` (`components/common`).
- Produces: `CapabilityCard` — signature `({ cap }: { cap: SheetCapabilityRef }) => JSX.Element`.

- [ ] **Step 1 : Relever les trois rendus actuels**

Ouvre les trois feuilles et relève, pour chacune, ce qu'elle affiche d'une capacité. Constat de départ, à confirmer : `RaceSheet` n'affiche **aucun** badge, `ProfileSheet` affiche « L » et « Sort », `VoieSheet` affiche « Actif », « Limité » et « Sort ». Le vocabulaire retenu est celui de `VoieSheet`, le plus complet — « Limité » en toutes lettres plutôt que « L ».

Note dans ton rapport tout élément affiché par l'une des trois et absent des deux autres : c'est ce que l'unification doit préserver, pas perdre.

- [ ] **Step 2 : Écrire le test de rendu (il doit échouer)**

Créer `app/src/components/sheets/CapabilityCard.test.tsx` :

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CapabilityCard } from './CapabilityCard';

afterEach(cleanup);

describe('CapabilityCard', () => {
    it('affiche rang, nom, description et les badges présents', () => {
        render(<CapabilityCard cap={{ rank: 3, name: 'Boule de feu', description: 'Explose', isSpell: true, limited: true, active: true }} />);
        expect(screen.getByText('Boule de feu')).toBeTruthy();
        expect(screen.getByText('Explose')).toBeTruthy();
        expect(screen.getByText('3')).toBeTruthy();
        expect(screen.getByText(/Sort/)).toBeTruthy();
        expect(screen.getByText(/Limité/)).toBeTruthy();
        expect(screen.getByText(/Actif/)).toBeTruthy();
    });

    it('n’affiche aucun badge absent', () => {
        render(<CapabilityCard cap={{ name: 'Simple' }} />);
        expect(screen.queryByText(/Sort/)).toBeNull();
        expect(screen.queryByText(/Limité/)).toBeNull();
        expect(screen.queryByText(/Actif/)).toBeNull();
    });

    it('affiche le rang 0, qui est une valeur légitime', () => {
        render(<CapabilityCard cap={{ rank: 0, name: 'Rang zéro' }} />);
        expect(screen.getByText('0')).toBeTruthy();
    });
});
```

- [ ] **Step 3 : Lancer le test pour le voir échouer**

```bash
docker compose exec -T frontend npx vitest run src/components/sheets/CapabilityCard.test.tsx
```

- [ ] **Step 4 : Écrire le composant**

Créer `CapabilityCard.tsx` en reprenant le JSX de `VoieSheet` **tel quel** — c'est une unification de rendus divergents, pas une refonte. Chaque badge est conditionné par sa donnée (`cap.isSpell`, `cap.limited`, `cap.active`), la pastille de rang par `cap.rank !== undefined` (le rang 0 est légitime), la description et les détails par leur présence. Exporte-le depuis `index.ts`.

- [ ] **Step 5 : Faire consommer les trois feuilles**

Remplace le rendu de capacité de `RaceSheet`, `ProfileSheet` et `VoieSheet` par `<CapabilityCard cap={cap} />`, en conservant la clé React existante (`cap.id ?? \`${cap.rank ?? ''}-${cap.name}\``).

**Attention** : `RaceSheet` n'affichait aucun badge ; après unification, une capacité raciale marquée `isSpell` en affichera un. C'est le comportement voulu — un contenu jusque-là invisible devient visible — mais signale-le dans ton rapport comme changement d'affichage assumé.

- [ ] **Step 6 : Portes puis commit**

```bash
docker compose exec -T frontend npx vitest run
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components/sheets
git add app/src/components/sheets
git commit -m "refactor(sheets): carte de capacité unique pour les trois feuilles"
```

---

## Task 4 : Saisie des capacités et enregistrement d'un ensemble

**Files:**
- Create: `app/src/components/homebrew/CapabilityBlocks.tsx`
- Create: `app/src/services/homebrewChildren.ts`
- Create: `app/src/services/homebrewChildren.test.ts`
- Modify: `app/src/pages/HomebrewForm.tsx`

**Interfaces:**
- Consumes: `HomebrewChild`, `pruneChildren` (Task 2) ; `validateHomebrew` avec enfants (Task 2) ; `HomebrewFields` avec `prefix` (Task 2) ; `HomebrewService.create/update/remove`, `HomebrewEntry` (`services/homebrewService.ts`).
- Produces:
  - `interface ChildDraft extends HomebrewChild { id?: number }` — `id` absent pour une capacité pas encore enregistrée
  - `saveChildren(parentId: number, visibility: 'public' | 'private', drafts: ChildDraft[], initialIds: number[]): Promise<{ saved: number; failed: { position: number; message: string }[] }>`
  - `CapabilityBlocks` — signature `({ drafts, onChange, errors }: { drafts: ChildDraft[]; onChange: (d: ChildDraft[]) => void; errors: Record<string, string> }) => JSX.Element`

- [ ] **Step 1 : Écrire les tests de l'orchestration (ils doivent échouer)**

Créer `app/src/services/homebrewChildren.test.ts`. Les tests remplacent `HomebrewService` par un double, sans réseau :

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveChildren } from './homebrewChildren';
import { HomebrewService } from './homebrewService';

vi.mock('./homebrewService', () => ({
    HomebrewService: { create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const nouvelle = (name: string) => ({ category: 'capacite', name, data: { rank: 1 } });

beforeEach(() => vi.clearAllMocks());

describe('saveChildren', () => {
    it('crée les nouvelles, met à jour les existantes, supprime les retirées', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });
        (HomebrewService.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 42 });
        (HomebrewService.remove as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        const res = await saveChildren(7, 'public', [{ ...nouvelle('A') }, { id: 42, ...nouvelle('B') }], [42, 55]);

        expect(HomebrewService.create).toHaveBeenCalledTimes(1);
        expect(HomebrewService.update).toHaveBeenCalledWith(42, expect.anything());
        expect(HomebrewService.remove).toHaveBeenCalledWith(55);
        expect(res.failed).toEqual([]);
        expect(res.saved).toBe(2);
    });

    it('transmet le parent et la visibilité à chaque enfant créé', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });
        await saveChildren(7, 'public', [nouvelle('A')], []);
        const payload = (HomebrewService.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(payload).toMatchObject({ parent: '/api/homebrew_entries/7', visibility: 'public' });
    });

    it('rend compte d’un échec partiel sans interrompre les suivantes', async () => {
        (HomebrewService.create as ReturnType<typeof vi.fn>)
            .mockResolvedValueOnce({ id: 1 })
            .mockRejectedValueOnce(new Error('boum'))
            .mockResolvedValueOnce({ id: 3 });

        const res = await saveChildren(7, 'private', [nouvelle('A'), nouvelle('B'), nouvelle('C')], []);

        expect(res.saved).toBe(2);
        expect(res.failed).toEqual([{ position: 2, message: 'boum' }]);
    });
});
```

- [ ] **Step 2 : Lancer les tests pour les voir échouer**

```bash
docker compose exec -T frontend npx vitest run src/services/homebrewChildren.test.ts
```

- [ ] **Step 3 : Écrire l'orchestration**

`app/src/services/homebrewChildren.ts` : pour chaque brouillon, `create` s'il n'a pas d'identifiant, `update` sinon ; puis `remove` pour chaque identifiant initial absent des brouillons. **Chaque opération est isolée** : un échec est collecté avec la position affichée à l'auteur (indice + 1) et n'interrompt pas les suivantes. Le parent est transmis en IRI (`/api/homebrew_entries/<id>`) et la visibilité est celle du parent.

- [ ] **Step 4 : Écrire la section de saisie**

`app/src/components/homebrew/CapabilityBlocks.tsx` : un bouton « Ajouter une capacité » ; un bloc repliable par capacité, replié par défaut, titré par sa position et son nom ; un bouton de suppression ; des contrôles pour monter et descendre, qui **réordonnent les brouillons**. Chaque bloc rend `<HomebrewFields schema={HOMEBREW_SCHEMAS.capacite} … prefix={\`capacites.${index}.\`} />` plus un champ « Nom » propre à la capacité.

**Un bloc porteur d'erreur s'ouvre automatiquement** et se signale visuellement : sans cela, l'auteur verrait un enregistrement refusé sans cause visible, l'erreur étant cachée dans un bloc replié.

- [ ] **Step 5 : Brancher dans le formulaire de voie**

Dans `HomebrewForm.tsx`, quand `category === 'voie'` : afficher `CapabilityBlocks` sous les champs de la voie, passer les brouillons à `validateHomebrew` en quatrième argument, et, à l'enregistrement, appeler `saveChildren` après l'enregistrement de la voie. Le compte-rendu d'échec partiel s'affiche dans le bandeau existant (`id="erreurs-formulaire"`) et **la page ne navigue pas** tant qu'il reste des opérations en échec.

Applique `pruneChildren` aux brouillons avant envoi, comme `pruneToSchema` l'est déjà pour la voie.

- [ ] **Step 6 : Portes**

```bash
docker compose exec -T frontend npx vitest run
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/pages src/services src/components/homebrew
```

- [ ] **Step 7 : Commit**

```bash
git add app/src/services app/src/components/homebrew app/src/pages/HomebrewForm.tsx
git commit -m "feat(homebrew): saisie des capacités dans le formulaire de voie"
```

---

## Task 5 : Lecture des capacités d'une voie

**Files:**
- Modify: `app/src/components/sheets/adapters/fromHomebrew.ts`
- Modify: `app/src/components/sheets/adapters/adapters.test.ts`
- Modify: `app/src/pages/HomebrewDetail.tsx`
- Modify: `app/src/components/homebrew/HomebrewFormPreview.tsx`

**Interfaces:**
- Consumes: `HomebrewChild` (Task 2), `SheetCapabilityRef` (`sheets/types.ts`), `CapabilityCard` (Task 3).
- Produces: `homebrewToVoieVM(entry: HomebrewEntry, children?: HomebrewEntry[]): VoieSheetVM`.

- [ ] **Step 1 : Écrire les tests d'adaptateur (ils doivent échouer)**

Ajoute à `adapters.test.ts` :

```ts
describe('homebrewToVoieVM — enfants', () => {
    const voie = { id: 7, category: 'voie', name: 'Voie du Gel', description: 'Froid', visibility: 'private',
        data: { category: 'profil', maxRank: 5 }, authorId: 1, authorPseudo: 'N' } as unknown as HomebrewEntry;

    it('projette les enfants en capacités, triées par rang', () => {
        const enfants = [
            { id: 2, category: 'capacite', name: 'Rang 2', data: { rank: 2 } },
            { id: 1, category: 'capacite', name: 'Rang 1', data: { rank: 1 } },
        ] as unknown as HomebrewEntry[];
        const vm = homebrewToVoieVM(voie, enfants);
        expect(vm.capabilities?.map(c => c.rank)).toEqual([1, 2]);
        expect(vm.capabilities?.[0].name).toBe('Rang 1');
    });

    it('laisse capabilities indéfini quand la voie n’a pas d’enfant', () => {
        expect(homebrewToVoieVM(voie, []).capabilities).toBeUndefined();
        expect(homebrewToVoieVM(voie).capabilities).toBeUndefined();
    });

    it('reporte les badges d’une capacité enfant', () => {
        const enfants = [{ id: 3, category: 'sort', name: 'Givre', data: { rank: 1, limited: true } }] as unknown as HomebrewEntry[];
        const vm = homebrewToVoieVM(voie, enfants);
        expect(vm.capabilities?.[0]).toMatchObject({ isSpell: true, limited: true });
    });
});
```

Le troisième test encode une règle : une capacité de catégorie `sort` **est** un sort, comme le fait déjà `homebrewToCapaciteVM`.

- [ ] **Step 2 : Lancer les tests pour les voir échouer**

```bash
docker compose exec -T frontend npx vitest run src/components/sheets/adapters/adapters.test.ts
```

- [ ] **Step 3 : Faire consommer les enfants à l'adaptateur**

`homebrewToVoieVM` accepte un second paramètre optionnel et en dérive `capabilities`, triées par rang croissant, en réutilisant la projection de `homebrewToCapaciteVM` plutôt qu'en la réécrivant. Le champ texte `details` de la voie **cesse** d'être transformé en pseudo-capacités : il retrouve son rôle propre, les mécaniques de la voie, rendues par `DynamicDetailsRenderer`.

- [ ] **Step 4 : Charger les enfants sur la fiche**

Dans `HomebrewDetail.tsx`, pour une entrée de catégorie `voie`, charger ses enfants et les passer à l'adaptateur. `HomebrewService.getAll()` ramène déjà toutes les entrées visibles : filtrer sur le parent côté client évite un appel supplémentaire — vérifie la forme sous laquelle l'API renvoie `parent` (IRI ou objet) avant de comparer.

Adapte aussi la confirmation de suppression pour annoncer le nombre exact de capacités emportées, par exemple « Supprimer « Voie du Gel » et ses 3 capacités ? ».

- [ ] **Step 5 : Alimenter l'aperçu**

Dans `HomebrewFormPreview.tsx`, passer les brouillons de capacités à `homebrewToVoieVM` pour que l'aperçu affiche la voie en cours de saisie **avec** ses capacités. Les brouillons n'ont pas d'identifiant : c'est sans conséquence, la clé de rendu retombe sur la combinaison rang et nom.

- [ ] **Step 6 : Portes puis commit**

```bash
docker compose exec -T frontend npx vitest run
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src/components src/pages
git add app/src/components app/src/pages/HomebrewDetail.tsx
git commit -m "feat(homebrew): la fiche et l'aperçu d'une voie affichent ses capacités"
```

---

## Vérification finale

Parcours Playwright, desktop **et** mobile, connecté :

1. Créer une voie avec trois capacités de rangs 1, 2 et 3 ; enregistrer.
2. Vérifier que la fiche de la voie affiche les trois capacités, avec leur rang et leurs badges.
3. Vérifier que ces capacités apparaissent **aussi** dans « Capacités & Sorts », onglet « Mes créations » — c'est la conséquence voulue du choix d'entrées à part entière.
4. Rouvrir la voie en modification : les trois blocs sont présents et remplis ; en ajouter un quatrième, réordonner, enregistrer, vérifier la mise à jour.
5. Tenter d'enregistrer une voie dont une capacité n'a pas de rang : refus, message nommant « Capacité 2 », défilement jusqu'au bloc fautif, qui est **ouvert**.
6. Passer la voie en public : vérifier en base que ses capacités le sont devenues.
7. Supprimer la voie : la confirmation annonce le nombre de capacités ; après suppression, vérifier en base qu'aucune capacité orpheline ne subsiste.
8. **Non-régression** : ouvrir, modifier et dupliquer l'une des 8 capacités autonomes existantes — comportement inchangé.
9. Supprimer les contenus de test créés pendant le parcours.

Attendu à chaque étape : 0 débordement horizontal, 0 erreur console. Puis :

```bash
docker compose exec -T frontend npx tsc -b
docker compose exec -T frontend npx eslint src
docker compose exec -T frontend npx vitest run
```
