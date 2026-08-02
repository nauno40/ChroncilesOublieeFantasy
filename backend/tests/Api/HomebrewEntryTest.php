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

    public function testCreateWithStructuredData(): void
    {
        $user = $this->createUser('mj@example.com');
        $this->em->flush();

        $data = ['modifiers' => ['FOR' => 1, 'CON' => 1], 'speed' => '10 m', 'typicalNames' => 'Grum, Bhal'];
        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'race', 'name' => 'Peuple des Cimes', 'visibility' => 'private', 'data' => $data],
        ]);
        $this->assertResponseStatusCodeSame(201);
        // Le JSON structuré fait l'aller-retour intact.
        $this->assertJsonContains(['name' => 'Peuple des Cimes', 'data' => $data]);
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

    public function testCreateWithParentAttachesToVoieAndReadsBack(): void
    {
        $user = $this->createUser('mj@example.com');
        $voie = $this->makeEntry($user, 'Voie du Chasseur', 'private');

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => [
                'category' => 'capacite',
                'name' => 'Tir précis',
                'description' => '+2 en attaque à distance',
                'visibility' => 'private',
                'parent' => '/api/homebrew_entries/'.$voie->getId(),
            ],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['parent' => '/api/homebrew_entries/'.$voie->getId()]);

        $created = json_decode($this->client->getResponse()->getContent(), true);
        $this->client->request('GET', $created['@id'], ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains(['parent' => '/api/homebrew_entries/'.$voie->getId()]);
    }

    public function testCreateWithForeignParentIsRejected(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        // Publique pour que l'IRI soit résolvable par Bob : c'est bien le rattachement,
        // pas la simple lecture du parent, que la règle serveur doit refuser.
        $voie = $this->makeEntry($alice, "Voie d'Alice", 'public');

        $countBefore = (int) $this->em->createQuery('SELECT COUNT(e.id) FROM App\Entity\HomebrewEntry e')->getSingleScalarResult();

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($bob),
            'json' => [
                'category' => 'capacite',
                'name' => 'Capacité frauduleuse',
                'visibility' => 'private',
                'parent' => '/api/homebrew_entries/'.$voie->getId(),
            ],
        ]);
        $this->assertContains($this->client->getResponse()->getStatusCode(), [403, 422]);

        $countAfter = (int) $this->em->createQuery('SELECT COUNT(e.id) FROM App\Entity\HomebrewEntry e')->getSingleScalarResult();
        $this->assertSame($countBefore, $countAfter, 'Aucune entrée ne doit avoir été créée lors du rattachement frauduleux.');
    }

    public function testCreateInheritsParentVisibility(): void
    {
        $user = $this->createUser('mj@example.com');
        $voie = $this->makeEntry($user, 'Voie publique', 'public');

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => [
                'category' => 'capacite',
                'name' => 'Capacité envoyée en privé',
                'visibility' => 'private',
                'parent' => '/api/homebrew_entries/'.$voie->getId(),
            ],
        ]);
        $this->assertResponseStatusCodeSame(201);
        // La capacité hérite de la visibilité publique de sa voie parente, quoi qu'ait envoyé le client.
        $this->assertJsonContains(['visibility' => 'public']);
    }

    public function testCreateWithoutParentStillWorks(): void
    {
        $user = $this->createUser('mj@example.com');

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'sort', 'name' => 'Sort autonome', 'description' => '...', 'visibility' => 'private'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        // Champ omis (null) plutôt que rejeté : la création sans parent reste possible.
        $this->assertJsonContains(['name' => 'Sort autonome']);
        $body = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertArrayNotHasKey('parent', $body);
    }
}
