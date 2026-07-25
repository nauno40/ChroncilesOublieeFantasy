<?php

namespace App\Tests\Api;

use App\Entity\CampaignMembership;
use App\Entity\Clue;
use App\Entity\Quest;
use App\Entity\Session;

/**
 * Vue joueur : rejoindre par code et lire les résumés — sans fuite des secrets MJ.
 */
final class SharedCampaignTest extends ApiSecurityTestCase
{
    private function joinAsMember(\App\Entity\Campaign $campaign, \App\Entity\User $player): void
    {
        $membership = new CampaignMembership();
        $membership->setCampaign($campaign);
        $membership->setPlayer($player);
        $this->em->persist($membership);
        $this->em->flush();
    }

    private function addSession(\App\Entity\Campaign $campaign, string $title, string $summary): void
    {
        $session = new Session();
        $session->setTitle($title);
        $session->setDate(new \DateTime('2026-06-01'));
        $session->setSummary($summary);
        $session->setCampaign($campaign);
        $this->em->persist($session);
        $this->em->flush();
    }

    public function testJoinWithValidCodeCreatesMembership(): void
    {
        $mj = $this->createUser('mj@example.com');
        $mj->setPseudo('Le Meneur');
        $campaign = $this->createCampaign($mj, 'Osgild');
        $campaign->setInviteCode('JOIN1234');
        $this->em->flush();

        $joueur = $this->createUser('joueur@example.com');
        $response = $this->client->request('POST', '/api/shared_campaigns/join', [
            'headers' => $this->authHeaders($joueur),
            'json' => ['code' => 'JOIN1234'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['name' => 'Osgild', 'gameMaster' => 'Le Meneur']);
    }

    public function testJoinWithInvalidCodeIs404(): void
    {
        $joueur = $this->createUser('joueur@example.com');
        $this->client->request('POST', '/api/shared_campaigns/join', [
            'headers' => $this->authHeaders($joueur),
            'json' => ['code' => 'NOPE0000'],
        ]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCannotJoinOwnCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj);
        $campaign->setInviteCode('OWN12345');
        $this->em->flush();

        $this->client->request('POST', '/api/shared_campaigns/join', [
            'headers' => $this->authHeaders($mj),
            'json' => ['code' => 'OWN12345'],
        ]);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testJoinIsIdempotent(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj);
        $campaign->setInviteCode('IDEM1234');
        $this->em->flush();
        $joueur = $this->createUser('joueur@example.com');

        $payload = ['headers' => $this->authHeaders($joueur), 'json' => ['code' => 'IDEM1234']];
        $this->client->request('POST', '/api/shared_campaigns/join', $payload);
        $this->client->request('POST', '/api/shared_campaigns/join', $payload);

        $count = $this->em->getRepository(CampaignMembership::class)->count(['campaign' => $campaign, 'player' => $joueur]);
        $this->assertSame(1, $count);
    }

    public function testMemberReadsSummariesOnly(): void
    {
        $mj = $this->createUser('mj@example.com');
        $mj->setPseudo('Le Meneur');
        $campaign = $this->createCampaign($mj, 'Osgild');
        $campaign->setNotes('SECRET: le majordome est coupable');
        $this->em->flush();
        $this->addSession($campaign, 'Séance 1', 'Les héros arrivent à Monastir.');
        $joueur = $this->createUser('joueur@example.com');
        $this->joinAsMember($campaign, $joueur);

        $response = $this->client->request('GET', '/api/shared_campaigns', ['headers' => $this->authHeaders($joueur)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Les héros arrivent à Monastir.', $body);
        $this->assertStringNotContainsString('majordome', $body); // notes MJ jamais exposées
    }

    private function addQuest(\App\Entity\Campaign $campaign, string $title, string $description, bool $shared): void
    {
        $q = new Quest();
        $q->setTitle($title);
        $q->setDescription($description);
        $q->setShared($shared);
        $q->setCampaign($campaign);
        $this->em->persist($q);
        $this->em->flush();
    }

    private function addClue(\App\Entity\Campaign $campaign, string $content, bool $shared): void
    {
        $c = new Clue();
        $c->setContent($content);
        $c->setShared($shared);
        $c->setCampaign($campaign);
        $this->em->persist($c);
        $this->em->flush();
    }

    public function testOnlySharedQuestsAndCluesAreExposed(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj, 'Osgild');
        $this->em->flush();
        $this->addQuest($campaign, 'Quete partagee', 'Sauver le village', true);
        $this->addQuest($campaign, 'Complot secret', 'Le maire ment', false);
        $this->addClue($campaign, 'Une empreinte de loup', true);
        $this->addClue($campaign, 'Indice cache', false);
        $joueur = $this->createUser('joueur@example.com');
        $this->joinAsMember($campaign, $joueur);

        $response = $this->client->request('GET', '/api/shared_campaigns', ['headers' => $this->authHeaders($joueur)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        // Partagés : visibles.
        $this->assertStringContainsString('Quete partagee', $body);
        $this->assertStringContainsString('Sauver le village', $body);
        $this->assertStringContainsString('Une empreinte de loup', $body);
        // Non partagés : jamais exposés.
        $this->assertStringNotContainsString('Complot secret', $body);
        $this->assertStringNotContainsString('Indice cache', $body);
    }

    public function testNonMemberCannotReadSharedCampaign(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj);
        $etranger = $this->createUser('etranger@example.com');

        $this->client->request('GET', '/api/shared_campaigns/'.$campaign->getId(), ['headers' => $this->authHeaders($etranger)]);
        $this->assertResponseStatusCodeSame(404);
    }
}
