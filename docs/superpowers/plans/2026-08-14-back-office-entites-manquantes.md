# Back-office : les entités sans contrôleur — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** donner au back-office EasyAdmin une section pour 27 des 28 entités — écriture complète sur le compendium, consultation et suppression sur les données des utilisateurs et le contenu communautaire.

**Architecture:** deux classes de base portent tout le comportement (`AbstractWritableCrudController`, `AbstractReadDeleteCrudController`) ; les 27 contrôleurs concrets ne déclarent que leur entité. Les colonnes JSON sont repérées dans les métadonnées Doctrine et rendues par un `CodeEditorField` muni d'un transformateur tableau ↔ chaîne.

**Tech Stack:** PHP 8.3, Symfony 7.4, EasyAdmin ^4.27.5, Doctrine ORM 3, PostgreSQL 15, PHPUnit 12.

Spec : `docs/superpowers/specs/2026-08-14-back-office-entites-manquantes-design.md`.

## Global Constraints

- Commentaires, libellés et documentation **en français** ; noms de classes et de méthodes en anglais, comme le reste du projet.
- Tout se lance dans le conteneur : `docker compose exec -T backend bin/phpunit <chemin>`.
- **Lire le code de retour, pas le texte** : `phpunit.dist.xml` pose `failOnDeprecation`, une dépréciation fait sortir 1 derrière « OK, but there were issues! ».
- La suite fonctionnelle réinitialise le schéma Postgres à chaque test (`ApiSecurityTestCase::setUp`) : ~8 s par test. **Boucler sur les sections à l'intérieur d'un test** plutôt que d'écrire un fournisseur de données — 27 tests séparés ajouteraient plus de trois minutes à la suite pour la même couverture.
- **Ne pas modifier les cascades de suppression** du domaine campagne, ni la sérialisation API, ni les fixtures applicatives (`src/DataFixtures/`).
- Vérification manuelle éventuelle : le port 8000 est souvent pris par le serveur MCP `godot-ai`. Passer par un override `ports: !override ["8001:80"]` sur le service `nginx` plutôt que de tuer le processus.
- Une entité citée par un `AssociationField` **doit** avoir un `__toString()`, sinon les pages `new` et `edit` répondent 500 alors que `index` et `detail` répondent 200.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/Form/DataTransformer/JsonToStringTransformer.php` | tableau PHP ↔ texte JSON, avec message d'erreur lisible |
| `src/Form/Type/JsonCodeType.php` | type de formulaire = `CodeEditorType` + le transformateur |
| `src/Admin/Field/JsonField.php` | fabrique du champ EasyAdmin (langage `js`, rendu formaté) |
| `src/Controller/Admin/AbstractWritableCrudController.php` | champs par défaut + associations + JSON ; CRUD complet |
| `src/Controller/Admin/AbstractReadDeleteCrudController.php` | idem, moins les actions `NEW` et `EDIT` |
| `src/Controller/Admin/<Entité>CrudController.php` × 27 | déclare l'entité, rien de plus sauf raison explicite |
| `src/Controller/Admin/DashboardController.php` | menu à cinq sections repliées, en français |
| `tests/Admin/BackOfficeFixture.php` | une ligne par entité, réutilisable |
| `tests/Admin/BackOfficeSecurityTest.php` | accès, rendu des 27 sections, refus d'écriture, suppressions |

---

### Task 1: Le jeu d'essai partagé

Le test actuel sème cinq entités à la main dans son propre fichier. Les tâches suivantes ont besoin d'une ligne de **chaque** entité : sur une base vide, aucune entité n'est convertie en chaîne, la panne surveillée disparaît et le test redevient un faux vert.

**Files:**
- Create: `backend/tests/Admin/BackOfficeFixture.php`
- Create: `backend/tests/Admin/BackOfficeFixtureTest.php`

**Interfaces:**
- Consumes: `App\Tests\Api\ApiSecurityTestCase` (helpers `createUser`, propriété `$this->em`).
- Produces: `BackOfficeFixture::seed(EntityManagerInterface $em, User $owner): array` — renvoie une carte `nom court => entité`, clés : `race`, `family`, `profile`, `voie`, `capability`, `creature-family`, `creature`, `creature-voie`, `equipment`, `material`, `food`, `lodging`, `mount`, `state`, `poison`, `trap`, `campaign`, `quest`, `clue`, `session`, `encounter`, `membership`, `character`, `character-voie`, `homebrew`, `custom-creature`. Ces clés sont les **mêmes chaînes** que les segments d'URL du back-office, sauf `state` (`/admin/harmful-state`) et `homebrew` (`/admin/homebrew-entry`) — la correspondance est déclarée dans le test, pas devinée.

- [ ] **Step 1: Écrire le test qui échoue**

`backend/tests/Admin/BackOfficeFixtureTest.php` :

```php
<?php

namespace App\Tests\Admin;

use App\Tests\Api\ApiSecurityTestCase;

/**
 * Le jeu d'essai du back-office doit produire une ligne de chaque entité : c'est ce qui
 * fait que les listes déroulantes des formulaires ont quelque chose à convertir en chaîne.
 */
final class BackOfficeFixtureTest extends ApiSecurityTestCase
{
    public function testSeedsOneRowPerEntity(): void
    {
        $owner = $this->createUser('mj@example.com');

        $entities = BackOfficeFixture::seed($this->em, $owner);

        self::assertCount(26, $entities);
        foreach ($entities as $key => $entity) {
            self::assertNotNull($entity->getId(), sprintf('L\'entité « %s » doit être persistée.', $key));
        }
    }
}
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `docker compose exec -T backend bin/phpunit tests/Admin/BackOfficeFixtureTest.php`
Expected: FAIL — `Class "App\Tests\Admin\BackOfficeFixture" not found`.

- [ ] **Step 3: Écrire le jeu d'essai**

`backend/tests/Admin/BackOfficeFixture.php` :

