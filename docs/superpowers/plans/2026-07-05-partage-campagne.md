# Partage asynchrone MJ ⇄ Joueurs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un joueur (avec compte) de rejoindre la campagne d'un MJ par code, d'y lire les résumés de séances en lecture seule, et d'y rattacher ses fiches que le MJ peut lire et éditer.

**Architecture :** Backend Symfony/API Platform déclaratif. Nouvelle entité de jonction `CampaignMembership` + `Campaign.inviteCode`. Une ressource read-only dédiée `SharedCampaign` (DTO + State Provider) isole ce que voit le joueur (nom + résumés uniquement) — le joueur ne touche jamais la ressource `Campaign`. Le partage des fiches passe par un élargissement de la sécurité de `Character` (owner **ou** MJ de la campagne). Frontend React : un `sharingService` + écrans MJ (invite/membres) et joueur (rejoindre/résumés).

**Tech Stack :** PHP 8.3, Symfony 7.4, API Platform 4.2, Doctrine ORM 3, PostgreSQL 15 ; React 19 + TypeScript + Vite ; PHPUnit.

## Global Constraints

- **Isolation des secrets** : le joueur ne doit jamais recevoir `Campaign.notes`, les `Clue`, ni les `Quest`. Seuls `name` + résumés de `Session` transitent, via `SharedCampaign`.
- **Deux couches de sécurité** : garder le double verrou existant — `CurrentUserExtension` (scope des requêtes) **et** expressions `security:` par opération.
- **Identité affichée** = `User.pseudo`, jamais l'email.
- **Delete d'une fiche** = propriétaire (joueur) uniquement ; le MJ ne supprime pas.
- **Docs/commentaires en français.**
- **Migrations indépendantes des tests** : `ApiSecurityTestCase` reconstruit le schéma depuis les métadonnées Doctrine (`DROP SCHEMA public` + `SchemaTool::createSchema`), donc les tests passent sans migration ; les migrations ne servent qu'à l'app qui tourne.

### Commandes de référence

Pré-requis (stack de dev up) :
```bash
docker compose up -d database backend
```
Lancer un test ciblé :
```bash
docker compose exec -T backend bin/phpunit --filter NomDuTest
```
Générer une migration après un changement de mapping :
```bash
docker compose exec -T backend bin/console doctrine:migrations:diff
docker compose exec -T backend bin/console doctrine:migrations:migrate --no-interaction
```
Frontend (type-check / lint) :
```bash
cd app && npm run build && npm run lint
```

---

## File Structure

**Backend — créés :**
- `backend/src/Entity/CampaignMembership.php` — jonction (campaign, player, joinedAt)
- `backend/src/Repository/CampaignMembershipRepository.php`
- `backend/src/Service/InviteCodeGenerator.php` — génère un code lisible
- `backend/src/ApiResource/SharedCampaign.php` — DTO read-model joueur
- `backend/src/ApiResource/SharedSession.php` — DTO résumé de séance
- `backend/src/ApiResource/JoinCampaignInput.php` — DTO d'entrée `{ code }`
- `backend/src/Factory/SharedCampaignFactory.php` — mapping Campaign→DTO partagé (source unique)
- `backend/src/State/SharedCampaignProvider.php` — provider lecture (membre)
- `backend/src/State/JoinCampaignProcessor.php` — rejoindre par code
- `backend/src/State/RegenerateInviteProcessor.php` — régénérer le code
- `backend/tests/Api/InviteAndJoinTest.php`, `SharedCampaignTest.php`, `CampaignMembershipTest.php`, `CharacterSharingTest.php`, `UserPseudoTest.php`

**Backend — modifiés :**
- `backend/src/Entity/Campaign.php` — `inviteCode`, `memberships`, op `regenerate_invite`
- `backend/src/Entity/User.php` — `pseudo`
- `backend/src/Entity/Character.php` — expressions `security` (owner ou MJ)
- `backend/src/State/CampaignStateProcessor.php` — génère `inviteCode` à la création
- `backend/src/State/CharacterStateProcessor.php` — valide le rattachement à une campagne
- `backend/src/Doctrine/CurrentUserExtension.php` — cas Character/CampaignMembership

**Frontend — créés/modifiés :**
- `app/src/services/sharingService.ts` (créé)
- `app/src/pages/CampaignDetail.tsx`, `app/src/pages/Campaign.tsx` (modifiés)
- `app/src/pages/RegisterPage.tsx`, `app/src/services/AuthService.ts` (modifiés — pseudo)

---

## Task 1 : `User.pseudo`

**Files:**
- Modify: `backend/src/Entity/User.php`
- Test: `backend/tests/Api/UserPseudoTest.php`

**Interfaces:**
- Produces: `User::getPseudo(): ?string`, `User::setPseudo(?string): static`. Champ sérialisé dans `user:read`, requis en `user:create`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `backend/tests/Api/UserPseudoTest.php` :
```php
<?php

namespace App\Tests\Api;

/**
 * Le pseudo est requis à l'inscription et exposé en lecture ; il ne remplace
 * pas l'email comme identifiant de connexion.
 */
final class UserPseudoTest extends ApiSecurityTestCase
{
    public function testRegistrationRequiresPseudo(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'nopseudo@example.com', 'password' => 'password'],
        ]);
        $this->assertResponseStatusCodeSame(422); // validation: pseudo manquant
    }

    public function testRegistrationStoresPseudo(): void
    {
        $response = $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'jean@example.com', 'password' => 'password', 'pseudo' => 'Jean le Rouge'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['pseudo' => 'Jean le Rouge']);
    }
}
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `docker compose exec -T backend bin/phpunit --filter UserPseudoTest`
Expected: FAIL (pseudo inconnu / 201 au lieu de 422).

- [ ] **Step 3 : Ajouter le champ `pseudo`**

Dans `backend/src/Entity/User.php`, ajouter l'import et la propriété après `$email` (l.46) :
```php
use Symfony\Component\Validator\Constraints as Assert;
```
```php
    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['user:read', 'user:create', 'user:update'])]
    #[Assert\NotBlank(groups: ['user:create'])]
    private ?string $pseudo = null;
```
Et les accesseurs (après `setEmail`) :
```php
    public function getPseudo(): ?string
    {
        return $this->pseudo;
    }

    public function setPseudo(?string $pseudo): static
    {
        $this->pseudo = $pseudo;

        return $this;
    }
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `docker compose exec -T backend bin/phpunit --filter UserPseudoTest`
Expected: PASS.

