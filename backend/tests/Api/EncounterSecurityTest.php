<?php

namespace App\Tests\Api;

use App\Entity\Campaign;
use App\Entity\Encounter;

/**
 * Access control on the Encounter resource (a Campaign sub-resource):
 *  - authentication required
 *  - collections and items are scoped to the campaign owner (CurrentUserExtension
 *    + per-operation security on object.getCampaign().getOwner())
 *  - creation requires owning the target campaign
 */
final class EncounterSecurityTest extends ApiSecurityTestCase
{
    private function createEncounter(Campaign $campaign, string $name = 'Embuscade'): Encounter
    {
        $encounter = new Encounter();
        $encounter->setName($name);
        $encounter->setCampaign($campaign);

        $this->em->persist($encounter);
        $this->em->flush();

        return $encounter;
    }

    public function testListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/encounters');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCollectionIsScopedToOwner(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->createEncounter($this->createCampaign($alice), 'Alice Encounter');
        $this->createEncounter($this->createCampaign($bob), 'Bob Encounter');

        $response = $this->client->request('GET', '/api/encounters', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Alice Encounter', $body);
        $this->assertStringNotContainsString('Bob Encounter', $body);
    }

    public function testOwnerCanCreateEncounterByEmbeddingInCampaign(): void
    {
        // Flux réel : les rencontres sont créées en enregistrant la campagne avec
        // ses enfants embarqués (comme quêtes/séances) — cascade owner-scopée.
        $alice = $this->createUser('alice@example.com');
        $campaign = $this->createCampaign($alice);

        $this->client->request('PATCH', '/api/campaigns/'.$campaign->getId(), [
            'headers' => $this->authHeaders($alice) + ['Content-Type' => 'application/merge-patch+json'],
            'body' => json_encode([
                'encounters' => [
                    ['name' => 'Loups des glaces', 'combatants' => [['name' => 'Loup', 'quantity' => 3, 'hp' => 12, 'def' => 13, 'initiative' => 12, 'per' => 2]]],
                ],
            ]),
        ]);

        $this->assertResponseStatusCodeSame(200);
        $this->assertStringContainsString('Loups des glaces', $this->client->getResponse()->getContent());
    }

    public function testNonOwnerCannotReadEncounter(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $encounter = $this->createEncounter($this->createCampaign($alice));

        $this->client->request('GET', '/api/encounters/'.$encounter->getId(), ['headers' => $this->authHeaders($bob)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testOwnerCanDeleteOwnEncounter(): void
    {
        $alice = $this->createUser('alice@example.com');
        $encounter = $this->createEncounter($this->createCampaign($alice));

        $this->client->request('DELETE', '/api/encounters/'.$encounter->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);
    }
}