```php
<?php

namespace App\Tests\Admin;

use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\Capability;
use App\Entity\Character;
use App\Entity\CharacterVoie;
use App\Entity\Clue;
use App\Entity\Creature;
use App\Entity\CreatureFamily;
use App\Entity\CreatureVoie;
use App\Entity\CustomCreature;
use App\Entity\Encounter;
use App\Entity\Equipment;
use App\Entity\Family;
use App\Entity\Food;
use App\Entity\HarmfulState;
use App\Entity\HomebrewEntry;
use App\Entity\Lodging;
use App\Entity\Material;
use App\Entity\Mount;
use App\Entity\Poison;
use App\Entity\Profile;
use App\Entity\Quest;
use App\Entity\Race;
use App\Entity\Session;
use App\Entity\Trap;
use App\Entity\User;
use App\Entity\Voie;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Une ligne de chaque entité couverte par le back-office.
 *
 * Ce n'est pas du confort : sur une base vide, EasyAdmin n'a aucune entité à convertir en
 * chaîne pour ses listes déroulantes, et les pannes de rendu que les tests surveillent
 * disparaissent d'elles-mêmes.
 */
final class BackOfficeFixture
{
    /** @return array<string, object> nom de section => entité */
    public static function seed(EntityManagerInterface $em, User $owner): array
    {
        $family = (new Family())
            ->setName('Combattant')
            ->setDescription('Famille de test.')
            ->setBaseHp(6)
            ->setRecoveryDie('d6')
            ->setLuckPoints(3);

        $profile = (new Profile())->setName('Guerrier');
        $profile->setFamily($family);

        $race = (new Race())->setName('Humain')->setDescription('Race de test.');

        $voie = (new Voie())
            ->setName('Voie de l\'épée')
            ->setDescription('Voie de test.')
            ->setCategory('profil')
            ->setMaxRank(5);
        $voie->setProfile($profile);

        $capability = (new Capability())
            ->setName('Coup puissant')
            ->setDescription('Capacité de test.')
            ->setRank(1)
            ->setIsSpell(false)
            ->setLimited(false);
        $capability->setVoie($voie);

        $creatureFamily = (new CreatureFamily())->setName('Bêtes');

        $creature = (new Creature())
            ->setName('Loup')
            ->setNc(1.0)
            ->setHp(12)
            ->setDef(13)
            ->setInit(14);
        $creature->setFamily($creatureFamily);

        $creatureVoie = (new CreatureVoie())->setRank(1);
        $creatureVoie->setCreature($creature);
        $creatureVoie->setVoie($voie);

        $equipment = (new Equipment())->setName('Épée longue')->setType('weapon');
        $material = (new Material())->setName('Corde de chanvre');
        $food = (new Food())->setName('Ration de voyage');
        $lodging = (new Lodging())->setName('Auberge commune');
        $mount = (new Mount())->setName('Cheval de selle');
        $state = (new HarmfulState())->setName('Affaibli');
        $poison = (new Poison())->setName('Venin de vouivre');
        $trap = (new Trap())->setName('Fosse à pieux');

        $campaign = (new Campaign())->setName('Campagne de test');
        $campaign->setOwner($owner);

        $quest = (new Quest())
            ->setTitle('Retrouver la relique')
            ->setType('principale')
            ->setStatus('en cours')
            ->setShared(false);
        $quest->setCampaign($campaign);

        $clue = (new Clue())
            ->setContent('Une empreinte fraîche près de la rivière.')
            ->setStatus('découvert')
            ->setShared(false);
        $clue->setCampaign($campaign);

        $gameSession = (new Session())
            ->setTitle('Séance 1')
            ->setDate(new \DateTime('2026-08-14'));
        $gameSession->setCampaign($campaign);

        $encounter = (new Encounter())->setName('Embuscade des loups');
        $encounter->setCampaign($campaign);

        $membership = new CampaignMembership();
        $membership->setCampaign($campaign);
        $membership->setPlayer($owner);

        $character = (new Character())->setName('Aldric')->setLevel(1);
        $character->setOwner($owner);
        $character->setRace($race);
        $character->setProfile($profile);
        $character->setCaracs(['FOR' => 2, 'DEX' => 1]);

        $characterVoie = (new CharacterVoie())->setRank(2);
        $characterVoie->setCharacter($character);
        $characterVoie->setVoie($voie);

        $homebrew = (new HomebrewEntry())
            ->setCategory('voie')
            ->setName('Voie du chasseur de primes')
            ->setVisibility('public')
            ->setData(['rangs' => 5]);
        $homebrew->setOwner($owner);
        $homebrew->setCreatedAt(new \DateTimeImmutable());
        $homebrew->setUpdatedAt(new \DateTimeImmutable());

        $customCreature = (new CustomCreature())
            ->setName('Gobelin d\'égout')
            ->setNc(0.5)
            ->setHp(8)
            ->setDef(11)
            ->setInit(12);
        $customCreature->setOwner($owner);

        $entities = [
            'family' => $family,
            'profile' => $profile,
            'race' => $race,
            'voie' => $voie,
            'capability' => $capability,
            'creature-family' => $creatureFamily,
            'creature' => $creature,
            'creature-voie' => $creatureVoie,
            'equipment' => $equipment,
            'material' => $material,
            'food' => $food,
            'lodging' => $lodging,
            'mount' => $mount,
            'state' => $state,
            'poison' => $poison,
            'trap' => $trap,
            'campaign' => $campaign,
            'quest' => $quest,
            'clue' => $clue,
            'session' => $gameSession,
            'encounter' => $encounter,
            'membership' => $membership,
            'character' => $character,
            'character-voie' => $characterVoie,
            'homebrew' => $homebrew,
            'custom-creature' => $customCreature,
        ];

        foreach ($entities as $entity) {
            $em->persist($entity);
        }
        $em->flush();

        return $entities;
    }
}
```

- [ ] **Step 4: Lancer le test et corriger ce que le schéma refuse**

Run: `docker compose exec -T backend bin/phpunit tests/Admin/BackOfficeFixtureTest.php`
Expected: PASS.