- [ ] **Step 5 : Générer la migration (colonne + backfill)**

Run: `docker compose exec -T backend bin/console doctrine:migrations:diff`
Puis, dans le fichier de migration généré (`backend/migrations/VersionXXXX.php`), **ajouter à la fin de `up()`** le backfill des comptes existants (le pseudo reste nullable en base) :
```php
$this->addSql("UPDATE \"user\" SET pseudo = split_part(email, '@', 1) WHERE pseudo IS NULL");
```
Appliquer : `docker compose exec -T backend bin/console doctrine:migrations:migrate --no-interaction`

- [ ] **Step 6 : Commit**

```bash
git add backend/src/Entity/User.php backend/tests/Api/UserPseudoTest.php backend/migrations/
git commit -m "feat(user): ajoute le champ pseudo (requis à l'inscription)"
```

---

## Task 2 : Entité `CampaignMembership` + `Campaign.inviteCode`

**Files:**
- Create: `backend/src/Entity/CampaignMembership.php`, `backend/src/Repository/CampaignMembershipRepository.php`, `backend/src/Service/InviteCodeGenerator.php`
- Modify: `backend/src/Entity/Campaign.php`, `backend/src/State/CampaignStateProcessor.php`
- Test: `backend/tests/Api/InviteAndJoinTest.php` (partie invite)

**Interfaces:**
- Produces:
  - `CampaignMembership` avec `getCampaign()/setCampaign(?Campaign)`, `getPlayer()/setPlayer(?User)`, `getJoinedAt()`, `getId()`.
  - `Campaign::getInviteCode(): ?string`, `Campaign::setInviteCode(?string): static`, `Campaign::getMemberships(): Collection`.
  - `InviteCodeGenerator::generate(int $length = 8): string`.
  - `CampaignMembershipRepository::findCampaignsForPlayer(User): Campaign[]`, `::findOneByCampaignAndPlayer(Campaign, User): ?CampaignMembership`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `backend/tests/Api/InviteAndJoinTest.php` :
```php
<?php

namespace App\Tests\Api;

/**
 * Génération et régénération du code d'invitation, puis rejoindre par code.
 */
final class InviteAndJoinTest extends ApiSecurityTestCase
{
    public function testCampaignGetsInviteCodeOnCreate(): void
    {
        $mj = $this->createUser('mj@example.com');

        $response = $this->client->request('POST', '/api/campaigns', [
            'headers' => $this->authHeaders($mj),
            'json' => ['name' => 'Osgild'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $data = $response->toArray();
        $this->assertArrayHasKey('inviteCode', $data);
        $this->assertNotEmpty($data['inviteCode']);
    }
}
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `docker compose exec -T backend bin/phpunit --filter testCampaignGetsInviteCodeOnCreate`
Expected: FAIL (pas de clé `inviteCode`).

- [ ] **Step 3 : Créer le générateur de code**

`backend/src/Service/InviteCodeGenerator.php` :
```php
<?php

namespace App\Service;

/**
 * Génère un code d'invitation court et lisible (sans caractères ambigus).
 */
final class InviteCodeGenerator
{
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public function generate(int $length = 8): string
    {
        $code = '';
        $max = strlen(self::ALPHABET) - 1;
        for ($i = 0; $i < $length; $i++) {
            $code .= self::ALPHABET[random_int(0, $max)];
        }

        return $code;
    }
}
```

- [ ] **Step 4 : Créer l'entité `CampaignMembership` + son repository**

`backend/src/Entity/CampaignMembership.php` :
```php
<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\CampaignMembershipRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CampaignMembershipRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_campaign_player', columns: ['campaign_id', 'player_id'])]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security: "is_granted('ROLE_USER') and (object.getPlayer() == user or object.getCampaign().getOwner() == user)"),
        new Delete(security: "is_granted('ROLE_USER') and (object.getPlayer() == user or object.getCampaign().getOwner() == user)"),
    ],
    normalizationContext: ['groups' => ['membership:read']],
)]
class CampaignMembership
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['membership:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'memberships')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['membership:read'])]
    private ?Campaign $campaign = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['membership:read'])]
    private ?User $player = null;

    #[ORM\Column]
    #[Groups(['membership:read'])]
    private ?\DateTimeImmutable $joinedAt = null;

    public function __construct()
    {
        $this->joinedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCampaign(): ?Campaign
    {
        return $this->campaign;
    }

    public function setCampaign(?Campaign $campaign): static
    {
        $this->campaign = $campaign;

        return $this;
    }

    public function getPlayer(): ?User
    {
        return $this->player;
    }

    public function setPlayer(?User $player): static
    {
        $this->player = $player;

        return $this;
    }

    public function getJoinedAt(): ?\DateTimeImmutable
    {
        return $this->joinedAt;
    }
}
```

`backend/src/Repository/CampaignMembershipRepository.php` :
```php
<?php

namespace App\Repository;

use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CampaignMembership>
 */
class CampaignMembershipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CampaignMembership::class);
    }

    public function findOneByCampaignAndPlayer(Campaign $campaign, User $player): ?CampaignMembership
    {
        return $this->findOneBy(['campaign' => $campaign, 'player' => $player]);
    }

    /**
     * @return Campaign[]
     */
    public function findCampaignsForPlayer(User $player): array
    {
        return array_map(
            static fn (CampaignMembership $m) => $m->getCampaign(),
            $this->findBy(['player' => $player]),
        );
    }
}
```

- [ ] **Step 5 : Ajouter `inviteCode` + `memberships` à `Campaign`**

Dans `backend/src/Entity/Campaign.php`, ajouter les propriétés (après `$notes`, l.60) :
```php
    #[Groups(['campaign:read'])]
    #[ORM\Column(length: 16, unique: true, nullable: true)]
    private ?string $inviteCode = null;

    #[ORM\OneToMany(mappedBy: 'campaign', targetEntity: CampaignMembership::class, orphanRemoval: true)]
    private Collection $memberships;
```
Dans le constructeur, ajouter :
```php
        $this->memberships = new ArrayCollection();
```
Accesseurs (à ajouter en fin de classe) :
```php
    public function getInviteCode(): ?string
    {
        return $this->inviteCode;
    }

    public function setInviteCode(?string $inviteCode): static
    {
        $this->inviteCode = $inviteCode;

        return $this;
    }

    /**
     * @return Collection<int, CampaignMembership>
     */
    public function getMemberships(): Collection
    {
        return $this->memberships;
    }
