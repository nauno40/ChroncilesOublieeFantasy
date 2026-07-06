<?php

namespace App\Tests\Api;

use App\Entity\CustomCreature;
use App\Entity\User;

/**
 * Access control on the CustomCreature resource (MJ « house » monsters):
 *  - authentication required
 *  - the owner is assigned automatically on create (CustomCreatureStateProcessor)
 *  - collections and items are scoped to the owner (CurrentUserExtension)
 */
final class CustomCreatureSecurityTest extends ApiSecurityTestCase
{
    private function createCustomCreature(User $owner, string $name = 'Gobelin maison'): CustomCreature
    {
        $creature = new CustomCreature();
        $creature->setName($name);
        $creature->setNc(1);
        $creature->setHp(8);
        $creature->setDef(12);
        $creature->setInit(10);
        $creature->setOwner($owner);

        $this->em->persist($creature);
        $this->em->flush();

        return $creature;
    }

    public function testListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/custom_creatures');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCreateAssignsCurrentUserAsOwner(): void
    {
        $user = $this->createUser('mj@example.com');

        $this->client->request('POST', '/api/custom_creatures', [
            'headers' => $this->authHeaders($user),
            'json' => ['name' => 'Dragon maison', 'nc' => 10, 'hp' => 120, 'def' => 18, 'init' => 14],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['owner' => '/api/users/'.$user->getId()]);
    }

    public function testCreateIgnoresClientProvidedOwner(): void
    {
        $mj = $this->createUser('mj@example.com');
        $other = $this->createUser('other@example.com');

        // Even if a client tries to set the owner, the processor forces the current user.
        $this->client->request('POST', '/api/custom_creatures', [
            'headers' => $this->authHeaders($mj),
            'json' => [
                'name' => 'Owned monster',
                'nc' => 1, 'hp' => 5, 'def' => 10, 'init' => 8,
                'owner' => '/api/users/'.$other->getId(),
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['owner' => '/api/users/'.$mj->getId()]);
    }

    public function testOwnerCanReadOwnCustomCreature(): void
    {
        $mj = $this->createUser('mj@example.com');
        $creature = $this->createCustomCreature($mj);

        $this->client->request('GET', '/api/custom_creatures/'.$creature->getId(), ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testNonOwnerCannotReadCustomCreature(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $creature = $this->createCustomCreature($alice);

        // Scoped out of the query by CurrentUserExtension -> not found (404).
        $this->client->request('GET', '/api/custom_creatures/'.$creature->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testNonOwnerCannotDeleteCustomCreature(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $creature = $this->createCustomCreature($alice);

        $this->client->request('DELETE', '/api/custom_creatures/'.$creature->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCollectionIsScopedToOwner(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->createCustomCreature($alice, 'Alice Monster');
        $this->createCustomCreature($bob, 'Bob Monster');

        $response = $this->client->request('GET', '/api/custom_creatures', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Alice Monster', $body);
        $this->assertStringNotContainsString('Bob Monster', $body);
    }
}
