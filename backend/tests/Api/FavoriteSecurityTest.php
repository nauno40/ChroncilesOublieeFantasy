<?php

namespace App\Tests\Api;

use App\Entity\Favorite;
use App\Entity\HomebrewEntry;
use App\Entity\User;

/**
 * Contrôle d'accès sur les favoris :
 *  - poster un favori exige d'être connecté ; le membre et l'horodatage sont posés par le
 *    serveur (FavoriteStateProcessor), jamais fournis par le client ;
 *  - mettre son propre contenu en favori est refusé (aucun intérêt produit — « Mes
 *    créations » fait déjà ce travail) ;
 *  - un doublon est refusé (409), pas une exception SQL brute sur la contrainte d'unicité ;
 *  - lister/consulter/supprimer un favori est strictement personnel — personne ne voit les
 *    favoris de quelqu'un d'autre, même un admin (pas de vocation de modération ici).
 */
final class FavoriteSecurityTest extends ApiSecurityTestCase
{
    private function makeEntry(User $owner, string $visibility = 'public'): HomebrewEntry
    {
        $e = new HomebrewEntry();
        $e->setOwner($owner);
        $e->setCategory('sort');
        $e->setName('Sort de test');
        $e->setDescription('...');
        $e->setVisibility($visibility);
        $e->setCreatedAt(new \DateTimeImmutable());
        $e->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($e);
        $this->em->flush();

        return $e;
    }

    private function makeFavorite(User $user, string $targetType, int $targetId): Favorite
    {
        $f = new Favorite();
        $f->setUser($user);
        $f->setTargetType($targetType);
        $f->setTargetId($targetId);
        $f->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($f);
        $this->em->flush();

        return $f;
    }

    public function testCreateRequiresAuthentication(): void
    {
        $this->client->request('POST', '/api/favorites', [
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => 1],
        ]);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCanFavoriteSomeoneElsesPublicEntry(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');

        $this->client->request('POST', '/api/favorites', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId()],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['targetType' => 'homebrew_entry', 'targetId' => $entry->getId()]);
    }

    public function testCreateIgnoresClientProvidedUser(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');

        $this->client->request('POST', '/api/favorites', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId(), 'user' => '/api/users/'.$bob->getId()],
        ]);

        $this->em->clear();
        $favorite = $this->em->getRepository(Favorite::class)->findOneBy(['targetId' => $entry->getId()]);
        $this->assertSame($alice->getId(), $favorite->getUser()->getId());
    }

    public function testCannotFavoriteOwnContent(): void
    {
        $alice = $this->createUser('alice@example.com');
        $entry = $this->makeEntry($alice);

        $this->client->request('POST', '/api/favorites', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId()],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testFavoritingTwiceIsRejectedAsConflict(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');
        $this->makeFavorite($alice, 'homebrew_entry', $entry->getId());

        $this->client->request('POST', '/api/favorites', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId()],
        ]);
        $this->assertResponseStatusCodeSame(409);
    }

    public function testFavoritingUnknownTargetIsRejected(): void
    {
        $alice = $this->createUser('alice@example.com');

        $this->client->request('POST', '/api/favorites', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => 999999],
        ]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCollectionIsScopedToCurrentUser(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry1 = $this->makeEntry($bob);
        $entry2 = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');
        $this->makeFavorite($alice, 'homebrew_entry', $entry1->getId());
        $this->makeFavorite($bob, 'homebrew_entry', $entry2->getId());

        $response = $this->client->request('GET', '/api/favorites', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->toArray();
        $this->assertCount(1, $body['member'] ?? $body['hydra:member']);
    }

    public function testCannotReadSomeoneElsesFavorite(): void
    {
        // Scoped out of the query by CurrentUserExtension -> not found (404), même
        // convention que CustomCreatureSecurityTest::testNonOwnerCannotReadCustomCreature.
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');
        $favorite = $this->makeFavorite($alice, 'homebrew_entry', $entry->getId());
        $eve = $this->createUser('eve@example.com');

        $this->client->request('GET', '/api/favorites/'.$favorite->getId(), ['headers' => $this->authHeaders($eve)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testAdminCannotReadSomeoneElsesFavoriteEither(): void
    {
        // Pas de vocation de modération pour les favoris : même un admin n'a pas de droit
        // de lecture dédié, contrairement à ContentReport.
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');
        $favorite = $this->makeFavorite($alice, 'homebrew_entry', $entry->getId());
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);

        $this->client->request('GET', '/api/favorites/'.$favorite->getId(), ['headers' => $this->authHeaders($admin)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testOwnerCanRemoveOwnFavorite(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');
        $favorite = $this->makeFavorite($alice, 'homebrew_entry', $entry->getId());

        $this->client->request('DELETE', '/api/favorites/'.$favorite->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);
    }
}