```

- [ ] **Step 6 : Générer `inviteCode` à la création dans `CampaignStateProcessor`**

Dans `backend/src/State/CampaignStateProcessor.php`, injecter le générateur et l'utiliser. Constructeur :
```php
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
        private \App\Service\InviteCodeGenerator $inviteCodeGenerator,
    ) {
    }
```
Dans `process()`, juste avant `setUpdatedAt` :
```php
        if ($data instanceof Campaign && null === $data->getInviteCode()) {
            $data->setInviteCode($this->inviteCodeGenerator->generate());
        }
```

- [ ] **Step 7 : Lancer le test, vérifier le succès**

Run: `docker compose exec -T backend bin/phpunit --filter testCampaignGetsInviteCodeOnCreate`
Expected: PASS.

- [ ] **Step 8 : Migration (table + colonne + backfill)**

Run: `docker compose exec -T backend bin/console doctrine:migrations:diff`
Dans la migration générée, après le `CREATE TABLE campaign_membership …` et l'`ALTER TABLE campaign ADD invite_code …`, ajouter le backfill d'un code pour les campagnes existantes (avant la création de l'index unique si `diff` l'a mis ; sinon en fin de `up()`) :
```php
$this->addSql("UPDATE campaign SET invite_code = upper(substr(md5(random()::text || id::text), 1, 8)) WHERE invite_code IS NULL");
```
Appliquer : `docker compose exec -T backend bin/console doctrine:migrations:migrate --no-interaction`

- [ ] **Step 9 : Commit**

```bash
git add backend/src/Entity/CampaignMembership.php backend/src/Repository/CampaignMembershipRepository.php backend/src/Service/InviteCodeGenerator.php backend/src/Entity/Campaign.php backend/src/State/CampaignStateProcessor.php backend/tests/Api/InviteAndJoinTest.php backend/migrations/
git commit -m "feat(campaign): CampaignMembership + code d'invitation généré à la création"
```

---

## Task 3 : Régénérer le code d'invitation

**Files:**
- Create: `backend/src/State/RegenerateInviteProcessor.php`
- Modify: `backend/src/Entity/Campaign.php` (nouvelle opération)
- Test: `backend/tests/Api/InviteAndJoinTest.php` (ajouts)

**Interfaces:**
- Consumes: `InviteCodeGenerator::generate()`, `Campaign::setInviteCode()`.
- Produces: `POST /api/campaigns/{id}/regenerate_invite` → renvoie la `Campaign` (avec le nouveau `inviteCode`).

- [ ] **Step 1 : Ajouter les tests qui échouent**

Dans `backend/tests/Api/InviteAndJoinTest.php`, ajouter :
```php
    public function testOwnerCanRegenerateInviteCode(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj);
        $campaign->setInviteCode('OLDCODE1');
        $this->em->flush();

        $response = $this->client->request('POST', '/api/campaigns/'.$campaign->getId().'/regenerate_invite', [
            'headers' => $this->authHeaders($mj),
            'json' => [],
        ]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertNotSame('OLDCODE1', $response->toArray()['inviteCode']);
    }

    public function testNonOwnerCannotRegenerate(): void
    {
        $mj = $this->createUser('mj@example.com');
        $intrus = $this->createUser('intrus@example.com');
        $campaign = $this->createCampaign($mj);

        $this->client->request('POST', '/api/campaigns/'.$campaign->getId().'/regenerate_invite', [
            'headers' => $this->authHeaders($intrus),
            'json' => [],
        ]);
        // Scopé hors requête par CurrentUserExtension -> 404
        $this->assertResponseStatusCodeSame(404);
    }
```
> Note : `createCampaign` (helper existant) ne pose pas de `inviteCode` — c'est voulu, on le fixe explicitement dans le test.

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T backend bin/phpunit --filter InviteAndJoinTest`
Expected: FAIL (route inconnue → 404 sur le premier test aussi).

- [ ] **Step 3 : Créer le processor**

`backend/src/State/RegenerateInviteProcessor.php` :
```php
<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Campaign;
use App\Service\InviteCodeGenerator;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Régénère le code d'invitation d'une campagne (révocation de l'ancien code).
 */
final readonly class RegenerateInviteProcessor implements ProcessorInterface
{
    public function __construct(
        private InviteCodeGenerator $inviteCodeGenerator,
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * @param Campaign $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Campaign
    {
        $data->setInviteCode($this->inviteCodeGenerator->generate());
        $this->em->flush();

        return $data;
    }
}
```

- [ ] **Step 4 : Déclarer l'opération sur `Campaign`**

Dans `backend/src/Entity/Campaign.php`, ajouter les imports :
```php
use App\State\RegenerateInviteProcessor;
```
et une opération dans le tableau `operations:` (après le `Delete`) :
```php
        new Post(
            uriTemplate: '/campaigns/{id}/regenerate_invite',
            security: "is_granted('ROLE_USER') and object.getOwner() == user",
            processor: RegenerateInviteProcessor::class,
            read: true,
        ),
```

- [ ] **Step 5 : Lancer, vérifier le succès**

Run: `docker compose exec -T backend bin/phpunit --filter InviteAndJoinTest`
Expected: PASS (3 tests).

- [ ] **Step 6 : Commit**

```bash
git add backend/src/State/RegenerateInviteProcessor.php backend/src/Entity/Campaign.php backend/tests/Api/InviteAndJoinTest.php
git commit -m "feat(campaign): opération regenerate_invite (révocation du code)"
```

---

## Task 4 : Ressource `SharedCampaign` + rejoindre par code

**Files:**
- Create: `backend/src/ApiResource/SharedCampaign.php`, `SharedSession.php`, `JoinCampaignInput.php`, `backend/src/Factory/SharedCampaignFactory.php`, `backend/src/State/SharedCampaignProvider.php`, `backend/src/State/JoinCampaignProcessor.php`
- Test: `backend/tests/Api/SharedCampaignTest.php`

**Interfaces:**
- Consumes: `CampaignMembershipRepository::findCampaignsForPlayer()` / `findOneByCampaignAndPlayer()`, `CampaignRepository::findOneBy(['inviteCode' => …])`.
- Produces:
  - `GET /api/shared_campaigns`, `GET /api/shared_campaigns/{id}` (provider `SharedCampaignProvider`).
  - `POST /api/shared_campaigns/join` body `{ "code": "..." }` (processor `JoinCampaignProcessor`) → `SharedCampaign`.
  - DTO `SharedCampaign { int $id; string $name; string $gameMaster; SharedSession[] $sessions }`.
  - `SharedCampaignFactory::fromCampaign(Campaign): SharedCampaign` — mapping partagé (source unique), injecté dans le provider ET le processor.

