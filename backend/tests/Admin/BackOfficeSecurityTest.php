<?php

namespace App\Tests\Admin;

use App\Entity\CreatureFamily;
use App\Entity\Family;
use App\Entity\Profile;
use App\Entity\Race;
use App\Entity\Voie;
use App\Tests\Api\ApiSecurityTestCase;

/**
 * The EasyAdmin back-office is the only server-rendered part of the project, and it
 * exposes the whole compendium in write mode plus the list of every account's e-mail
 * address. It once answered 200 to anonymous visitors because its firewall declared no
 * authenticator and no access rule covered `^/admin`. These tests are that regression's
 * guard: the pages are reached over HTTP basic auth (see `security.yaml`).
 */
final class BackOfficeSecurityTest extends ApiSecurityTestCase
{
    public function testAnonymousIsChallengedOnTheDashboard(): void
    {
        $this->client->request('GET', '/admin');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testAnonymousCannotListUserAccounts(): void
    {
        $this->client->request('GET', '/admin/user');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testRegularUserIsDeniedTheBackOffice(): void
    {
        $this->createUser('player@example.com');

        $this->client->request('GET', '/admin/user', [
            'auth_basic' => ['player@example.com', 'password'],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdminReachesTheUserList(): void
    {
        $this->createUser('admin@example.com', ['ROLE_ADMIN']);

        $this->client->request('GET', '/admin/user', [
            'auth_basic' => ['admin@example.com', 'password'],
        ]);
        $this->assertResponseIsSuccessful();
    }

    /**
     * Every CRUD form renders a drop-down for each association, and EasyAdmin builds its
     * labels by casting the linked entity to a string. Without `__toString()` these pages
     * answered 500 — one per entity that another one points to.
     */
    public function testAdminOpensTheCreationFormOfEveryCrudSection(): void
    {
        $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        // The drop-downs must have something to render: on an empty database no entity is
        // ever cast to a string, and the very failure this test guards against disappears.
        $this->seedOneRowPerAssociationTarget();

        foreach (['race', 'voie', 'capability', 'creature', 'creature-family', 'profile', 'family', 'equipment'] as $section) {
            $this->client->request('GET', '/admin/'.$section.'/new', [
                'auth_basic' => ['admin@example.com', 'password'],
            ]);
            $this->assertResponseIsSuccessful(sprintf('The "%s" creation form must render.', $section));
        }
    }

    private function seedOneRowPerAssociationTarget(): void
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
            ->setName('Voie du test')
            ->setDescription('Voie de test.')
            ->setCategory('profil')
            ->setMaxRank(5);
        $voie->setProfile($profile);

        $creatureFamily = (new CreatureFamily())->setName('Bêtes');

        foreach ([$family, $profile, $race, $voie, $creatureFamily] as $entity) {
            $this->em->persist($entity);
        }
        $this->em->flush();
    }
}
