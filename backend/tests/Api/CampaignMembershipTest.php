<?php

namespace App\Tests\Api;

use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\User;

/**
 * Visibilité et révocation des adhésions.
 */
final class CampaignMembershipTest extends ApiSecurityTestCase
{
    private function member(Campaign $campaign, User $player): CampaignMembership
    {
        $m = new CampaignMembership();
        $m->setCampaign($campaign);
        $m->setPlayer($player);
        $this->em->persist($m);
        $this->em->flush();

        return $m;
    }

    public function testOwnerSeesMembersOfOwnCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $joueur->setPseudo('Gimli');
        $this->em->flush();
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);

        $response = $this->client->request('GET', '/api/campaign_memberships', ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertStringContainsString('Gimli', $response->getContent());
    }

    public function testPlayerSeesOnlyOwnMemberships(): void
    {
        $mj = $this->createUser('mj@example.com');
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $alice);
        $this->member($campaign, $bob);

        $response = $this->client->request('GET', '/api/campaign_memberships', ['headers' => $this->authHeaders($alice)]);
        $data = $response->toArray();
        $this->assertCount(1, $data['hydra:member'] ?? $data['member']);
    }

    public function testPlayerCanLeave(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $m = $this->member($campaign, $joueur);

        $this->client->request('DELETE', '/api/campaign_memberships/'.$m->getId(), ['headers' => $this->authHeaders($joueur)]);
        $this->assertResponseStatusCodeSame(204);
    }

    public function testOwnerCanKick(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $m = $this->member($campaign, $joueur);

        $this->client->request('DELETE', '/api/campaign_memberships/'.$m->getId(), ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(204);
    }

    public function testStrangerCannotSeeMembership(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $etranger = $this->createUser('etranger@example.com');
        $campaign = $this->createCampaign($mj);
        $m = $this->member($campaign, $joueur);

        $this->client->request('GET', '/api/campaign_memberships/'.$m->getId(), ['headers' => $this->authHeaders($etranger)]);
        $this->assertResponseStatusCodeSame(404);
    }
}