- [ ] **Step 1 : Écrire les tests qui échouent**

`backend/tests/Api/SharedCampaignTest.php` :
```php
<?php

namespace App\Tests\Api;

use App\Entity\CampaignMembership;
use App\Entity\Session;

/**
 * Vue joueur : rejoindre par code et lire les résumés — sans fuite des secrets MJ.
 */
final class SharedCampaignTest extends ApiSecurityTestCase
{
    private function joinAsMember(\App\Entity\Campaign $campaign, \App\Entity\User $player): void
    {
        $membership = new CampaignMembership();
        $membership->setCampaign($campaign);
        $membership->setPlayer($player);
        $this->em->persist($membership);
        $this->em->flush();
    }

    private function addSession(\App\Entity\Campaign $campaign, string $title, string $summary): void
    {
        $session = new Session();
        $session->setTitle($title);
        $session->setDate(new \DateTime('2026-06-01'));
        $session->setSummary($summary);
        $session->setCampaign($campaign);
        $this->em->persist($session);
        $this->em->flush();
    }

    public function testJoinWithValidCodeCreatesMembership(): void
    {
        $mj = $this->createUser('mj@example.com');
        $mj->setPseudo('Le Meneur');
        $campaign = $this->createCampaign($mj, 'Osgild');
        $campaign->setInviteCode('JOIN1234');
        $this->em->flush();

        $joueur = $this->createUser('joueur@example.com');
        $response = $this->client->request('POST', '/api/shared_campaigns/join', [
            'headers' => $this->authHeaders($joueur),
            'json' => ['code' => 'JOIN1234'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['name' => 'Osgild', 'gameMaster' => 'Le Meneur']);
    }

    public function testJoinWithInvalidCodeIs404(): void
    {
        $joueur = $this->createUser('joueur@example.com');
        $this->client->request('POST', '/api/shared_campaigns/join', [
            'headers' => $this->authHeaders($joueur),
            'json' => ['code' => 'NOPE0000'],
        ]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCannotJoinOwnCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj);
        $campaign->setInviteCode('OWN12345');
        $this->em->flush();

        $this->client->request('POST', '/api/shared_campaigns/join', [
            'headers' => $this->authHeaders($mj),
            'json' => ['code' => 'OWN12345'],
        ]);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testJoinIsIdempotent(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj);
        $campaign->setInviteCode('IDEM1234');
        $this->em->flush();
        $joueur = $this->createUser('joueur@example.com');

        $payload = ['headers' => $this->authHeaders($joueur), 'json' => ['code' => 'IDEM1234']];
        $this->client->request('POST', '/api/shared_campaigns/join', $payload);
        $this->client->request('POST', '/api/shared_campaigns/join', $payload);

        $count = $this->em->getRepository(CampaignMembership::class)->count(['campaign' => $campaign, 'player' => $joueur]);
        $this->assertSame(1, $count);
    }

    public function testMemberReadsSummariesOnly(): void
    {
        $mj = $this->createUser('mj@example.com');
        $mj->setPseudo('Le Meneur');
        $campaign = $this->createCampaign($mj, 'Osgild');
        $campaign->setNotes('SECRET: le majordome est coupable');
        $this->em->flush();
        $this->addSession($campaign, 'Séance 1', 'Les héros arrivent à Monastir.');
        $joueur = $this->createUser('joueur@example.com');
        $this->joinAsMember($campaign, $joueur);

        $response = $this->client->request('GET', '/api/shared_campaigns', ['headers' => $this->authHeaders($joueur)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Les héros arrivent à Monastir.', $body);
        $this->assertStringNotContainsString('majordome', $body); // notes MJ jamais exposées
    }

    public function testNonMemberCannotReadSharedCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj);
        $etranger = $this->createUser('etranger@example.com');

        $this->client->request('GET', '/api/shared_campaigns/'.$campaign->getId(), ['headers' => $this->authHeaders($etranger)]);
        $this->assertResponseStatusCodeSame(404);
    }
}
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T backend bin/phpunit --filter SharedCampaignTest`
Expected: FAIL (ressource inconnue).

- [ ] **Step 3 : Créer les DTO**

`backend/src/ApiResource/SharedSession.php` :
```php
<?php

namespace App\ApiResource;

use Symfony\Component\Serializer\Annotation\Groups;

/** Résumé d'une séance, tel que vu par un joueur. */
final class SharedSession
{
    #[Groups(['shared_campaign:read'])]
    public ?int $id = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $title = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $date = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $summary = null;
}
```

`backend/src/ApiResource/JoinCampaignInput.php` :
```php
<?php

namespace App\ApiResource;

/** Corps de POST /shared_campaigns/join. */
final class JoinCampaignInput
{
    public ?string $code = null;
}
```

`backend/src/ApiResource/SharedCampaign.php` :
```php
<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\State\JoinCampaignProcessor;
use App\State\SharedCampaignProvider;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Vue en lecture seule d'une campagne pour un joueur membre : nom + résumés.
 * Aucune donnée secrète (notes, indices, quêtes) n'existe dans ce modèle.
 */
#[ApiResource(
    shortName: 'SharedCampaign',
    operations: [
        new GetCollection(
            uriTemplate: '/shared_campaigns',
            security: "is_granted('ROLE_USER')",
            provider: SharedCampaignProvider::class,
        ),
        new Get(
            uriTemplate: '/shared_campaigns/{id}',
            security: "is_granted('ROLE_USER')",
            provider: SharedCampaignProvider::class,
        ),
        new Post(
            uriTemplate: '/shared_campaigns/join',
            security: "is_granted('ROLE_USER')",
            input: JoinCampaignInput::class,
            processor: JoinCampaignProcessor::class,
            read: false,
        ),
    ],
    normalizationContext: ['groups' => ['shared_campaign:read']],
)]
final class SharedCampaign
{
    #[Groups(['shared_campaign:read'])]
    public ?int $id = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $name = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $gameMaster = null;

    /** @var SharedSession[] */
    #[Groups(['shared_campaign:read'])]
    public array $sessions = [];
}
```

- [ ] **Step 4 : Créer le mapper partagé `SharedCampaignFactory`**