Si Postgres refuse une colonne (`null value in column "x" violates not-null constraint`), ajouter le `set…()` manquant **dans le jeu d'essai** — jamais en rendant la colonne nullable dans l'entité : le schéma dit ce que le produit exige, le test s'y plie.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/Admin/BackOfficeFixture.php backend/tests/Admin/BackOfficeFixtureTest.php
git commit -m "test(admin): jeu d'essai couvrant les 26 entités du back-office"
```

---

### Task 2: Le champ JSON

EasyAdmin **exclut les colonnes JSON de ses champs par défaut** sur les quatre pages (`FieldProvider::getDefaultFields()`). Un `ArrayField` posé dessus rend « Array to string conversion » et répond 500 — c'est ce qui a fait masquer `Capability.effect`. Il faut donc un champ dédié.

**Files:**
- Create: `backend/src/Form/DataTransformer/JsonToStringTransformer.php`
- Create: `backend/src/Form/Type/JsonCodeType.php`
- Create: `backend/src/Admin/Field/JsonField.php`
- Create: `backend/tests/Form/JsonToStringTransformerTest.php`

**Interfaces:**
- Produces:
  - `JsonToStringTransformer::transform(mixed $value): string` — `null` devient `''`, un tableau devient du JSON indenté.
  - `JsonToStringTransformer::reverseTransform(mixed $value): ?array` — `''` devient `null`, un JSON invalide lève `TransformationFailedException`.
  - `JsonField::new(string $propertyName, ?string $label = null): CodeEditorField`.

- [ ] **Step 1: Écrire le test qui échoue**

`backend/tests/Form/JsonToStringTransformerTest.php` :

```php
<?php

namespace App\Tests\Form;

use App\Form\DataTransformer\JsonToStringTransformer;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Form\Exception\TransformationFailedException;

/**
 * Test pur : ni base de données ni noyau Symfony.
 */
final class JsonToStringTransformerTest extends TestCase
{
    private JsonToStringTransformer $transformer;

    protected function setUp(): void
    {
        $this->transformer = new JsonToStringTransformer();
    }

    public function testNullBecomesAnEmptyString(): void
    {
        self::assertSame('', $this->transformer->transform(null));
    }

    public function testArrayIsRenderedIndentedAndUnescaped(): void
    {
        $rendered = $this->transformer->transform(['nom' => 'Épée', 'url' => 'a/b']);

        self::assertStringContainsString('"Épée"', $rendered, 'L\'accent ne doit pas être échappé en \\u00e9.');
        self::assertStringContainsString('"a/b"', $rendered, 'La barre oblique ne doit pas être échappée.');
        self::assertStringContainsString("\n", $rendered, 'Le JSON doit être indenté pour être relisible.');
    }

    public function testEmptyInputBecomesNull(): void
    {
        self::assertNull($this->transformer->reverseTransform(''));
        self::assertNull($this->transformer->reverseTransform("  \n "));
        self::assertNull($this->transformer->reverseTransform(null));
    }

    public function testValidJsonBecomesAnArray(): void
    {
        self::assertSame(['bonuses' => ['DEF' => 2]], $this->transformer->reverseTransform('{"bonuses":{"DEF":2}}'));
    }

    public function testInvalidJsonIsRejectedWithAReadableMessage(): void
    {
        $this->expectException(TransformationFailedException::class);
        $this->transformer->reverseTransform('{"bonuses":');
    }

    public function testScalarJsonIsRejected(): void
    {
        // Les colonnes visées sont des tableaux : accepter `42` produirait une valeur que
        // Doctrine refuserait d'écrire, bien plus loin et avec un message illisible.
        $this->expectException(TransformationFailedException::class);
        $this->transformer->reverseTransform('42');
    }
}
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `docker compose exec -T backend bin/phpunit tests/Form/JsonToStringTransformerTest.php`
Expected: FAIL — `Class "App\Form\DataTransformer\JsonToStringTransformer" not found`.

- [ ] **Step 3: Écrire le transformateur**

`backend/src/Form/DataTransformer/JsonToStringTransformer.php` :

```php
<?php

namespace App\Form\DataTransformer;

use Symfony\Component\Form\DataTransformerInterface;
use Symfony\Component\Form\Exception\TransformationFailedException;

/**
 * Les colonnes JSON du projet sont des tableaux PHP ; un éditeur de code manipule du texte.
 *
 * @implements DataTransformerInterface<?array, ?string>
 */
final class JsonToStringTransformer implements DataTransformerInterface
{
    public function transform(mixed $value): string
    {
        if (null === $value) {
            return '';
        }

        return json_encode($value, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES);
    }

    public function reverseTransform(mixed $value): ?array
    {
        if (null === $value || '' === trim((string) $value)) {
            return null;
        }

        try {
            $decoded = json_decode((string) $value, true, 512, \JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new TransformationFailedException('JSON invalide : '.$exception->getMessage(), previous: $exception);
        }

        if (!\is_array($decoded)) {
            throw new TransformationFailedException('Le contenu doit être un objet ou un tableau JSON.');
        }

        return $decoded;
    }
}
```

- [ ] **Step 4: Lancer le test et vérifier qu'il passe**

Run: `docker compose exec -T backend bin/phpunit tests/Form/JsonToStringTransformerTest.php`
Expected: PASS (6 tests).

- [ ] **Step 5: Écrire le type de formulaire et la fabrique de champ**

`backend/src/Form/Type/JsonCodeType.php` :

```php
<?php

namespace App\Form\Type;

use App\Form\DataTransformer\JsonToStringTransformer;
use EasyCorp\Bundle\EasyAdminBundle\Form\Type\CodeEditorType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;

/**
 * L'éditeur de code d'EasyAdmin, branché sur une colonne `json` de Doctrine.
 */
final class JsonCodeType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->addModelTransformer(new JsonToStringTransformer());
    }

    public function getParent(): string
    {
        return CodeEditorType::class;
    }
}
```

`backend/src/Admin/Field/JsonField.php` :

```php
<?php

namespace App\Admin\Field;

use App\Form\Type\JsonCodeType;
use EasyCorp\Bundle\EasyAdminBundle\Field\CodeEditorField;

/**
 * Champ d'administration pour une colonne JSON.
 *
 * Le langage déclaré est `js` : EasyAdmin n'accepte pas `json` dans sa liste de langages
 * colorisés, et la coloration JavaScript rend le JSON correctement.
 */
final class JsonField
{
    public static function new(string $propertyName, ?string $label = null): CodeEditorField
    {
        return CodeEditorField::new($propertyName, $label)
            ->setLanguage('js')
            ->setNumOfRows(10)
            ->setFormType(JsonCodeType::class)
            ->formatValue(static fn (mixed $value): string => null === $value
                ? ''
                : json_encode($value, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES));
    }
}
```

- [ ] **Step 6: Commit**

```bash
git add backend/src/Form backend/src/Admin backend/tests/Form
git commit -m "feat(admin): champ JSON éditable pour le back-office"
```

---

### Task 3: La classe de base en écriture, et les neuf contrôleurs existants

