<?php

namespace App\Tests\Api;

use App\Entity\CustomCreature;
use App\Entity\Favorite;
use App\Entity\HomebrewEntry;
use App\Entity\Tag;
use App\Entity\User;

/**
 * Tags libres et tri par popularité, communs à HomebrewEntry et CustomCreature — un seul
 * fichier car {@see \App\Filter\TagFilter}/{@see \App\Filter\PopularityFilter} sont des
 * filtres génériques partagés par les deux ressources, pas du code dupliqué par entité.
 */
final class TagAndPopularityTest extends ApiSecurityTestCase
{
    private function makeEntry(User $owner, string $name = 'Sort de test', string $visibility = 'public'): HomebrewEntry
    {
        $e = new HomebrewEntry();
        $e->setOwner($owner);
        $e->setCategory('sort');
        $e->setName($name);
        $e->setVisibility($visibility);
        $e->setCreatedAt(new \DateTimeImmutable());
        $e->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($e);
        $this->em->flush();

        return $e;
    }

    private function makeCreature(User $owner, string $name = 'Créature de test'): CustomCreature
    {
        $c = new CustomCreature();
        $c->setName($name);
        $c->setNc(1);
        $c->setHp(10);
        $c->setDef(12);
        $c->setInit(10);
        $c->setOwner($owner);
        $this->em->persist($c);
        $this->em->flush();

        return $c;
    }

    private function makeFavorite(User $user, string $targetType, int $targetId): void
    {
        $f = new Favorite();
        $f->setUser($user);
        $f->setTargetType($targetType);
        $f->setTargetId($targetId);
        $f->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($f);
        $this->em->flush();
    }

    // --- Écriture : normalisation, find-or-create, PATCH partiel ---

    public function testCreatingAnEntryWithTagsNormalizesAndDeduplicates(): void
    {
        $user = $this->createUser('mj@example.com');

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'sort', 'name' => 'Boule de givre', 'visibility' => 'public', 'tags' => ['Boss', '  boss  ', 'urbain']],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $body = json_decode($this->client->getResponse()->getContent(), true);
        sort($body['tags']);
        $this->assertSame(['boss', 'urbain'], $body['tags']);