`backend/src/Factory/SharedCampaignFactory.php` — **source unique** du mapping, réutilisée par le provider et le processor :
```php
<?php

namespace App\Factory;

use App\ApiResource\SharedCampaign;
use App\ApiResource\SharedSession;
use App\Entity\Campaign;
use App\Entity\Session;

/**
 * Convertit une Campaign en vue joueur (SharedCampaign) : nom + résumés uniquement.
 * Aucune donnée secrète (notes, indices, quêtes) n'est mappée.
 */
final class SharedCampaignFactory
{
    public function fromCampaign(Campaign $campaign): SharedCampaign
    {
        $dto = new SharedCampaign();
        $dto->id = $campaign->getId();
        $dto->name = $campaign->getName();
        $dto->gameMaster = $campaign->getOwner()?->getPseudo();
        $dto->sessions = $campaign->getSessions()
            ->map(fn (Session $s) => $this->sessionDto($s))
            ->toArray();

        return $dto;
    }

    private function sessionDto(Session $s): SharedSession
    {
        $dto = new SharedSession();
        $dto->id = $s->getId();
        $dto->title = $s->getTitle();
        $dto->date = $s->getDate()?->format('Y-m-d');
        $dto->summary = $s->getSummary();

        return $dto;
    }
}
```

- [ ] **Step 5 : Créer le provider (lecture)**

`backend/src/State/SharedCampaignProvider.php` :
```php
<?php

namespace App\State;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Campaign;
use App\Factory\SharedCampaignFactory;
use App\Repository\CampaignMembershipRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Alimente la vue joueur (SharedCampaign) à partir des campagnes où l'utilisateur
 * courant est membre. Lit les entités au repository, hors du scope propriétaire.
 */
final readonly class SharedCampaignProvider implements ProviderInterface
{
    public function __construct(
        private Security $security,
        private CampaignMembershipRepository $memberships,
        private SharedCampaignFactory $factory,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $user = $this->security->getUser();
        if (null === $user) {
            return $operation instanceof CollectionOperationInterface ? [] : null;
        }

        if ($operation instanceof CollectionOperationInterface) {
            return array_map(
                fn (Campaign $c) => $this->factory->fromCampaign($c),
                $this->memberships->findCampaignsForPlayer($user),
            );
        }

        $id = $uriVariables['id'] ?? null;
        foreach ($this->memberships->findCampaignsForPlayer($user) as $campaign) {
            if ($campaign->getId() === (int) $id) {
                return $this->factory->fromCampaign($campaign);
            }
        }

        return null; // non-membre ou inconnu -> 404
    }
}
```

- [ ] **Step 6 : Créer le processor de join**

`backend/src/State/JoinCampaignProcessor.php` :
```php
<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\ApiResource\JoinCampaignInput;
use App\ApiResource\SharedCampaign;
use App\Entity\CampaignMembership;
use App\Factory\SharedCampaignFactory;
use App\Repository\CampaignMembershipRepository;
use App\Repository\CampaignRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Rejoindre une campagne par code d'invitation. Idempotent.
 *
 * @implements ProcessorInterface<JoinCampaignInput, SharedCampaign>
 */
final readonly class JoinCampaignProcessor implements ProcessorInterface
{
    public function __construct(
        private Security $security,
        private CampaignRepository $campaigns,
        private CampaignMembershipRepository $memberships,
        private EntityManagerInterface $em,
        private SharedCampaignFactory $factory,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): SharedCampaign
    {
        $code = trim((string) ($data->code ?? ''));
        $campaign = '' === $code ? null : $this->campaigns->findOneBy(['inviteCode' => $code]);
        if (null === $campaign) {
            throw new NotFoundHttpException('Code d\'invitation invalide.');
        }

        $user = $this->security->getUser();
        if ($campaign->getOwner()?->getId() === $user->getId()) {
            throw new BadRequestHttpException('Vous êtes déjà le MJ de cette campagne.');
        }

        if (null === $this->memberships->findOneByCampaignAndPlayer($campaign, $user)) {
            $membership = new CampaignMembership();
            $membership->setCampaign($campaign);
            $membership->setPlayer($user);
            $this->em->persist($membership);
            $this->em->flush();
        }

        return $this->factory->fromCampaign($campaign);
    }
}
```

- [ ] **Step 7 : Lancer, vérifier le succès**

Run: `docker compose exec -T backend bin/phpunit --filter SharedCampaignTest`
Expected: PASS (6 tests).

- [ ] **Step 8 : Commit**

```bash
git add backend/src/ApiResource/ backend/src/Factory/SharedCampaignFactory.php backend/src/State/SharedCampaignProvider.php backend/src/State/JoinCampaignProcessor.php backend/tests/Api/SharedCampaignTest.php
git commit -m "feat(sharing): ressource SharedCampaign (lecture résumés) + rejoindre par code"
```

---

## Task 5 : Lister/quitter les memberships + scope Doctrine

**Files:**
- Modify: `backend/src/Doctrine/CurrentUserExtension.php`
- Test: `backend/tests/Api/CampaignMembershipTest.php`

**Interfaces:**
- Consumes: entité `CampaignMembership` (Task 2) et ses opérations `GetCollection`/`Get`/`Delete`.
- Produces: `GET /api/campaign_memberships` scopé (membre ou MJ) ; `DELETE /api/campaign_memberships/{id}`.

- [ ] **Step 1 : Écrire les tests qui échouent**