**Files:**
- Create: `backend/src/Controller/Admin/AbstractWritableCrudController.php`
- Modify: `backend/src/Controller/Admin/RaceCrudController.php`, `FamilyCrudController.php`, `ProfileCrudController.php`, `VoieCrudController.php`, `CapabilityCrudController.php`, `CreatureFamilyCrudController.php`, `CreatureCrudController.php`, `EquipmentCrudController.php`, `UserCrudController.php`
- Modify: `backend/src/Entity/Creature.php` (ajout de `__toString()`)
- Modify: `backend/tests/Admin/BackOfficeSecurityTest.php`

**Interfaces:**
- Consumes: `JsonField::new()` (Task 2), `BackOfficeFixture::seed()` (Task 1).
- Produces:
  - `AbstractWritableCrudController` — `__construct(protected readonly EntityManagerInterface $entityManager)`, `configureFields(string $pageName): iterable`, point d'extension `protected function derivedJsonFields(): array` (par défaut `[]`).
  - `Creature::__toString(): string`.

- [ ] **Step 1: Écrire le test qui échoue**

Remplacer dans `backend/tests/Admin/BackOfficeSecurityTest.php` le test `testAdminOpensTheCreationFormOfEveryCrudSection` et son semis local par :

```php
    /** Sections dont l'administrateur peut créer et modifier une ligne. */
    private const WRITABLE_SECTIONS = [
        'user', 'race', 'family', 'profile', 'voie', 'capability',
        'creature-family', 'creature', 'equipment',
    ];

    /**
     * Chaque formulaire rend une liste déroulante par association, dont EasyAdmin construit
     * les libellés en convertissant l'entité liée en chaîne. Sans `__toString()`, la page
     * répond 500 — alors que l'index et le détail, eux, répondent 200.
     */
    public function testAdminOpensEveryWritableForm(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::WRITABLE_SECTIONS as $section) {
            $this->requestAsAdmin('/admin/'.$section);
            $this->assertResponseIsSuccessful(sprintf('L\'index « %s » doit répondre.', $section));

            $this->requestAsAdmin('/admin/'.$section.'/new');
            $this->assertResponseIsSuccessful(sprintf('Le formulaire de création « %s » doit répondre.', $section));

            if (isset($entities[$section])) {
                $this->requestAsAdmin(sprintf('/admin/%s/%d/edit', $section, $entities[$section]->getId()));
                $this->assertResponseIsSuccessful(sprintf('Le formulaire de modification « %s » doit répondre.', $section));
            }
        }
    }

    /**
     * `Capability.effect` est dérivé par `CapabilityEffectBuilder` au chargement des
     * fixtures. On veut le lire dans le back-office, pas le saisir : une saisie serait
     * écrasée au chargement suivant.
     */
    public function testDerivedJsonIsShownButNotEditable(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        $html = $this->requestAsAdmin(sprintf('/admin/capability/%d/edit', $entities['capability']->getId()));

        self::assertStringContainsString('Capability[effect]', $html, 'Le champ dérivé doit être affiché.');
        self::assertMatchesRegularExpression(
            '/name="Capability\[effect\]"[^>]*disabled/',
            $html,
            'Le champ dérivé doit être en lecture seule.'
        );
    }

    private function requestAsAdmin(string $path): string
    {
        $this->client->request('GET', $path, [
            'auth_basic' => ['admin@example.com', 'password'],
        ]);

        return $this->client->getKernelBrowser()->getResponse()->getContent();
    }
```

Ajouter `use App\Tests\Admin\BackOfficeFixture;` n'est pas nécessaire (même espace de noms), mais supprimer les `use App\Entity\…` devenus inutiles dans le fichier de test.

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `docker compose exec -T backend bin/phpunit tests/Admin/BackOfficeSecurityTest.php`
Expected: FAIL — l'index `/admin/user` répond, mais `testDerivedJsonIsShownButNotEditable` échoue : `Capability[effect]` est absent (le champ est masqué depuis #224).

- [ ] **Step 3: Écrire la classe de base**

`backend/src/Controller/Admin/AbstractWritableCrudController.php` :

```php
<?php

namespace App\Controller\Admin;

use App\Admin\Field\JsonField;
use Doctrine\ORM\EntityManagerInterface;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\AssociationField;

/**
 * Base des sections que l'administrateur peut créer et modifier.
 *
 * Les champs sont déduits des métadonnées Doctrine plutôt qu'énumérés à la main : une liste
 * écrite dans le contrôleur redit le schéma, vieillit en silence, et laisse invisible toute
 * colonne ajoutée ensuite. C'est ainsi que `RaceCrudController` a longtemps cité `title`,
 * un champ que l'entité n'a jamais eu.
 */
abstract class AbstractWritableCrudController extends AbstractCrudController
{
    public function __construct(protected readonly EntityManagerInterface $entityManager)
    {
    }

    public function configureFields(string $pageName): iterable
    {
        $metadata = $this->entityManager->getClassMetadata(static::getEntityFqcn());

        // Les champs par défaut d'EasyAdmin : les colonnes scalaires, sans les JSON, qu'il
        // exclut de ses quatre pages (voir FieldProvider::getDefaultFields()).
        yield from parent::configureFields($pageName);

        foreach ($metadata->getAssociationNames() as $association) {
            // Les collections ne sont montrées qu'en détail : sur un formulaire, elles
            // chargeraient toute la table liée pour remplir une liste déroulante.
            if ($metadata->isSingleValuedAssociation($association) || Crud::PAGE_DETAIL === $pageName) {
                yield AssociationField::new($association);
            }
        }

        // Un JSON imbriqué n'a pas sa place dans une colonne de tableau.
        if (Crud::PAGE_INDEX === $pageName) {
            return;
        }

        $derived = $this->derivedJsonFields();
        foreach ($metadata->getFieldNames() as $fieldName) {
            if ('json' !== $metadata->getTypeOfField($fieldName)) {
                continue;
            }

            $field = JsonField::new($fieldName);
            if (\in_array($fieldName, $derived, true)) {
                $field->setFormTypeOption('disabled', true);
            }

            yield $field;
        }
    }

    /**
     * Colonnes JSON dérivées par le code : affichées, jamais saisies.
     *
     * @return string[]
     */
    protected function derivedJsonFields(): array
    {
        return [];
    }
}
```

- [ ] **Step 4: Rebaser les neuf contrôleurs existants**

