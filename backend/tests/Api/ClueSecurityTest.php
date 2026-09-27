<?php

namespace App\Tests\Api;

use App\Entity\Campaign;
use App\Entity\Clue;

/**
 * Access control on the Clue resource (a Campaign sub-resource) — same construction as
 * Quest/Session/Encounter, sharing the same `campaign.owner` branch of CurrentUserExtension.
 * Mirrors QuestSecurityTest: authentication required, collection/item scoped to the
 * campaign owner, non-owner reads/deletes denied (404, scoped out before security runs).
 */
final class ClueSecurityTest extends ApiSecurityTestCase
{
    private function createClue(Campaign $campaign, string $content = 'Indice'): Clue
    {
        $clue = new Clue();
        $clue->setContent($content);
        $clue->setCampaign($campaign);

        $this->em->persist($clue);
        $this->em->flush();

        return $clue;
    }

    public function testListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/clues');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCollectionIsScopedToOwner(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->createClue($this->createCampaign($alice), 'Indice Alice');
        $this->createClue($this->createCampaign($bob), 'Indice Bob');

        $response = $this->client->request('GET', '/api/clues', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Indice Alice', $body);
        $this->assertStringNotContainsString('Indice Bob', $body);
    }

    public function testOwnerCanReadOwnClue(): void
    {
        $alice = $this->createUser('alice@example.com');
        $clue = $this->createClue($this->createCampaign($alice));

        $this->client->request('GET', '/api/clues/'.$clue->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testNonOwnerCannotReadClue(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $clue = $this->createClue($this->createCampaign($alice));

        // Scoped out of the query by CurrentUserExtension -> not found (404).
        $this->client->request('GET', '/api/clues/'.$clue->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testNonOwnerCannotDeleteClue(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $clue = $this->createClue($this->createCampaign($alice));

        $this->client->request('DELETE', '/api/clues/'.$clue->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testOwnerCanDeleteOwnClue(): void
    {
        $alice = $this->createUser('alice@example.com');
        $clue = $this->createClue($this->createCampaign($alice));

        $this->client->request('DELETE', '/api/clues/'.$clue->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);
    }
}
