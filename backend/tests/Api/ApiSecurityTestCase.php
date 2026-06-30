<?php

namespace App\Tests\Api;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use ApiPlatform\Symfony\Bundle\Test\Client;
use App\Entity\Campaign;
use App\Entity\Character;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Base class for API security tests.
 *
 * Resets the (PostgreSQL) test schema before each test and provides helpers to
 * seed users / campaigns / characters and to authenticate requests with a real
 * JWT minted by the Lexik token manager.
 */
abstract class ApiSecurityTestCase extends ApiTestCase
{
    protected Client $client;
    protected EntityManagerInterface $em;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
        $this->resetSchema();
    }

    private function resetSchema(): void
    {
        // Postgres-only project: wiping the public schema is the cleanest reset
        // and avoids "table does not exist" issues on the very first run.
        $connection = $this->em->getConnection();
        $connection->executeStatement('DROP SCHEMA public CASCADE');
        $connection->executeStatement('CREATE SCHEMA public');

        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        if (!empty($metadata)) {
            (new SchemaTool($this->em))->createSchema($metadata);
        }
    }

    protected function createUser(string $email, array $roles = [], string $password = 'password'): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setRoles($roles);

        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $user->setPassword($hasher->hashPassword($user, $password));

        $this->em->persist($user);
        $this->em->flush();

        return $user;
    }

    protected function tokenFor(User $user): string
    {
        return static::getContainer()->get('lexik_jwt_authentication.jwt_manager')->create($user);
    }

    /** @return array<string, string> */
    protected function authHeaders(User $user): array
    {
        return ['Authorization' => 'Bearer '.$this->tokenFor($user)];
    }

    protected function createCampaign(User $owner, string $name = 'Test Campaign'): Campaign
    {
        $campaign = new Campaign();
        $campaign->setName($name);
        $campaign->setOwner($owner);

        $this->em->persist($campaign);
        $this->em->flush();

        return $campaign;
    }

    protected function createCharacter(User $owner, string $name = 'Hero'): Character
    {
        $character = new Character();
        $character->setName($name);
        $character->setLevel(1);
        $character->setOwner($owner);

        $this->em->persist($character);
        $this->em->flush();

        return $character;
    }
}
