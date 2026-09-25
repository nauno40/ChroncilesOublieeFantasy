<?php

namespace App\Tests\Api;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use ApiPlatform\Symfony\Bundle\Test\Client;
use App\Entity\Campaign;
use App\Entity\Character;
use App\Entity\Quest;
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

    /** Le schéma est recréé une seule fois par processus PHPUnit, pas avant chaque test. */
    private static bool $schemaReady = false;

    private function resetSchema(): void
    {
        $connection = $this->em->getConnection();

        if (self::$schemaReady) {
            $this->emptyTables();

            return;
        }

        // Premier test du processus : Postgres-only project, wiping the public schema is the
        // cleanest reset and avoids "table does not exist" issues on the very first run.
        $connection->executeStatement('DROP SCHEMA public CASCADE');
        $connection->executeStatement('CREATE SCHEMA public');

        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        if (!empty($metadata)) {
            (new SchemaTool($this->em))->createSchema($metadata);
        }

        self::$schemaReady = true;
    }

    /**
     * Vide toutes les tables et remet les séquences à 1, comme un schéma neuf.
     *
     * Recréer ~30 tables avant CHAQUE test (DROP SCHEMA + createSchema) coûtait plus de dix
     * secondes par test — `tests/Api` dépassait vingt minutes. `TRUNCATE` seul restait à ~6 s
     * (opérations sur fichiers + fsync par table, sur le stockage Docker/WSL2) : mesuré à
     * 6 119 ms pour 32 tables, contre ~40 ms pour des `DELETE` en une transaction. Les
     * triggers de clés étrangères sont suspendus le temps de cette transaction
     * (`session_replication_role`, réservé aux superusers) pour ne pas avoir à ordonner
     * les suppressions ; sans ce droit, on retombe sur `TRUNCATE`, plus lent mais équivalent.
     */
    private function emptyTables(): void
    {
        $connection = $this->em->getConnection();
        $tables = $connection->fetchFirstColumn("SELECT quote_ident(tablename) FROM pg_tables WHERE schemaname = 'public'");
        if ([] === $tables) {
            return;
        }
        $sequences = $connection->fetchFirstColumn("SELECT quote_ident(sequencename) FROM pg_sequences WHERE schemaname = 'public'");

        try {
            $connection->beginTransaction();
            $connection->executeStatement('SET LOCAL session_replication_role = replica');
            foreach ($tables as $table) {
                $connection->executeStatement('DELETE FROM '.$table);
            }
            foreach ($sequences as $sequence) {
                $connection->executeStatement('ALTER SEQUENCE '.$sequence.' RESTART');
            }
            $connection->commit();
        } catch (\Throwable) {
            if ($connection->isTransactionActive()) {
                $connection->rollBack();
            }
            $connection->executeStatement('TRUNCATE '.implode(', ', $tables).' RESTART IDENTITY CASCADE');
        }
    }

    protected function createUser(string $email, array $roles = [], string $password = 'password', bool $verified = true): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setRoles($roles);
        $user->setVerified($verified);

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

    protected function createQuest(Campaign $campaign, string $title = 'Quest'): Quest
    {
        $quest = new Quest();
        $quest->setTitle($title);
        $quest->setCampaign($campaign);

        $this->em->persist($quest);
        $this->em->flush();

        return $quest;
    }
}
