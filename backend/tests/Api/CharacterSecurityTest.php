<?php

namespace App\Tests\Api;

/**
 * Access control on the Character resource:
 *  - authentication required
 *  - the owner is assigned automatically on create (CharacterStateProcessor)
 *  - collections and items are scoped to the owner (CurrentUserExtension)
 */
final class CharacterSecurityTest extends ApiSecurityTestCase
{
    public function testListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/characters');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCreateAssignsCurrentUserAsOwner(): void
    {
        $user = $this->createUser('player@example.com');

        $response = $this->client->request('POST', '/api/characters', [
            'headers' => $this->authHeaders($user),
            'json' => ['name' => 'Aragorn', 'level' => 1],
        ]);

        $this->assertResponseStatusCodeSame(201);
        // owner cannot be set by the client (read-only group) and is forced to the
        // authenticated user by the state processor.
        $this->assertJsonContains(['owner' => '/api/users/'.$user->getId()]);
    }

    public function testOwnerCanReadOwnCharacter(): void
    {
        $user = $this->createUser('player@example.com');
        $character = $this->createCharacter($user);

        $this->client->request('GET', '/api/characters/'.$character->getId(), ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testNonOwnerCannotReadCharacter(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $character = $this->createCharacter($alice);

        // Scoped out of the query by CurrentUserExtension -> not found (404).
        $this->client->request('GET', '/api/characters/'.$character->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCollectionIsScopedToOwner(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->createCharacter($alice, 'Alice Hero');
        $this->createCharacter($bob, 'Bob Hero');

        $response = $this->client->request('GET', '/api/characters', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Alice Hero', $body);
        $this->assertStringNotContainsString('Bob Hero', $body);
    }

    public function testNonOwnerCannotDeleteCharacter(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $character = $this->createCharacter($alice);

        $this->client->request('DELETE', '/api/characters/'.$character->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }
}