`backend/tests/Api/CampaignMembershipTest.php` :
```php
<?php

namespace App\Tests\Api;

use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\User;

/**
 * Visibilité et révocation des adhésions.
 */
final class CampaignMembershipTest extends ApiSecurityTestCase
{
    private function member(Campaign $campaign, User $player): CampaignMembership
    {
        $m = new CampaignMembership();
        $m->setCampaign($campaign);
        $m->setPlayer($player);
        $this->em->persist($m);
        $this->em->flush();

        return $m;
    }

    public function testOwnerSeesMembersOfOwnCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $joueur->setPseudo('Gimli');
        $this->em->flush();
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);

        $response = $this->client->request('GET', '/api/campaign_memberships', ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertStringContainsString('Gimli', $response->getContent());
    }

    public function testPlayerSeesOnlyOwnMemberships(): void
    {
        $mj = $this->createUser('mj@example.com');
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $alice);
        $this->member($campaign, $bob);

        $response = $this->client->request('GET', '/api/campaign_memberships', ['headers' => $this->authHeaders($alice)]);
        $data = $response->toArray();
        $this->assertCount(1, $data['hydra:member'] ?? $data['member']);
    }

    public function testPlayerCanLeave(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $m = $this->member($campaign, $joueur);

        $this->client->request('DELETE', '/api/campaign_memberships/'.$m->getId(), ['headers' => $this->authHeaders($joueur)]);
        $this->assertResponseStatusCodeSame(204);
    }

    public function testOwnerCanKick(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $m = $this->member($campaign, $joueur);

        $this->client->request('DELETE', '/api/campaign_memberships/'.$m->getId(), ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(204);
    }

    public function testStrangerCannotSeeMembership(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $etranger = $this->createUser('etranger@example.com');
        $campaign = $this->createCampaign($mj);
        $m = $this->member($campaign, $joueur);

        $this->client->request('GET', '/api/campaign_memberships/'.$m->getId(), ['headers' => $this->authHeaders($etranger)]);
        $this->assertResponseStatusCodeSame(404);
    }
}
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T backend bin/phpunit --filter CampaignMembershipTest`
Expected: FAIL (memberships non scopés : le joueur voit tout / l'étranger obtient 200).

- [ ] **Step 3 : Étendre `CurrentUserExtension`**

Réécrire `addWhere()` dans `backend/src/Doctrine/CurrentUserExtension.php` (ajouter l'import `use App\Entity\CampaignMembership;` en haut) :
```php
    private function addWhere(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if (
            Campaign::class !== $resourceClass &&
            Character::class !== $resourceClass &&
            Quest::class !== $resourceClass &&
            Clue::class !== $resourceClass &&
            Session::class !== $resourceClass &&
            CampaignMembership::class !== $resourceClass
        ) {
            return;
        }

        $user = $this->security->getUser();
        if (null === $user) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];

        if (Campaign::class === $resourceClass) {
            // Strictement propriétaire : les joueurs passent par SharedCampaign.
            $queryBuilder->andWhere(sprintf('%s.owner = :current_user', $rootAlias));
        } elseif (Character::class === $resourceClass) {
            // Propriétaire de la fiche OU MJ de la campagne à laquelle elle est rattachée.
            $queryBuilder
                ->leftJoin(sprintf('%s.campaign', $rootAlias), 'char_camp')
                ->andWhere(sprintf('%s.owner = :current_user OR char_camp.owner = :current_user', $rootAlias));
        } elseif (CampaignMembership::class === $resourceClass) {
            // Le joueur voit ses adhésions ; le MJ voit les membres de ses campagnes.
            $queryBuilder
                ->leftJoin(sprintf('%s.campaign', $rootAlias), 'ms_camp')
                ->andWhere(sprintf('%s.player = :current_user OR ms_camp.owner = :current_user', $rootAlias));
        } else {
            // Quest, Clue, Session : filtrés par le propriétaire de leur campagne.
            $queryBuilder
                ->join(sprintf('%s.campaign', $rootAlias), 'c')
                ->andWhere('c.owner = :current_user');
        }

        $queryBuilder->setParameter('current_user', $user);
    }
```

- [ ] **Step 4 : Lancer, vérifier le succès**

Run: `docker compose exec -T backend bin/phpunit --filter CampaignMembershipTest`
Expected: PASS (5 tests).

- [ ] **Step 5 : Non-régression du scope existant**

Run: `docker compose exec -T backend bin/phpunit --filter CharacterSecurityTest`
Expected: PASS (le scope owner fonctionne toujours — alice/bob sans campagne restent isolés).

- [ ] **Step 6 : Commit**

```bash
git add backend/src/Doctrine/CurrentUserExtension.php backend/tests/Api/CampaignMembershipTest.php
git commit -m "feat(sharing): scope Doctrine des memberships + fiches visibles par le MJ"
```

---

## Task 6 : Partage & édition des fiches par le MJ

**Files:**
- Modify: `backend/src/Entity/Character.php` (expressions security), `backend/src/State/CharacterStateProcessor.php` (validation rattachement)
- Test: `backend/tests/Api/CharacterSharingTest.php`

**Interfaces:**
- Consumes: `CampaignMembershipRepository::findOneByCampaignAndPlayer()`, scope Character (Task 5).
- Produces: `Character` Get/Put/Patch autorisés au MJ de la campagne ; rattachement à une campagne validé (membre ou MJ) ; Delete inchangé (propriétaire).

- [ ] **Step 1 : Écrire les tests qui échouent**

`backend/tests/Api/CharacterSharingTest.php` :
```php
<?php

namespace App\Tests\Api;

use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\Character;
use App\Entity\User;

/**
 * Fiches partagées : le MJ lit et édite les fiches de ses membres, mais ne les
 * supprime pas ; un joueur ne rattache une fiche qu'à une campagne qu'il a rejointe.
 */
final class CharacterSharingTest extends ApiSecurityTestCase
{
    private function member(Campaign $campaign, User $player): void
    {
        $m = new CampaignMembership();
        $m->setCampaign($campaign);
        $m->setPlayer($player);
        $this->em->persist($m);
        $this->em->flush();
    }

    private function characterInCampaign(User $owner, Campaign $campaign): Character
    {
        $c = new Character();
        $c->setName('Hero');
        $c->setLevel(1);
        $c->setOwner($owner);
        $c->setCampaign($campaign);
        $this->em->persist($c);
        $this->em->flush();

        return $c;
    }

    public function testGmCanReadMemberCharacter(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);
        $char = $this->characterInCampaign($joueur, $campaign);

        $this->client->request('GET', '/api/characters/'.$char->getId(), ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testGmCanEditMemberCharacter(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);
        $char = $this->characterInCampaign($joueur, $campaign);

        $this->client->request('PATCH', '/api/characters/'.$char->getId(), [
            'headers' => $this->authHeaders($mj) + ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['level' => 3],
        ]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains(['level' => 3]);
    }

    public function testGmCannotDeleteMemberCharacter(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);
        $char = $this->characterInCampaign($joueur, $campaign);

        $this->client->request('DELETE', '/api/characters/'.$char->getId(), ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(403); // visible mais suppression réservée au propriétaire
    }

    public function testPlayerCanAttachToJoinedCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);

        $response = $this->client->request('POST', '/api/characters', [
            'headers' => $this->authHeaders($joueur),
            'json' => ['name' => 'Legolas', 'level' => 1, 'campaign' => '/api/campaigns/'.$campaign->getId()],
        ]);
        $this->assertResponseStatusCodeSame(201);
    }

    public function testPlayerCannotAttachToNonJoinedCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com'); // n'a PAS rejoint
        $campaign = $this->createCampaign($mj);

        $this->client->request('POST', '/api/characters', [
            'headers' => $this->authHeaders($joueur),
            'json' => ['name' => 'Intrus', 'level' => 1, 'campaign' => '/api/campaigns/'.$campaign->getId()],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }
}
```

- [ ] **Step 2 : Lancer, vérifier l'échec**

Run: `docker compose exec -T backend bin/phpunit --filter CharacterSharingTest`
Expected: FAIL (MJ obtient 404 en lecture ; rattachement non validé).

- [ ] **Step 3 : Élargir la sécurité de `Character`**

Dans `backend/src/Entity/Character.php`, remplacer les expressions des opérations `Get`, `Put`, `Patch` (garder `Delete` inchangé) :
```php
        new Get(security: "is_granted('ROLE_USER') and (object.getOwner() == user or (object.getCampaign() != null and object.getCampaign().getOwner() == user))"),
        new Put(security: "is_granted('ROLE_USER') and (object.getOwner() == user or (object.getCampaign() != null and object.getCampaign().getOwner() == user))", processor: CharacterStateProcessor::class),
        new Patch(security: "is_granted('ROLE_USER') and (object.getOwner() == user or (object.getCampaign() != null and object.getCampaign().getOwner() == user))", processor: CharacterStateProcessor::class),
```

- [ ] **Step 4 : Valider le rattachement dans `CharacterStateProcessor`**

Réécrire `backend/src/State/CharacterStateProcessor.php` :
```php
<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Character;
use App\Repository\CampaignMembershipRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final readonly class CharacterStateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
        private CampaignMembershipRepository $memberships,
    ) {
    }

    /**
     * @param Character $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $user = $this->security->getUser();

        if ($data instanceof Character && null === $data->getOwner()) {
            if ($user) {
                $data->setOwner($user);
            }
        }

        // On ne peut rattacher une fiche qu'à une campagne dont on est MJ ou membre.
        $campaign = $data->getCampaign();
        if (null !== $campaign && null !== $user) {
            $isOwner = $campaign->getOwner()?->getId() === $user->getId();
            $isMember = null !== $this->memberships->findOneByCampaignAndPlayer($campaign, $user);
            if (!$isOwner && !$isMember) {
                throw new AccessDeniedHttpException('Vous ne pouvez rattacher une fiche qu\'à une campagne que vous avez rejointe.');
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
```

- [ ] **Step 5 : Lancer, vérifier le succès**

Run: `docker compose exec -T backend bin/phpunit --filter CharacterSharingTest`
Expected: PASS (5 tests).

- [ ] **Step 6 : Suite backend complète (non-régression)**

Run: `docker compose exec -T backend bin/phpunit`
Expected: PASS (toute la suite, ~50+ tests).

- [ ] **Step 7 : Commit**

```bash
git add backend/src/Entity/Character.php backend/src/State/CharacterStateProcessor.php backend/tests/Api/CharacterSharingTest.php
git commit -m "feat(character): lecture/édition MJ des fiches membres + validation du rattachement"
```

---

## Task 7 : Frontend — pseudo à l'inscription

**Files:**
- Modify: `app/src/services/AuthService.ts`, `app/src/pages/RegisterPage.tsx`

**Interfaces:**
- Consumes: `POST /api/users` attend désormais `{ email, password, pseudo }`.
- Produces: `AuthService.register(email, password, pseudo)`.

- [ ] **Step 1 : Étendre `AuthService.register`**

Dans `app/src/services/AuthService.ts`, modifier la signature et l'appel :
```ts
    async register(email: string, password: string, pseudo: string): Promise<void> {
        // API Platform POST to /users
        await ApiService.post('users', { email, password, pseudo });
        await this.login(email, password);
    }
```

- [ ] **Step 2 : Ajouter le champ pseudo à `RegisterPage`**

Dans `app/src/pages/RegisterPage.tsx` : ajouter l'état `const [pseudo, setPseudo] = useState('');`, un `<input>` requis pour le pseudo (calqué sur le champ email existant, `type="text"`, `value={pseudo}` / `onChange`), et passer `pseudo` à l'appel : `await AuthService.register(email, password, pseudo);`.

- [ ] **Step 3 : Type-check + lint**

Run: `cd app && npm run build && npm run lint`
Expected: build OK ; pas de **nouvelle** erreur lint (baseline connue d'erreurs `no-explicit-any`).

- [ ] **Step 4 : Commit**

```bash
git add app/src/services/AuthService.ts app/src/pages/RegisterPage.tsx
git commit -m "feat(app): pseudo obligatoire à l'inscription"
```

---

## Task 8 : Frontend — service de partage

**Files:**
- Create: `app/src/services/sharingService.ts`

**Interfaces:**
- Consumes: `ApiService.get/post/delete`, endpoints des Tasks 3–5.
- Produces:
  - `joinCampaign(code: string): Promise<SharedCampaign>`
  - `getSharedCampaigns(): Promise<SharedCampaign[]>`
  - `regenerateInvite(campaignId: number): Promise<{ inviteCode: string }>`
  - `getMemberships(): Promise<Membership[]>`
  - `deleteMembership(id: number): Promise<void>`
  - types `SharedCampaign`, `SharedSession`, `Membership`.

- [ ] **Step 1 : Créer le service**

`app/src/services/sharingService.ts` :
```ts
import { ApiService } from './api';

export interface SharedSession {
    id: number;
    title: string;
    date: string | null;
    summary: string | null;
}

export interface SharedCampaign {
    id: number;
    name: string;
    gameMaster: string;
    sessions: SharedSession[];
}

export interface Membership {
    id: number;
    campaign: string;      // IRI
    player: { id: number; pseudo: string } | string;
    joinedAt: string;
}

export const SharingService = {
    joinCampaign(code: string): Promise<SharedCampaign> {
        return ApiService.post<SharedCampaign>('shared_campaigns/join', { code });
    },

    getSharedCampaigns(): Promise<SharedCampaign[]> {
        return ApiService.getAll<SharedCampaign>('shared_campaigns');
    },

    regenerateInvite(campaignId: number): Promise<{ inviteCode: string }> {
        return ApiService.post<{ inviteCode: string }>(`campaigns/${campaignId}/regenerate_invite`, {});
    },

    getMemberships(): Promise<Membership[]> {
        return ApiService.getAll<Membership>('campaign_memberships');
    },

    deleteMembership(id: number): Promise<void> {
        return ApiService.delete('campaign_memberships', id);
    },
};
```
> Vérifier la signature exacte de `ApiService.post/getAll/delete` dans `app/src/services/api.ts` et ajuster si besoin (ex. `post(resource, data)` — le resource ne prend pas de `/api` préfixe, déjà géré par `API_BASE_URL`).

- [ ] **Step 2 : Type-check**

Run: `cd app && npm run build`
Expected: build OK.

- [ ] **Step 3 : Commit**

```bash
git add app/src/services/sharingService.ts
git commit -m "feat(app): sharingService (join, résumés, invite, memberships)"
```

---

## Task 9 : Frontend — écran MJ (invite + membres)

**Files:**
- Modify: `app/src/pages/CampaignDetail.tsx`

**Interfaces:**
- Consumes: `SharingService.regenerateInvite`, `getMemberships`, `deleteMembership` ; le `inviteCode` est présent sur l'objet campagne (`campaign:read`).

- [ ] **Step 1 : Ajouter le bloc « Inviter » + liste des membres**

Dans `app/src/pages/CampaignDetail.tsx` (suivre les conventions Tailwind/JSX existantes du fichier) :
- Afficher `campaign.inviteCode` avec un bouton **Copier** (`navigator.clipboard.writeText`) et un bouton **Régénérer** → `SharingService.regenerateInvite(campaign.id)` puis rafraîchir l'état local `inviteCode`.
- Charger les memberships de la campagne au `useEffect` (filtrer côté client sur `membership.campaign === '/api/campaigns/'+id`) et afficher la liste des pseudos joueurs, chacun avec un bouton **Exclure** → `SharingService.deleteMembership(m.id)` puis retirer de la liste.
- Pour chaque membre, lister ses fiches (celles de `campaign.characters` dont le `owner` n'est pas le MJ) avec un lien vers la fiche (route `CharacterSheet` existante) — le MJ peut l'ouvrir/éditer, autorisé par le backend (Task 6).

- [ ] **Step 2 : Vérification manuelle (stack up)**

Run: `docker compose up -d` puis dans l'app : créer une campagne (MJ), copier le code, se connecter avec un 2ᵉ compte, rejoindre, revenir côté MJ → le membre et sa fiche apparaissent ; régénérer le code invalide l'ancien.

- [ ] **Step 3 : Type-check + lint + commit**

```bash
cd app && npm run build && npm run lint
git add app/src/pages/CampaignDetail.tsx
git commit -m "feat(app): écran MJ — code d'invitation, membres et leurs fiches"
```

---

## Task 10 : Frontend — écran joueur (rejoindre + résumés)

**Files:**
- Modify: `app/src/pages/Campaign.tsx`

**Interfaces:**
- Consumes: `SharingService.joinCampaign`, `getSharedCampaigns`.

- [ ] **Step 1 : Ajouter « Rejoindre » + « Campagnes rejointes »**

Dans `app/src/pages/Campaign.tsx` :
- Un champ de saisie de code + bouton **Rejoindre** → `SharingService.joinCampaign(code)` ; sur succès, ajouter la `SharedCampaign` à la liste ; sur 404/400, afficher le message d'erreur renvoyé.
- Une section « Campagnes rejointes » alimentée par `getSharedCampaigns()` : pour chaque campagne, le nom, le `gameMaster` (pseudo), et la liste des séances (`title`, `date`, `summary`) en **lecture seule**.

- [ ] **Step 2 : Vérification manuelle**

Se connecter comme joueur, rejoindre via un code valide → la campagne et ses résumés s'affichent ; un code invalide affiche une erreur ; les notes/quêtes/indices du MJ n'apparaissent nulle part.

- [ ] **Step 3 : Type-check + lint + commit**

```bash
cd app && npm run build && npm run lint
git add app/src/pages/Campaign.tsx
git commit -m "feat(app): écran joueur — rejoindre par code et lire les résumés"
```

---

## Task 11 : Mise à jour de la roadmap

**Files:**
- Modify: `doc/etat_des_lieux/roadmap.md`

- [ ] **Step 1 : Cocher les items livrés**

Dans la Phase 2 « Partage asynchrone MJ ⇄ Joueurs », passer en `[x]` : « Partage des résumés de campagne aux joueurs », « Personnages créés par les joueurs, partagés au MJ » et « Notion de membres de campagne / partage inter-utilisateurs », avec une mention « (fait) ».

- [ ] **Step 2 : Commit**

```bash
git add doc/etat_des_lieux/roadmap.md
git commit -m "docs(roadmap): partage MJ ⇄ joueurs livré"
```

---

## Self-Review

- **Couverture spec** : `CampaignMembership` (T2) ✓ ; `inviteCode` + génération (T2) ✓ ; régénération/révocation (T3) ✓ ; `SharedCampaign` DTO+provider read-only + anti-fuite (T4, test `testMemberReadsSummariesOnly`) ✓ ; join valide/invalide/propre/idempotent (T4) ✓ ; memberships list/leave/kick + scope (T5) ✓ ; sécurité `Character` owner-ou-MJ + delete propriétaire + validation rattachement (T6) ✓ ; `CurrentUserExtension` Character/Membership (T5) ✓ ; `User.pseudo` + migration backfill (T1) ✓ ; frontend service + écrans MJ/joueur + inscription (T7–T10) ✓ ; roadmap (T11) ✓. `security.yaml` : aucun changement requis (confirmé dans la spec).
- **Placeholders** : aucun « TBD/TODO » ; chaque étape de code porte le code complet. Les fichiers de migration `VersionXXXX.php` sont générés par `doctrine:migrations:diff` (nom non déterministe par nature) — seuls les `addSql` de backfill à ajouter sont explicités.
- **Cohérence des types** : `InviteCodeGenerator::generate()` (T2) réutilisé en T2/T3 ; `CampaignMembershipRepository::findOneByCampaignAndPlayer()`/`findCampaignsForPlayer()` définis en T2, consommés en T4/T6 ; DTO `SharedCampaign`/`SharedSession` cohérents entre provider (T4) et front (T8) ; paramètre Doctrine `:current_user` conservé partout (T5).

## Execution Handoff

Voir le message de la session pour le choix du mode d'exécution.
