<?php

namespace App\Tests\Api;

/**
 * Access control on the Campaign resource:
 *  - authentication required
 *  - the owner is assigned automatically on create (CampaignStateProcessor)
 *  - collections and items are scoped to the owner (CurrentUserExtension)
 */
final class CampaignSecurityTest extends ApiSecurityTestCase
{
    public function testListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/campaigns');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCreateAssignsCurrentUserAsOwner(): void
    {
        $user = $this->createUser('player@example.com');

        $response = $this->client->request('POST', '/api/campaigns', [
            'headers' => $this->authHeaders($user),
            'json' => ['name' => 'The Lost Mine'],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['owner' => '/api/users/'.$user->getId()]);
    }

    public function testCreateSetsUpdatedAtTimestamp(): void
    {
        $user = $this->createUser('player@example.com');

        $response = $this->client->request('POST', '/api/campaigns', [
            'headers' => $this->authHeaders($user),
            'json' => ['name' => 'The Lost Mine'],
        ]);

        // CampaignStateProcessor stamps updatedAt on write.
        $this->assertResponseStatusCodeSame(201);
        $this->assertNotNull($response->toArray()['updatedAt'] ?? null);
    }

    public function testOwnerCanReadOwnCampaign(): void
    {
        $user = $this->createUser('player@example.com');
        $campaign = $this->createCampaign($user);

        $this->client->request('GET', '/api/campaigns/'.$campaign->getId(), ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testNonOwnerCannotReadCampaign(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $campaign = $this->createCampaign($alice);

        // Scoped out of the query by CurrentUserExtension -> not found (404).
        $this->client->request('GET', '/api/campaigns/'.$campaign->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCollectionIsScopedToOwner(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->createCampaign($alice, 'Alice Campaign');
        $this->createCampaign($bob, 'Bob Campaign');

        $response = $this->client->request('GET', '/api/campaigns', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Alice Campaign', $body);
        $this->assertStringNotContainsString('Bob Campaign', $body);
    }

    public function testDeletingCampaignDetachesPlayerCharactersInsteadOfBlockingOrDeletingThem(): void
    {
        // Le cas courant du produit : un joueur a rattaché sa fiche à la campagne du MJ.
        // Avant Version20260925090000, la FK sans ON DELETE valait RESTRICT et la
        // suppression échouait ; elle ne doit surtout pas emporter la fiche du joueur.
        $mj = $this->createUser('mj@example.com');
        $player = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $character = $this->createCharacter($player, 'Héros du joueur');
        $character->setCampaign($campaign);
        $this->em->flush();
        $characterId = $character->getId();

        $this->client->request('DELETE', '/api/campaigns/'.$campaign->getId(), ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(204);

        $this->em->clear();
        $survivant = $this->em->find(\App\Entity\Character::class, $characterId);
        $this->assertNotNull($survivant, 'La fiche du joueur doit survivre à la campagne.');
        $this->assertNull($survivant->getCampaign());
        $this->assertSame($player->getId(), $survivant->getOwner()->getId());
    }
}
