<?php

namespace App\Tests\Api;

use App\Entity\Comment;
use App\Entity\ContentReport;
use App\Entity\CustomCreature;
use App\Entity\Favorite;
use App\Entity\HomebrewEntry;
use App\Entity\User;

/**
 * Export de données personnelles (`GET /api/me/export`) : réservé au compte authentifié,
 * ne renvoie QUE ce qu'il possède (jamais le contenu d'un autre), et couvre toutes les
 * briques que le compte peut posséder (campagnes, personnages, monstres maison, entrées de
 * bibliothèque, favoris, commentaires, signalements).
 */
final class DataExportTest extends ApiSecurityTestCase
{
    private function makeEntry(User $owner): HomebrewEntry
    {
        $e = new HomebrewEntry();
        $e->setOwner($owner);
        $e->setCategory('sort');
        $e->setName('Éclat de givre');
        $e->setCreatedAt(new \DateTimeImmutable());
        $e->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($e);
        $this->em->flush();

        return $e;
    }

    private function makeCreature(User $owner): CustomCreature
    {
        $c = new CustomCreature();
        $c->setName('Naïade des sources');
        $c->setNc(2);
        $c->setHp(20);
        $c->setDef(14);
        $c->setInit(13);
        $c->setOwner($owner);
        $this->em->persist($c);
        $this->em->flush();

        return $c;
    }

    public function testRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/me/export');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testExportContainsAccountInfoAndDownloadHeader(): void
    {
        $alice = $this->createUser('alice@example.com', [], 'password');

        $response = $this->client->request('GET', '/api/me/export', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertStringContainsString('attachment', $response->getHeaders()['content-disposition'][0]);

        $data = $response->toArray();
        $this->assertSame('alice@example.com', $data['compte']['email']);
        $this->assertArrayNotHasKey('password', $data['compte']);
    }

    public function testExportContainsOnlyOwnCampaignsAndCharactersNotSomeoneElses(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->createCampaign($alice, 'Campagne Alice');
        $this->createCampaign($bob, 'Campagne Bob');
        $this->createCharacter($alice, 'Perso Alice');
        $this->createCharacter($bob, 'Perso Bob');

        $data = $this->client->request('GET', '/api/me/export', ['headers' => $this->authHeaders($alice)])->toArray();

        $this->assertCount(1, $data['campagnes']);
        $this->assertSame('Campagne Alice', $data['campagnes'][0]['name']);
        $this->assertCount(1, $data['personnages']);
        $this->assertSame('Perso Alice', $data['personnages'][0]['name']);
    }

    public function testExportContainsOwnedCustomCreaturesAndHomebrewEntries(): void
    {
        $alice = $this->createUser('alice@example.com');
        $this->makeCreature($alice);
        $this->makeEntry($alice);

        $data = $this->client->request('GET', '/api/me/export', ['headers' => $this->authHeaders($alice)])->toArray();

        $this->assertCount(1, $data['monstresMaison']);
        $this->assertSame('Naïade des sources', $data['monstresMaison'][0]['name']);
        $this->assertCount(1, $data['bibliotheque']);
        $this->assertSame('Éclat de givre', $data['bibliotheque'][0]['name']);
    }

    public function testExportContainsOwnFavoritesCommentsAndReportsNotSomeoneElses(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob); // contenu public d'autrui, favorisé/commenté/signalé par Alice

        $favorite = (new Favorite())->setUser($alice)->setTargetType('homebrew_entry')->setTargetId($entry->getId())->setCreatedAt(new \DateTimeImmutable());
        $comment = (new Comment())->setAuthor($alice)->setTargetType('homebrew_entry')->setTargetId($entry->getId())->setContent('Bravo !')->setCreatedAt(new \DateTimeImmutable());
        $report = (new ContentReport())->setReporter($alice)->setTargetType('homebrew_entry')->setTargetId($entry->getId())->setReason('Test')->setStatus('pending')->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($favorite);
        $this->em->persist($comment);
        $this->em->persist($report);
        $this->em->flush();

        $data = $this->client->request('GET', '/api/me/export', ['headers' => $this->authHeaders($alice)])->toArray();

        $this->assertCount(1, $data['favoris']);
        $this->assertCount(1, $data['commentaires']);
        $this->assertSame('Bravo !', $data['commentaires'][0]['content']);
        $this->assertCount(1, $data['signalements']);

        // Bob ne voit ni le favori, ni le commentaire, ni le signalement d'Alice sur son
        // propre contenu — l'export reste strictement personnel.
        $dataBob = $this->client->request('GET', '/api/me/export', ['headers' => $this->authHeaders($bob)])->toArray();
        $this->assertCount(0, $dataBob['favoris']);
        $this->assertCount(0, $dataBob['commentaires']);
        $this->assertCount(0, $dataBob['signalements']);
    }
}
