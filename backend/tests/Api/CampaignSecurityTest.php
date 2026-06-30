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
}
