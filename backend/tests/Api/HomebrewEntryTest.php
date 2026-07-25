<?php

namespace App\Tests\Api;

use App\Entity\HomebrewEntry;
use App\Entity\User;

/**
 * Bibliothèque homebrew : owner-scopée en écriture, lecture « mienne OU publique ».
 */
final class HomebrewEntryTest extends ApiSecurityTestCase
{
    private function makeEntry(User $owner, string $name, string $visibility): HomebrewEntry
    {
        $e = new HomebrewEntry();
        $e->setOwner($owner);
        $e->setCategory('sort');
        $e->setName($name);
        $e->setDescription('...');
        $e->setVisibility($visibility);
        $e->setCreatedAt(new \DateTimeImmutable());
        $e->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($e);
        $this->em->flush();

        return $e;
    }

    public function testCreateSetsOwner(): void
    {
        $user = $this->createUser('mj@example.com');
        $user->setPseudo('Le Meneur');
        $this->em->flush();

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'sort', 'name' => 'Boule de givre', 'description' => '2d6 froid', 'visibility' => 'private'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['name' => 'Boule de givre', 'authorPseudo' => 'Le Meneur', 'visibility' => 'private']);
    }

    public function testCollectionReturnsMineAndPublicOnly(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->makeEntry($alice, 'Sort privé de Bob', 'private'); // en fait à alice
        $this->makeEntry($bob, 'Sort PUBLIC de Bob', 'public');
        $this->makeEntry($bob, 'Sort PRIVE de Bob', 'private');
        $this->makeEntry($alice, 'Mon sort à moi', 'private');

        $response = $this->client->request('GET', '/api/homebrew_entries', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Mon sort à moi', $body);        // la mienne (privée)
        $this->assertStringContainsString('Sort PUBLIC de Bob', $body);    // publique d'autrui
        $this->assertStringNotContainsString('Sort PRIVE de Bob', $body);  // privée d'autrui : jamais
    }

    public function testCannotEditOthersEntry(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'Sort de Bob', 'public');

        $this->client->request('PATCH', '/api/homebrew_entries/'.$entry->getId(), [
            'headers' => array_merge($this->authHeaders($alice), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['name' => 'Détourné'],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testCannotReadOthersPrivateEntry(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'Secret de Bob', 'private');

        $this->client->request('GET', '/api/homebrew_entries/'.$entry->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(404);
    }
}