        // Un seul tag "boss" en base, pas deux.
        $this->assertCount(1, $this->em->getRepository(Tag::class)->findBy(['name' => 'boss']));
    }

    public function testReusesAnExistingTagAcrossTwoDifferentEntries(): void
    {
        $user = $this->createUser('mj@example.com');
        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'sort', 'name' => 'Premier', 'visibility' => 'public', 'tags' => ['epique']],
        ]);
        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'sort', 'name' => 'Second', 'visibility' => 'public', 'tags' => ['epique']],
        ]);

        $this->assertCount(1, $this->em->getRepository(Tag::class)->findBy(['name' => 'epique']));
    }

    public function testPatchWithoutTagsFieldLeavesExistingTagsUntouched(): void
    {
        $user = $this->createUser('mj@example.com');
        $entry = $this->makeEntry($user);
        $this->client->request('PATCH', '/api/homebrew_entries/'.$entry->getId(), [
            'headers' => array_merge($this->authHeaders($user), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['tags' => ['boss']],
        ]);

        // Un second PATCH qui ne parle pas de tags (change juste le nom) ne doit pas les effacer.
        $this->client->request('PATCH', '/api/homebrew_entries/'.$entry->getId(), [
            'headers' => array_merge($this->authHeaders($user), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['name' => 'Nom modifié'],
        ]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains(['tags' => ['boss']]);
    }

    public function testPatchWithEmptyTagsArrayClearsThem(): void
    {
        $user = $this->createUser('mj@example.com');
        $entry = $this->makeEntry($user);
        $this->client->request('PATCH', '/api/homebrew_entries/'.$entry->getId(), [
            'headers' => array_merge($this->authHeaders($user), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['tags' => ['boss']],
        ]);

        $this->client->request('PATCH', '/api/homebrew_entries/'.$entry->getId(), [
            'headers' => array_merge($this->authHeaders($user), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['tags' => []],
        ]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains(['tags' => []]);
    }

    public function testCustomCreatureAcceptsTagsToo(): void
    {
        $user = $this->createUser('mj@example.com');

        $this->client->request('POST', '/api/custom_creatures', [
            'headers' => $this->authHeaders($user),
            'json' => ['name' => 'Naïade', 'nc' => 2, 'hp' => 20, 'def' => 14, 'init' => 13, 'visibility' => 'public', 'tags' => ['aquatique']],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['tags' => ['aquatique']]);
    }

    // --- Filtre `tag` ---

    public function testTagFilterNarrowsHomebrewCollection(): void
    {
        $user = $this->createUser('mj@example.com');
        $avecTag = $this->makeEntry($user, 'Avec tag');
        $avecTag->setTagEntities(new \Doctrine\Common\Collections\ArrayCollection($this->resolveTags('boss')));
        $this->makeEntry($user, 'Sans tag');
        $this->em->flush();

        $response = $this->client->request('GET', '/api/homebrew_entries?tag=boss', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Avec tag', $body);
        $this->assertStringNotContainsString('Sans tag', $body);
    }

    public function testTagFilterIsCaseInsensitive(): void
    {
        $user = $this->createUser('mj@example.com');
        $entry = $this->makeEntry($user, 'Avec tag');
        $entry->setTagEntities(new \Doctrine\Common\Collections\ArrayCollection($this->resolveTags('boss')));
        $this->em->flush();

        $response = $this->client->request('GET', '/api/homebrew_entries?tag=BOSS', ['headers' => $this->authHeaders($user)]);
        $this->assertStringContainsString('Avec tag', $response->getContent());
    }

    public function testTagFilterWorksOnCustomCreatureToo(): void
    {
        $user = $this->createUser('mj@example.com');
        $creature = $this->makeCreature($user, 'Avec tag');
        $creature->setTagEntities(new \Doctrine\Common\Collections\ArrayCollection($this->resolveTags('aquatique')));
        $this->makeCreature($user, 'Sans tag');
        $this->em->flush();

        $response = $this->client->request('GET', '/api/custom_creatures?tag=aquatique', ['headers' => $this->authHeaders($user)]);
        $body = $response->getContent();
        $this->assertStringContainsString('Avec tag', $body);
        $this->assertStringNotContainsString('Sans tag', $body);
    }

    // --- Tri `order[popularity]` ---

    public function testPopularitySortOrdersByFavoriteCountDescending(): void
    {
        $owner = $this->createUser('mj@example.com');
        $peuFavori = $this->makeEntry($owner, 'Peu favori');
        $tresFavori = $this->makeEntry($owner, 'Très favori');

        $bob = $this->createUser('bob@example.com');
        $alice = $this->createUser('alice@example.com');
        $this->makeFavorite($bob, 'homebrew_entry', $tresFavori->getId());
        $this->makeFavorite($alice, 'homebrew_entry', $tresFavori->getId());
        $this->makeFavorite($bob, 'homebrew_entry', $peuFavori->getId());

        $response = $this->client->request('GET', '/api/homebrew_entries?order[popularity]=desc', ['headers' => $this->authHeaders($owner)]);
        $body = $response->toArray();
        $names = array_column($body['member'] ?? $body['hydra:member'], 'name');
        $posTres = array_search('Très favori', $names, true);
        $posPeu = array_search('Peu favori', $names, true);
        $this->assertNotFalse($posTres);
        $this->assertNotFalse($posPeu);
        $this->assertLessThan($posPeu, $posTres, 'L\'entrée la plus favorisée doit venir avant la moins favorisée.');
    }

    public function testPopularitySortDoesNotCountFavoritesOfTheOtherEntityType(): void
    {
        // Une créature très favorisée ne doit pas influencer le tri des entrées de
        // bibliothèque : `targetType` doit bien cloisonner le comptage.
        $owner = $this->createUser('mj@example.com');
        $entry = $this->makeEntry($owner, 'Entrée');
        $creature = $this->makeCreature($owner, 'Créature');
        $bob = $this->createUser('bob@example.com');
        for ($i = 0; $i < 3; ++$i) {
            $u = $this->createUser("fan$i@example.com");
            $this->makeFavorite($u, 'custom_creature', $creature->getId());
        }
        $this->makeFavorite($bob, 'homebrew_entry', $entry->getId());

        $response = $this->client->request('GET', '/api/homebrew_entries?order[popularity]=desc', ['headers' => $this->authHeaders($owner)]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertStringContainsString('Entrée', $response->getContent());
    }

    public function testWithoutOrderParameterDefaultOrderIsUnaffected(): void
    {
        $user = $this->createUser('mj@example.com');
        $this->makeEntry($user, 'Une entrée');

        $this->client->request('GET', '/api/homebrew_entries', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
    }

    /** @return Tag[] */
    private function resolveTags(string ...$names): array
    {
        $tags = [];
        foreach ($names as $name) {
            $tag = new Tag();
            $tag->setName($name);
            $this->em->persist($tag);
            $tags[] = $tag;
        }
        $this->em->flush();

        return $tags;
    }
}
