<?php

namespace App\Tests\Api;

use App\Entity\HomebrewEntry;
use App\Entity\User;

/**
 * Bibliothèque homebrew : owner-scopée en écriture, lecture « mienne OU publique ».
 */
final class HomebrewEntryTest extends ApiSecurityTestCase
{
    private function makeEntry(User $owner, string $name, string $visibility): HomebrewEntry
    {
        $e = new HomebrewEntry();
        $e->setOwner($owner);
        $e->setCategory('sort');
        $e->setName($name);
        $e->setDescription('...');
        $e->setVisibility($visibility);
        $e->setCreatedAt(new \DateTimeImmutable());
        $e->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($e);
        $this->em->flush();

        return $e;
    }

    public function testCreateSetsOwner(): void
    {
        $user = $this->createUser('mj@example.com');
        $user->setPseudo('Le Meneur');
        $this->em->flush();

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'sort', 'name' => 'Boule de givre', 'description' => '2d6 froid', 'visibility' => 'private'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['name' => 'Boule de givre', 'authorPseudo' => 'Le Meneur', 'visibility' => 'private']);
    }

    public function testCreateWithStructuredData(): void
    {
        $user = $this->createUser('mj@example.com');
        $this->em->flush();

        $data = ['modifiers' => ['FOR' => 1, 'CON' => 1], 'speed' => '10 m', 'typicalNames' => 'Grum, Bhal'];
        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'race', 'name' => 'Peuple des Cimes', 'visibility' => 'private', 'data' => $data],
        ]);
        $this->assertResponseStatusCodeSame(201);
        // Le JSON structuré fait l'aller-retour intact.
        $this->assertJsonContains(['name' => 'Peuple des Cimes', 'data' => $data]);
    }

    public function testCollectionReturnsMineAndPublicOnly(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->makeEntry($alice, 'Sort privé de Bob', 'private'); // en fait à alice
        $this->makeEntry($bob, 'Sort PUBLIC de Bob', 'public');
        $this->makeEntry($bob, 'Sort PRIVE de Bob', 'private');
        $this->makeEntry($alice, 'Mon sort à moi', 'private');

        $response = $this->client->request('GET', '/api/homebrew_entries', ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Mon sort à moi', $body);        // la mienne (privée)
        $this->assertStringContainsString('Sort PUBLIC de Bob', $body);    // publique d'autrui
        $this->assertStringNotContainsString('Sort PRIVE de Bob', $body);  // privée d'autrui : jamais
    }

    public function testAnonymousCanReadPublicEntry(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'Sort public de Bob', 'public');

        $this->client->request('GET', '/api/homebrew_entries/'.$entry->getId());
        $this->assertResponseStatusCodeSame(200);
    }

    public function testAnonymousCannotReadPrivateEntry(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'Secret de Bob', 'private');

        $this->client->request('GET', '/api/homebrew_entries/'.$entry->getId());
        $this->assertResponseStatusCodeSame(404);
    }

    public function testAnonymousCollectionReturnsPublicOnly(): void
    {
        $bob = $this->createUser('bob@example.com');
        $this->makeEntry($bob, 'Sort PUBLIC de Bob', 'public');
        $this->makeEntry($bob, 'Sort PRIVE de Bob', 'private');

        $response = $this->client->request('GET', '/api/homebrew_entries');
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Sort PUBLIC de Bob', $body);
        $this->assertStringNotContainsString('Sort PRIVE de Bob', $body);
    }

    public function testCannotEditOthersEntry(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'Sort de Bob', 'public');

        $this->client->request('PATCH', '/api/homebrew_entries/'.$entry->getId(), [
            'headers' => array_merge($this->authHeaders($alice), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['name' => 'Détourné'],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testCannotReadOthersPrivateEntry(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'Secret de Bob', 'private');

        $this->client->request('GET', '/api/homebrew_entries/'.$entry->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCreateWithParentAttachesToVoieAndReadsBack(): void
    {
        $user = $this->createUser('mj@example.com');
        $voie = $this->makeEntry($user, 'Voie du Chasseur', 'private');

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => [
                'category' => 'capacite',
                'name' => 'Tir précis',
                'description' => '+2 en attaque à distance',
                'visibility' => 'private',
                'parent' => '/api/homebrew_entries/'.$voie->getId(),
            ],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['parent' => '/api/homebrew_entries/'.$voie->getId()]);

        $created = json_decode($this->client->getResponse()->getContent(), true);
        $this->client->request('GET', $created['@id'], ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains(['parent' => '/api/homebrew_entries/'.$voie->getId()]);
    }

    public function testDeletingVoieAlsoDeletesItsCapabilities(): void
    {
        // La confirmation de suppression côté client annonce au joueur combien de
        // capacités partent avec la voie. Cette promesse repose sur le ON DELETE CASCADE
        // de la clé étrangère `parent` : sans ce test, rien ne la garde.
        $user = $this->createUser('mj@example.com');
        $voie = $this->makeEntry($user, 'Voie du Chasseur', 'private');

        $ids = [];
        foreach (['Tir précis', 'Pister'] as $nom) {
            $this->client->request('POST', '/api/homebrew_entries', [
                'headers' => $this->authHeaders($user),
                'json' => [
                    'category' => 'capacite',
                    'name' => $nom,
                    'visibility' => 'private',
                    'parent' => '/api/homebrew_entries/'.$voie->getId(),
                ],
            ]);
            $this->assertResponseStatusCodeSame(201);
            $ids[] = json_decode($this->client->getResponse()->getContent(), true)['@id'];
        }

        $this->client->request('DELETE', '/api/homebrew_entries/'.$voie->getId(), [
            'headers' => $this->authHeaders($user),
        ]);
        $this->assertResponseStatusCodeSame(204);

        // L'entité gérée par Doctrine survivrait en mémoire à une suppression faite en base.
        $this->em->clear();

        foreach ($ids as $iri) {
            $this->client->request('GET', $iri, ['headers' => $this->authHeaders($user)]);
            $this->assertResponseStatusCodeSame(404, "La capacité $iri aurait dû partir avec sa voie.");
        }
    }

    public function testCreateWithForeignParentIsRejected(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        // Publique pour que l'IRI soit résolvable par Bob : c'est bien le rattachement,
        // pas la simple lecture du parent, que la règle serveur doit refuser.
        $voie = $this->makeEntry($alice, "Voie d'Alice", 'public');

        $countBefore = (int) $this->em->createQuery('SELECT COUNT(e.id) FROM App\Entity\HomebrewEntry e')->getSingleScalarResult();

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($bob),
            'json' => [
                'category' => 'capacite',
                'name' => 'Capacité frauduleuse',
                'visibility' => 'private',
                'parent' => '/api/homebrew_entries/'.$voie->getId(),
            ],
        ]);
        $this->assertContains($this->client->getResponse()->getStatusCode(), [403, 422]);

        $countAfter = (int) $this->em->createQuery('SELECT COUNT(e.id) FROM App\Entity\HomebrewEntry e')->getSingleScalarResult();
        $this->assertSame($countBefore, $countAfter, 'Aucune entrée ne doit avoir été créée lors du rattachement frauduleux.');
    }

    public function testCreateInheritsParentVisibility(): void
    {
        $user = $this->createUser('mj@example.com');
        $voie = $this->makeEntry($user, 'Voie publique', 'public');

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => [
                'category' => 'capacite',
                'name' => 'Capacité envoyée en privé',
                'visibility' => 'private',
                'parent' => '/api/homebrew_entries/'.$voie->getId(),
            ],
        ]);
        $this->assertResponseStatusCodeSame(201);
        // La capacité hérite de la visibilité publique de sa voie parente, quoi qu'ait envoyé le client.
        $this->assertJsonContains(['visibility' => 'public']);
    }

    public function testCreateWithoutParentStillWorks(): void
    {
        $user = $this->createUser('mj@example.com');

        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => ['category' => 'sort', 'name' => 'Sort autonome', 'description' => '...', 'visibility' => 'private'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        // Champ omis (null) plutôt que rejeté : la création sans parent reste possible.
        $this->assertJsonContains(['name' => 'Sort autonome']);
        $body = json_decode((string) $this->client->getResponse()->getContent(), true);
        $this->assertArrayNotHasKey('parent', $body);
    }

    public function testUpdatingParentVisibilityCascadesToExistingChildren(): void
    {
        $user = $this->createUser('mj@example.com');
        $voie = $this->makeEntry($user, 'Voie du Chasseur', 'private');
        $capacite = $this->makeEntry($user, 'Tir précis', 'private');
        $capacite->setParent($voie);
        $this->em->flush();

        $this->client->request('PATCH', '/api/homebrew_entries/'.$voie->getId(), [
            'headers' => array_merge($this->authHeaders($user), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['visibility' => 'public'],
        ]);
        $this->assertResponseStatusCodeSame(200);

        // La bascule de la voie en public doit se propager à la capacité déjà en base,
        // sans que le client n'ait besoin d'écrire la capacité lui-même.
        $this->em->clear();
        $refreshed = $this->em->getRepository(HomebrewEntry::class)->find($capacite->getId());
        $this->assertSame('public', $refreshed->getVisibility());
    }

    public function testSelfParentIsRejected(): void
    {
        $user = $this->createUser('mj@example.com');
        $entry = $this->makeEntry($user, 'Voie récursive', 'private');

        $this->client->request('PATCH', '/api/homebrew_entries/'.$entry->getId(), [
            'headers' => array_merge($this->authHeaders($user), ['Content-Type' => 'application/merge-patch+json']),
            'json' => ['parent' => '/api/homebrew_entries/'.$entry->getId()],
        ]);
        $this->assertContains($this->client->getResponse()->getStatusCode(), [403, 422]);
    }

    public function testParentWithExistingParentIsRejected(): void
    {
        $user = $this->createUser('mj@example.com');
        $voie = $this->makeEntry($user, 'Voie', 'private');
        $capacite = $this->makeEntry($user, 'Capacité A', 'private');
        $capacite->setParent($voie);
        $this->em->flush();

        $countBefore = (int) $this->em->createQuery('SELECT COUNT(e.id) FROM App\Entity\HomebrewEntry e')->getSingleScalarResult();

        // Tenter de rattacher une nouvelle entrée à une capacité (qui a elle-même un parent)
        // formerait trois niveaux : refusé, la profondeur est bornée à deux.
        $this->client->request('POST', '/api/homebrew_entries', [
            'headers' => $this->authHeaders($user),
            'json' => [
                'category' => 'capacite',
                'name' => 'Capacité B',
                'visibility' => 'private',
                'parent' => '/api/homebrew_entries/'.$capacite->getId(),
            ],
        ]);
        $this->assertContains($this->client->getResponse()->getStatusCode(), [403, 422]);

        $countAfter = (int) $this->em->createQuery('SELECT COUNT(e.id) FROM App\Entity\HomebrewEntry e')->getSingleScalarResult();
        $this->assertSame($countBefore, $countAfter);
    }

    // --- Pagination serveur (remplace `pagination=false` côté client sur HomebrewBrowser) ---

    public function testCategoryFilterNarrowsCollection(): void
    {
        $user = $this->createUser('mj@example.com');
        $sort = $this->makeEntry($user, 'Un sort', 'public');
        $sort->setCategory('sort');
        $race = $this->makeEntry($user, 'Une race', 'public');
        $race->setCategory('race');
        $this->em->flush();

        $response = $this->client->request('GET', '/api/homebrew_entries?category=sort', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Un sort', $body);
        $this->assertStringNotContainsString('Une race', $body);
    }

    public function testSearchFilterMatchesNameOrDescriptionCaseInsensitive(): void
    {
        $user = $this->createUser('mj@example.com');
        $parNom = $this->makeEntry($user, 'Éclat de givre', 'public');
        $parDescription = $this->makeEntry($user, 'Sort sans rapport', 'public');
        $parDescription->setDescription('Provoque un ÉCLAT lumineux');
        $sansRapport = $this->makeEntry($user, 'Boule de feu', 'public');
        $this->em->flush();

        $response = $this->client->request('GET', '/api/homebrew_entries?search=éclat', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Éclat de givre', $body);
        $this->assertStringContainsString('Sort sans rapport', $body);
        $this->assertStringNotContainsString('Boule de feu', $body);
    }

    public function testSearchFilterWithNoMatchReturnsEmptyCollection(): void
    {
        $user = $this->createUser('mj@example.com');
        $this->makeEntry($user, 'Boule de feu', 'public');

        $response = $this->client->request('GET', '/api/homebrew_entries?search=inexistant', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->toArray();
        $this->assertCount(0, $body['member'] ?? $body['hydra:member']);
    }

    public function testScopeMineReturnsOnlyOwnEntriesEvenPublicOnesFromOthers(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->makeEntry($alice, 'À moi', 'private');
        $this->makeEntry($bob, 'À Bob, publique', 'public');

        $response = $this->client->request('GET', '/api/homebrew_entries?scope=mine', ['headers' => $this->authHeaders($alice)]);
        $body = $response->toArray();
        $this->assertCount(1, $body['member'] ?? $body['hydra:member']);
        $this->assertStringContainsString('À moi', $response->getContent());
    }

    public function testScopeCommunityExcludesMyOwnPublicEntries(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');
        $this->makeEntry($alice, 'Publique à moi', 'public');
        $this->makeEntry($bob, 'Publique à Bob', 'public');
        $this->makeEntry($bob, 'Privée à Bob', 'private');

        $response = $this->client->request('GET', '/api/homebrew_entries?scope=community', ['headers' => $this->authHeaders($alice)]);
        $body = $response->getContent();
        $this->assertStringContainsString('Publique à Bob', $body);
        $this->assertStringNotContainsString('Publique à moi', $body);
        $this->assertStringNotContainsString('Privée à Bob', $body);
    }

    public function testScopeMineForAnonymousVisitorReturnsEmptyNotAnError(): void
    {
        $bob = $this->createUser('bob@example.com');
        $this->makeEntry($bob, 'Publique à Bob', 'public');

        $response = $this->client->request('GET', '/api/homebrew_entries?scope=mine');
        $this->assertResponseStatusCodeSame(200);
        $body = $response->toArray();
        $this->assertCount(0, $body['member'] ?? $body['hydra:member']);
    }

    public function testParentFilterReturnsOnlyTheChildrenOfThatVoie(): void
    {
        // HomebrewBrowser.tsx compte/copie les capacités d'une voie via ce filtre plutôt
        // que via la page déjà chargée (qui peut ne pas les contenir toutes une fois la
        // bibliothèque paginée) — la correction dépend donc de ce filtre, pas d'un hasard
        // d'ordre de tri.
        $user = $this->createUser('mj@example.com');
        $voieA = $this->makeEntry($user, 'Voie A', 'private');
        $voieB = $this->makeEntry($user, 'Voie B', 'private');
        $capA1 = $this->makeEntry($user, 'Capacité A1', 'private');
        $capA1->setParent($voieA);
        $capA2 = $this->makeEntry($user, 'Capacité A2', 'private');
        $capA2->setParent($voieA);
        $capB1 = $this->makeEntry($user, 'Capacité B1', 'private');
        $capB1->setParent($voieB);
        $this->em->flush();

        $response = $this->client->request('GET', '/api/homebrew_entries?parent=/api/homebrew_entries/'.$voieA->getId(), [
            'headers' => $this->authHeaders($user),
        ]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->getContent();
        $this->assertStringContainsString('Capacité A1', $body);
        $this->assertStringContainsString('Capacité A2', $body);
        $this->assertStringNotContainsString('Capacité B1', $body);
        $this->assertStringNotContainsString('"name":"Voie A"', $body);
    }

    public function testCollectionIsActuallyPaginatedWithCorrectTotal(): void
    {
        $user = $this->createUser('mj@example.com');
        for ($i = 1; $i <= 5; ++$i) {
            $this->makeEntry($user, "Entrée $i", 'public');
        }

        $response = $this->client->request('GET', '/api/homebrew_entries?itemsPerPage=2', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
        $body = $response->toArray();
        $this->assertCount(2, $body['member'] ?? $body['hydra:member']);
        $this->assertSame(5, $body['totalItems'] ?? $body['hydra:totalItems']);
    }
}
