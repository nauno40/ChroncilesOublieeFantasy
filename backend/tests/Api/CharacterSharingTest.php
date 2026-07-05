<?php

namespace App\Tests\Api;

use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\Character;
use App\Entity\User;

/**
 * Fiches partagées : le MJ lit et édite les fiches de ses membres, mais ne les
 * supprime pas ; un joueur ne rattache une fiche qu'à une campagne qu'il a rejointe.
 */
final class CharacterSharingTest extends ApiSecurityTestCase
{
    private function member(Campaign $campaign, User $player): void
    {
        $m = new CampaignMembership();
        $m->setCampaign($campaign);
        $m->setPlayer($player);
        $this->em->persist($m);
        $this->em->flush();
    }

    private function characterInCampaign(User $owner, Campaign $campaign): Character
    {
        $c = new Character();
        $c->setName('Hero');
        $c->setLevel(1);
        $c->setOwner($owner);
        $c->setCampaign($campaign);
        $this->em->persist($c);
        $this->em->flush();

        return $c;
    }

    public function testGmCanReadMemberCharacter(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);
        $char = $this->characterInCampaign($joueur, $campaign);

        $this->client->request('GET', '/api/characters/'.$char->getId(), ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testGmCanEditMemberCharacter(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);
        $char = $this->characterInCampaign($joueur, $campaign);

        $this->client->request('PATCH', '/api/characters/'.$char->getId(), [
            'headers' => $this->authHeaders($mj) + ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['level' => 3],
        ]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains(['level' => 3]);
    }

    public function testGmCannotDeleteMemberCharacter(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);
        $char = $this->characterInCampaign($joueur, $campaign);

        $this->client->request('DELETE', '/api/characters/'.$char->getId(), ['headers' => $this->authHeaders($mj)]);
        $this->assertResponseStatusCodeSame(403); // visible mais suppression réservée au propriétaire
    }

    public function testPlayerCanAttachToJoinedCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com');
        $campaign = $this->createCampaign($mj);
        $this->member($campaign, $joueur);

        $response = $this->client->request('POST', '/api/characters', [
            'headers' => $this->authHeaders($joueur),
            // Le membre rattache par identifiant (il ne peut pas résoudre l'IRI d'une campagne owner-scopée).
            'json' => ['name' => 'Legolas', 'level' => 1, 'campaignId' => $campaign->getId()],
        ]);
        $this->assertResponseStatusCodeSame(201);
    }

    public function testPlayerCannotAttachToNonJoinedCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $joueur = $this->createUser('joueur@example.com'); // n'a PAS rejoint
        $campaign = $this->createCampaign($mj);

        $this->client->request('POST', '/api/characters', [
            'headers' => $this->authHeaders($joueur),
            // Rattachement par id d'une campagne non rejointe -> refusé par la validation d'appartenance.
            'json' => ['name' => 'Intrus', 'level' => 1, 'campaignId' => $campaign->getId()],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }
}