Pour `RaceCrudController`, `FamilyCrudController`, `CreatureFamilyCrudController`, `EquipmentCrudController`, `ProfileCrudController`, `VoieCrudController`, `CreatureCrudController` : remplacer `extends AbstractCrudController` par `extends AbstractWritableCrudController`, retirer l'import correspondant, **et supprimer leur `configureFields()`** — la classe de base fait mieux (elle expose aussi les colonnes JSON et les associations qu'ils oubliaient).

Exemple, `backend/src/Controller/Admin/VoieCrudController.php` en entier après modification :

```php
<?php

namespace App\Controller\Admin;

use App\Entity\Voie;

class VoieCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Voie::class;
    }
}
```

`CapabilityCrudController` garde un corps, pour une raison qui doit rester écrite :

```php
<?php

namespace App\Controller\Admin;

use App\Entity\Capability;

class CapabilityCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Capability::class;
    }

    /**
     * `effect` est un JSON dérivé de la description par `CapabilityEffectBuilder` au
     * chargement des fixtures. On l'affiche pour pouvoir le vérifier ; le saisir n'aurait
     * pas de sens, la valeur serait écrasée au chargement suivant.
     */
    protected function derivedJsonFields(): array
    {
        return ['effect'];
    }
}
```

`UserCrudController` garde son `configureFields()` (mot de passe en `PasswordType`, création seule) mais change de classe de base :

```php
class UserCrudController extends AbstractWritableCrudController
```

- [ ] **Step 5: Ajouter le `__toString()` manquant**

`backend/src/Entity/Creature.php`, après `setName()` (méthode fournie par `CreatureProfileTrait` — poser la méthode dans la classe `Creature`) :

```php
    /**
     * Nom affiché dans la liste déroulante « créature » du formulaire d'une CreatureVoie ;
     * sans conversion en chaîne, EasyAdmin lève une erreur au rendu du formulaire.
     */
    public function __toString(): string
    {
        return $this->getName() ?? '';
    }
```

- [ ] **Step 6: Lancer le test et vérifier qu'il passe**

Run: `docker compose exec -T backend bin/phpunit tests/Admin/BackOfficeSecurityTest.php`
Expected: PASS.

Si `testDerivedJsonIsShownButNotEditable` échoue sur l'expression régulière, ouvrir la page rendue et adapter l'assertion au balisage réel d'EasyAdmin (`disabled="disabled"` selon les versions) — **sans** relâcher l'assertion au point qu'elle passerait aussi sur un champ éditable.

- [ ] **Step 7: Commit**

```bash
git add backend/src/Controller/Admin backend/src/Entity/Creature.php backend/tests/Admin/BackOfficeSecurityTest.php
git commit -m "refactor(admin): classe de base en écriture pour les sections du compendium"
```

---

### Task 4: Les huit sections de compendium manquantes

**Files:**
- Create: `backend/src/Controller/Admin/FoodCrudController.php`, `LodgingCrudController.php`, `MaterialCrudController.php`, `MountCrudController.php`, `HarmfulStateCrudController.php`, `PoisonCrudController.php`, `TrapCrudController.php`, `CreatureVoieCrudController.php`
- Modify: `backend/src/Controller/Admin/DashboardController.php`
- Modify: `backend/tests/Admin/BackOfficeSecurityTest.php:WRITABLE_SECTIONS`

**Interfaces:**
- Consumes: `AbstractWritableCrudController` (Task 3).
- Produces: les routes `/admin/food`, `/admin/lodging`, `/admin/material`, `/admin/mount`, `/admin/harmful-state`, `/admin/poison`, `/admin/trap`, `/admin/creature-voie`.

- [ ] **Step 1: Étendre le test**

Dans `BackOfficeSecurityTest`, porter la constante à dix-sept sections :

```php
    private const WRITABLE_SECTIONS = [
        'user', 'race', 'family', 'profile', 'voie', 'capability',
        'creature-family', 'creature', 'creature-voie', 'equipment',
        'material', 'food', 'lodging', 'mount', 'harmful-state', 'poison', 'trap',
    ];
```

Le jeu d'essai nomme ces deux sections autrement que leur URL ; déclarer la correspondance juste au-dessus de la boucle du test :

```php
    /** Sections dont la clé dans le jeu d'essai diffère du segment d'URL. */
    private const FIXTURE_KEYS = [
        'harmful-state' => 'state',
        'homebrew-entry' => 'homebrew',
    ];
```

et dans la boucle, remplacer `$entities[$section]` par `$entities[self::FIXTURE_KEYS[$section] ?? $section]`.

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `docker compose exec -T backend bin/phpunit --filter testAdminOpensEveryWritableForm tests/Admin/BackOfficeSecurityTest.php`
Expected: FAIL — `/admin/creature-voie` répond 404, la route n'existe pas.

- [ ] **Step 3: Écrire les huit contrôleurs**

Chacun tient en dix lignes. Modèle, `backend/src/Controller/Admin/PoisonCrudController.php` :

```php
<?php

namespace App\Controller\Admin;

use App\Entity\Poison;

class PoisonCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Poison::class;
    }
}
```

Répéter à l'identique pour `Food`, `Lodging`, `Material`, `Mount`, `HarmfulState`, `Trap`, `CreatureVoie` en changeant l'entité importée, le nom de classe et le retour de `getEntityFqcn()`.

- [ ] **Step 4: Lancer le test et vérifier qu'il passe**

Run: `docker compose exec -T backend bin/phpunit --filter testAdminOpensEveryWritableForm tests/Admin/BackOfficeSecurityTest.php`
Expected: PASS (17 sections × 3 pages).

- [ ] **Step 5: Réécrire le menu**

`backend/src/Controller/Admin/DashboardController.php`, méthode `configureMenuItems()` :

