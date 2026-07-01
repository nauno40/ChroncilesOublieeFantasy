<?php

namespace App\Tests\Api;

/**
 * Access control on the Quest resource (a Campaign sub-resource):
 *  - authentication required (no public listing of private-campaign quests)
 *  - collections and items are scoped to the campaign owner (CurrentUserExtension
 *    + per-operation security on object.getCampaign().getOwner())
 */
final class QuestSecurityTest extends ApiSecurityTestCase
{
    public function testListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/quests');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCollectionIsScopedToOwner(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->createQuest($this->createCampaign($alice), 'Alice Quest');
        $this->createQuest($this->createCampaign($bob), 'Bob Quest');

        $response = $this->client->request('GET', '/api/quests', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Alice Quest', $body);
        $this->assertStringNotContainsString('Bob Quest', $body);
    }

    public function testOwnerCanReadOwnQuest(): void
    {
        $alice = $this->createUser('alice@example.com');
        $quest = $this->createQuest($this->createCampaign($alice));

        $this->client->request('GET', '/api/quests/'.$quest->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testNonOwnerCannotReadQuest(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $quest = $this->createQuest($this->createCampaign($alice));

        // Scoped out of the query by CurrentUserExtension -> not found (404).
        $this->client->request('GET', '/api/quests/'.$quest->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testNonOwnerCannotDeleteQuest(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $quest = $this->createQuest($this->createCampaign($alice));

        $this->client->request('DELETE', '/api/quests/'.$quest->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testOwnerCanDeleteOwnQuest(): void
    {
        $alice = $this->createUser('alice@example.com');
        $quest = $this->createQuest($this->createCampaign($alice));

        $this->client->request('DELETE', '/api/quests/'.$quest->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);
    }
}
