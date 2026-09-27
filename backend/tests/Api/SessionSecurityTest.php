<?php

namespace App\Tests\Api;

use App\Entity\Campaign;
use App\Entity\Session;

/**
 * Access control on the Session resource (a Campaign sub-resource) — same construction as
 * Quest/Clue/Encounter, sharing the same `campaign.owner` branch of CurrentUserExtension.
 * Mirrors QuestSecurityTest: authentication required, collection/item scoped to the
 * campaign owner, non-owner reads/deletes denied (404, scoped out before security runs).
 */
final class SessionSecurityTest extends ApiSecurityTestCase
{
    private function createSession(Campaign $campaign, string $title = 'Séance'): Session
    {
        $session = new Session();
        $session->setTitle($title);
        $session->setDate(new \DateTimeImmutable('2026-01-01'));
        $session->setCampaign($campaign);

        $this->em->persist($session);
        $this->em->flush();

        return $session;
    }

    public function testListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/sessions');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCollectionIsScopedToOwner(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->createSession($this->createCampaign($alice), 'Séance Alice');
        $this->createSession($this->createCampaign($bob), 'Séance Bob');

        $response = $this->client->request('GET', '/api/sessions', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Séance Alice', $body);
        $this->assertStringNotContainsString('Séance Bob', $body);
    }

    public function testOwnerCanReadOwnSession(): void
    {
        $alice = $this->createUser('alice@example.com');
        $session = $this->createSession($this->createCampaign($alice));

        $this->client->request('GET', '/api/sessions/'.$session->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testNonOwnerCannotReadSession(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $session = $this->createSession($this->createCampaign($alice));

        // Scoped out of the query by CurrentUserExtension -> not found (404).
        $this->client->request('GET', '/api/sessions/'.$session->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testNonOwnerCannotDeleteSession(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $session = $this->createSession($this->createCampaign($alice));

        $this->client->request('DELETE', '/api/sessions/'.$session->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testOwnerCanDeleteOwnSession(): void
    {
        $alice = $this->createUser('alice@example.com');
        $session = $this->createSession($this->createCampaign($alice));

        $this->client->request('DELETE', '/api/sessions/'.$session->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);
    }
}