```php
    public function configureMenuItems(): iterable
    {
        yield MenuItem::linkToDashboard('Tableau de bord', 'fa fa-home');

        yield MenuItem::section('Comptes');
        yield MenuItem::linkToCrud('Utilisateurs', 'fas fa-user', \App\Entity\User::class);

        yield MenuItem::subMenu('Compendium', 'fas fa-book')->setSubItems([
            MenuItem::linkToCrud('Peuples', 'fas fa-dna', \App\Entity\Race::class),
            MenuItem::linkToCrud('Familles de profils', 'fas fa-users', \App\Entity\Family::class),
            MenuItem::linkToCrud('Profils', 'fas fa-id-card', \App\Entity\Profile::class),
            MenuItem::linkToCrud('Voies', 'fas fa-road', \App\Entity\Voie::class),
            MenuItem::linkToCrud('Capacités', 'fas fa-magic', \App\Entity\Capability::class),
            MenuItem::linkToCrud('Équipement', 'fas fa-shield-alt', \App\Entity\Equipment::class),
            MenuItem::linkToCrud('Matériel', 'fas fa-toolbox', \App\Entity\Material::class),
            MenuItem::linkToCrud('Nourriture', 'fas fa-drumstick-bite', \App\Entity\Food::class),
            MenuItem::linkToCrud('Hébergement', 'fas fa-bed', \App\Entity\Lodging::class),
            MenuItem::linkToCrud('Montures', 'fas fa-horse', \App\Entity\Mount::class),
            MenuItem::linkToCrud('États préjudiciables', 'fas fa-heart-crack', \App\Entity\HarmfulState::class),
            MenuItem::linkToCrud('Poisons', 'fas fa-flask', \App\Entity\Poison::class),
            MenuItem::linkToCrud('Pièges', 'fas fa-bomb', \App\Entity\Trap::class),
        ]);

        yield MenuItem::subMenu('Bestiaire', 'fas fa-dragon')->setSubItems([
            MenuItem::linkToCrud('Familles de créatures', 'fas fa-sitemap', \App\Entity\CreatureFamily::class),
            MenuItem::linkToCrud('Créatures', 'fas fa-paw', \App\Entity\Creature::class),
            MenuItem::linkToCrud('Voies de créature', 'fas fa-route', \App\Entity\CreatureVoie::class),
        ]);
    }
```

Les deux dernières sections (contenu communautaire, données des utilisateurs) arrivent en Task 5, quand leurs contrôleurs existent.

- [ ] **Step 6: Vérifier le menu à l'œil**

```bash
printf 'services:\n  nginx:\n    ports: !override\n      - "8001:80"\n' > override-8001.yml
docker compose -f docker-compose.yml -f override-8001.yml up -d
curl -s -o /dev/null -w '%{http_code}\n' -u admin@example.com:admin http://localhost:8001/admin/poison
```

Le tag `!override` est nécessaire : sans lui, Compose **ajoute** le port au lieu de le remplacer, et le conteneur retombe sur le 8000 déjà pris.

Expected: `200`, et les trois sections repliées visibles dans la barre latérale.

- [ ] **Step 7: Commit**

```bash
git add backend/src/Controller/Admin backend/tests/Admin/BackOfficeSecurityTest.php
git commit -m "feat(admin): huit sections de compendium et menu en français"
```

---

### Task 5: Les dix sections en consultation seule

**Files:**
- Create: `backend/src/Controller/Admin/AbstractReadDeleteCrudController.php`
- Create: `backend/src/Controller/Admin/CampaignCrudController.php`, `QuestCrudController.php`, `ClueCrudController.php`, `SessionCrudController.php`, `EncounterCrudController.php`, `CampaignMembershipCrudController.php`, `CharacterCrudController.php`, `CharacterVoieCrudController.php`, `HomebrewEntryCrudController.php`, `CustomCreatureCrudController.php`
- Modify: `backend/src/Controller/Admin/DashboardController.php`
- Modify: `backend/tests/Admin/BackOfficeSecurityTest.php`

**Interfaces:**
- Consumes: `AbstractWritableCrudController` (Task 3).
- Produces: `AbstractReadDeleteCrudController` — mêmes champs, `configureActions()` retire `Action::NEW` et `Action::EDIT` et ajoute `Action::DETAIL` à l'index.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter à `BackOfficeSecurityTest` :

```php
    /** Sections que l'administrateur peut consulter et supprimer, jamais créer ni modifier. */
    private const READ_DELETE_SECTIONS = [
        'campaign', 'campaign-membership', 'quest', 'clue', 'session', 'encounter',
        'character', 'character-voie', 'homebrew-entry', 'custom-creature',
    ];

    public function testAdminReadsEveryUserDataSection(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::READ_DELETE_SECTIONS as $section) {
            $this->requestAsAdmin('/admin/'.$section);
            $this->assertResponseIsSuccessful(sprintf('L\'index « %s » doit répondre.', $section));

            $entity = $entities[self::FIXTURE_KEYS[$section] ?? $section];
            $this->requestAsAdmin(sprintf('/admin/%s/%d', $section, $entity->getId()));
            $this->assertResponseIsSuccessful(sprintf('Le détail « %s » doit répondre.', $section));
        }
    }

    /**
     * Ces données appartiennent à un utilisateur et sont écrites par le front, qui applique
     * des règles (propriétaire, appartenance, dérivations) qu'un formulaire ignore. Le refus
     * doit venir d'EasyAdmin lui-même, pas d'un bouton caché : la route doit être fermée.
     */
    public function testWriteRoutesAreClosedOnUserDataSections(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::READ_DELETE_SECTIONS as $section) {
            $entity = $entities[self::FIXTURE_KEYS[$section] ?? $section];

            $this->requestAsAdmin('/admin/'.$section.'/new');
            $this->assertResponseStatusCodeSame(403, sprintf('La création « %s » doit être refusée.', $section));

            $this->requestAsAdmin(sprintf('/admin/%s/%d/edit', $section, $entity->getId()));
            $this->assertResponseStatusCodeSame(403, sprintf('La modification « %s » doit être refusée.', $section));
        }
    }
```

Compléter `FIXTURE_KEYS` :

```php
    private const FIXTURE_KEYS = [
        'harmful-state' => 'state',
        'homebrew-entry' => 'homebrew',
        'campaign-membership' => 'membership',
    ];
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Run: `docker compose exec -T backend bin/phpunit --filter testAdminReadsEveryUserDataSection tests/Admin/BackOfficeSecurityTest.php`
Expected: FAIL — `/admin/campaign` répond 404.

- [ ] **Step 3: Écrire la classe de base**

`backend/src/Controller/Admin/AbstractReadDeleteCrudController.php` :

```php
<?php

namespace App\Controller\Admin;

use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;

