<?php

namespace App\Tests\Api;

use App\Entity\CustomCreature;
use App\Entity\User;

/**
 * Monstres maison : owner-scopés en écriture, lecture « mien OU public »
 * (bibliothèque communautaire, aligné sur HomebrewEntry).
 */
final class CustomCreatureSharingTest extends ApiSecurityTestCase
{
    private function makeCreature(User $owner, string $name, string $visibility): CustomCreature
    {
        $c = new CustomCreature();
        $c->setOwner($owner);
        $c->setName($name);
        $c->setNc(1);
        $c->setHp(10);
        $c->setDef(12);
        $c->setInit(10);
        $c->setVisibility($visibility);
        $this->em->persist($c);
        $this->em->flush();

        return $c;
    }

    public function testCreateDefaultsToPrivateAndSetsOwner(): void
    {
        $user = $this->createUser('mj@example.com');
        $user->setPseudo('Le Meneur');
        $this->em->flush();

        $this->client->request('POST', '/api/custom_creatures', [
            'headers' => $this->authHeaders($user),
            'json' => ['name' => 'Gobelin sournois', 'nc' => 1, 'hp' => 8, 'def' => 13, 'init' => 12],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['name' => 'Gobelin sournois', 'authorPseudo' => 'Le Meneur', 'visibility' => 'private']);
    }

    public function testCollectionReturnsMineAndPublicOnly(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->makeCreature($bob, 'Dragon PUBLIC de Bob', 'public');
        $this->makeCreature($bob, 'Dragon PRIVE de Bob', 'private');
        $this->makeCreature($alice, 'Mon golem à moi', 'private');

        $response = $this->client->request('GET', '/api/custom_creatures', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Mon golem à moi', $body);        // la mienne (privée)
        $this->assertStringContainsString('Dragon PUBLIC de Bob', $body);   // publique d'autrui
        $this->assertStringNotContainsString('Dragon PRIVE de Bob', $body); // privée d'autrui : jamais
    }

    public function testCanReadOthersPublicCreature(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $creature = $this->makeCreature($bob, 'Hydre partagée', 'public');

        $this->client->request('GET', '/api/custom_creatures/'.$creature->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testCannotReadOthersPrivateCreature(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $creature = $this->makeCreature($bob, 'Secret de Bob', 'private');

        $this->client->request('GET', '/api/custom_creatures/'.$creature->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCannotEditOthersPublicCreature(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $creature = $this->makeCreature($bob, 'Dragon de Bob', 'public');

        $this->client->request('PATCH', '/api/custom_creatures/'.$creature->getId(), [
            'headers' => array_merge($this->authHeaders($alice), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['name' => 'Détourné'],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }
}