/**
 * Base des sections qui montrent des données appartenant à un utilisateur.
 *
 * Consulter et supprimer, jamais créer ni modifier : ces données sont écrites par le front,
 * qui applique des règles (propriétaire, appartenance à la campagne, dérivations de la
 * fiche) qu'un formulaire EasyAdmin ignore. Écrire `Character.caracs` à la main produirait
 * une fiche que le front refuserait d'ouvrir.
 *
 * `disable()` ferme aussi les routes, pas seulement les boutons.
 */
abstract class AbstractReadDeleteCrudController extends AbstractWritableCrudController
{
    public function configureActions(Actions $actions): Actions
    {
        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->disable(Action::NEW, Action::EDIT);
    }
}
```

- [ ] **Step 4: Écrire les dix contrôleurs**

Modèle, `backend/src/Controller/Admin/CampaignCrudController.php` :

```php
<?php

namespace App\Controller\Admin;

use App\Entity\Campaign;

class CampaignCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Campaign::class;
    }
}
```

Répéter pour `Quest`, `Clue`, `Session`, `Encounter`, `CampaignMembership`, `Character`, `CharacterVoie`, `HomebrewEntry`, `CustomCreature`.

Attention à `Session` : `App\Entity\Session` est homonyme de la session HTTP de Symfony. L'import `use App\Entity\Session;` suffit dans ce fichier, qui n'utilise pas l'autre.

- [ ] **Step 5: Lancer les deux tests et vérifier qu'ils passent**

Run: `docker compose exec -T backend bin/phpunit tests/Admin/BackOfficeSecurityTest.php`
Expected: PASS.

Si les routes `new`/`edit` répondent 404 au lieu de 403, c'est qu'EasyAdmin les supprime au lieu de les interdire : adapter l'assertion au code réellement renvoyé, en gardant le test — ce qui compte est qu'aucune écriture ne soit possible, pas le numéro exact.

- [ ] **Step 6: Compléter le menu**

Dans `configureMenuItems()`, après la section Bestiaire :

```php
        yield MenuItem::subMenu('Contenu communautaire', 'fas fa-users-rays')->setSubItems([
            MenuItem::linkToCrud('Créations partagées', 'fas fa-scroll', \App\Entity\HomebrewEntry::class),
            MenuItem::linkToCrud('Monstres maison', 'fas fa-ghost', \App\Entity\CustomCreature::class),
        ]);

        // Données appartenant aux utilisateurs : consultation et suppression seulement.
        yield MenuItem::subMenu('Données des utilisateurs', 'fas fa-lock')->setSubItems([
            MenuItem::linkToCrud('Campagnes', 'fas fa-map', \App\Entity\Campaign::class),
            MenuItem::linkToCrud('Adhésions', 'fas fa-user-plus', \App\Entity\CampaignMembership::class),
            MenuItem::linkToCrud('Quêtes', 'fas fa-flag', \App\Entity\Quest::class),
            MenuItem::linkToCrud('Indices', 'fas fa-magnifying-glass', \App\Entity\Clue::class),
            MenuItem::linkToCrud('Séances', 'fas fa-calendar-day', \App\Entity\Session::class),
            MenuItem::linkToCrud('Rencontres', 'fas fa-skull', \App\Entity\Encounter::class),
            MenuItem::linkToCrud('Personnages', 'fas fa-user-shield', \App\Entity\Character::class),
            MenuItem::linkToCrud('Voies de personnage', 'fas fa-diagram-project', \App\Entity\CharacterVoie::class),
        ]);
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/Controller/Admin backend/tests/Admin/BackOfficeSecurityTest.php
git commit -m "feat(admin): dix sections en consultation et suppression"
```

---

### Task 6: Les suppressions, et ce qu'elles refusent

Supprimer depuis le back-office suit les cascades Doctrine, qui n'ont pas été écrites pour cet usage. Cette tâche mesure ce qui passe et fige le résultat dans un test, sans toucher aux cascades.

**Files:**
- Modify: `backend/tests/Admin/BackOfficeSecurityTest.php`
- Modify: `docs/superpowers/specs/2026-08-14-back-office-entites-manquantes-design.md` (section « Suppression »)

**Interfaces:**
- Consumes: `BackOfficeFixture::seed()`, `AbstractReadDeleteCrudController`.
- Produces: helper de test `deleteAsAdmin(string $section, int $id): int` — renvoie le code HTTP de la réponse de suppression.

- [ ] **Step 1: Écrire le helper et le test de balayage**

```php
    /**
     * EasyAdmin protège la suppression par un jeton de session. Le navigateur de test garde
     * les cookies entre deux requêtes : il suffit de lire le jeton sur la page de détail.
     */
    private function deleteAsAdmin(string $section, int $id): int
    {
        $html = $this->requestAsAdmin(sprintf('/admin/%s/%d', $section, $id));
        self::assertMatchesRegularExpression('/name="token" value="([^"]+)"/', $html, 'La page de détail doit porter un jeton de suppression.');
        preg_match('/name="token" value="([^"]+)"/', $html, $matches);

        $browser = $this->client->getKernelBrowser();
        $browser->request(
            'POST',
            sprintf('/admin/%s/%d/delete', $section, $id),
            ['token' => $matches[1]],
            [],
            ['PHP_AUTH_USER' => 'admin@example.com', 'PHP_AUTH_PW' => 'password'],
        );

        return $browser->getResponse()->getStatusCode();
    }

    /**
     * Une suppression par section. Les cascades du domaine campagne n'ont pas été écrites
     * pour le back-office : certaines lignes sont retenues par une clé étrangère. Le test
     * fige ce qui est vrai aujourd'hui — il n'invente pas de cascade pour se satisfaire.
     */
    public function testAdminDeletesUserData(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::DELETABLE_SECTIONS as $section) {
            $entity = $entities[self::FIXTURE_KEYS[$section] ?? $section];
            $id = $entity->getId();
            $class = $entity::class;

            self::assertSame(302, $this->deleteAsAdmin($section, $id), sprintf('La suppression « %s » doit aboutir.', $section));

            $this->em->clear();
            self::assertNull($this->em->find($class, $id), sprintf('La ligne « %s » doit avoir disparu.', $section));
        }
    }
```

Déclarer provisoirement la constante avec **toutes** les sections, pour mesurer :

```php
    private const DELETABLE_SECTIONS = self::READ_DELETE_SECTIONS;
```

- [ ] **Step 2: Lancer le test pour mesurer**

Run: `docker compose exec -T backend bin/phpunit --filter testAdminDeletesUserData tests/Admin/BackOfficeSecurityTest.php`
Expected: le test échoue sur la première section retenue par une clé étrangère. Noter laquelle et son message exact.

Relancer en retirant cette section de la constante, jusqu'à obtenir une liste qui passe. **Supprimer les feuilles avant les racines** : l'ordre du tableau compte (une campagne dont on vient de supprimer les quêtes se supprime, l'inverse non).

- [ ] **Step 3: Figer le résultat**

Remplacer la constante provisoire par les deux listes observées, avec leur explication :

```php
    /** Sections dont une ligne se supprime depuis le back-office, feuilles d'abord. */
    private const DELETABLE_SECTIONS = [/* liste observée à l'étape 2 */];

    /**
     * Sections retenues par une clé étrangère : leurs enfants n'ont pas de cascade, parce
     * que le domaine campagne n'a jamais eu besoin d'une suppression administrative. On le
     * constate ici plutôt que de changer le produit pour arranger son outil d'administration.
     */
    private const DELETION_REFUSED_SECTIONS = [/* liste observée à l'étape 2 */];
```

et ajouter le test qui documente le refus :

```php
    public function testSomeDeletionsAreRefusedByForeignKeys(): void
    {
        if ([] === self::DELETION_REFUSED_SECTIONS) {
            self::markTestSkipped('Aucune section n\'est retenue par une clé étrangère.');
        }

        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $entities = BackOfficeFixture::seed($this->em, $admin);

        foreach (self::DELETION_REFUSED_SECTIONS as $section) {
            $entity = $entities[self::FIXTURE_KEYS[$section] ?? $section];
            $status = $this->deleteAsAdmin($section, $entity->getId());

            self::assertNotSame(302, $status, sprintf('La suppression « %s » est censée être refusée ; si elle aboutit désormais, déplacer la section dans DELETABLE_SECTIONS.', $section));
        }
    }
```

- [ ] **Step 4: Lancer la suite complète**

Run: `docker compose exec -T backend bin/phpunit`
Expected: `OK`, **et** code de retour 0 (`echo $?`).

- [ ] **Step 5: Reporter le constat dans la spec**

Dans la section « Suppression : ce qui n'est pas garanti », remplacer la phrase d'intention par la liste réelle des sections qui refusent, et pourquoi (quel enfant, quelle clé étrangère).

- [ ] **Step 6: Commit**

```bash
git add backend/tests/Admin/BackOfficeSecurityTest.php docs/superpowers/specs/2026-08-14-back-office-entites-manquantes-design.md
git commit -m "test(admin): balayage des suppressions et refus documentés"
```

---

### Task 7: L'état des lieux et la demande de fusion

**Files:**
- Modify: `doc/etat_des_lieux/backend.md` (§6 EasyAdmin, §9 tests)
- Modify: `doc/etat_des_lieux/architecture.md` (décompte des contrôleurs)
- Modify: `doc/etat_des_lieux/roadmap.md` (ligne « CRUD administrateur »)

- [ ] **Step 1: Mettre à jour `backend.md` §6**

Y porter : 27 contrôleurs (9 → 27), les deux comportements et leurs classes de base, le champ JSON piloté par les métadonnées Doctrine, le menu à cinq sections, et le fait que les données des utilisateurs sont **visibles** par tout `ROLE_ADMIN` — c'est un choix, il doit être lisible ailleurs que dans la spec.

- [ ] **Step 2: Mettre à jour le décompte des tests**

Relever le nombre exact rendu par la suite (`docker compose exec -T backend bin/phpunit | tail -3`) et le reporter dans `backend.md` §9 et dans `roadmap.md`, à la place de « 131 tests / 1254 assertions ».

- [ ] **Step 3: Commit et demande de fusion**

```bash
git add doc/etat_des_lieux
git commit -m "docs(état des lieux): le back-office couvre 27 entités"
git push -u origin feat/back-office-entites-manquantes
```

Ouvrir la demande de fusion vers `master`, corps en français : le problème (9 entités sur 28), les deux comportements, le champ JSON, le menu, ce que la couverture de test garantit, et les suppressions refusées telles que mesurées.

- [ ] **Step 4: Attendre les quatre travaux d'intégration continue**

Les quatre doivent être verts avant fusion : front, back, fidélité du bestiaire, e2e.

---

## Revue du plan

**Couverture de la spec**

| Exigence de la spec | Tâche |
|---|---|
| 27 contrôleurs, `PasswordResetToken` exclu | 3, 4, 5 |
| Famille A en écriture complète (17) | 3, 4 |
| Familles B et C en consultation + suppression (10) | 5 |
| `AbstractWritableCrudController` / `AbstractReadDeleteCrudController` nommées par comportement | 3, 5 |
| `JsonField` + transformateur, langage `js` | 2 |
| Repérage des colonnes JSON par `ClassMetadata::getTypeOfField()` | 3 |
| `Capability.effect` visible en lecture seule | 3 |
| `__toString()` sur `Creature` (cité par `CreatureVoie`) | 3 |
| Menu à cinq sections françaises repliées | 4, 5 |
| Suppressions vérifiées section par section et refus documentés | 6 |
| Jeu d'essai sorti dans `BackOfficeFixture` | 1 |
| Tests : accès, rendu, refus d'écriture, suppression | 1, 3, 4, 5, 6 |
| Aucune modification des cascades ni de l'API | contrainte globale |

**Cohérence des noms** — `BackOfficeFixture::seed()` (Task 1) est appelé tel quel en 3, 5 et 6 ; `derivedJsonFields()` est défini en 3 et surchargé en 3 (`CapabilityCrudController`) ; `requestAsAdmin()` est défini en 3 et réutilisé en 5 et 6 ; `deleteAsAdmin()` est défini en 6 et n'est utilisé que là ; les clés du jeu d'essai et les segments d'URL divergent sur trois sections, d'où `FIXTURE_KEYS`, complété en 4 puis en 5.

**Deux endroits où le plan demande de mesurer avant d'écrire**, parce que la réponse dépend d'EasyAdmin et de Postgres, pas d'un choix de conception : le code HTTP des routes fermées (Task 5, étape 5) et la liste des suppressions refusées (Task 6, étape 2). Dans les deux cas le plan dit quoi lancer, quoi observer, et ce qu'il est interdit de faire pour rendre le test vert (relâcher l'assertion, ajouter une cascade).
