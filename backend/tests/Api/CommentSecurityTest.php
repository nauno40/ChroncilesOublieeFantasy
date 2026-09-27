<?php

namespace App\Tests\Api;

use App\Entity\Comment;
use App\Entity\HomebrewEntry;
use App\Entity\User;

/**
 * Contrôle d'accès sur les commentaires :
 *  - poster exige d'être connecté ; l'auteur et l'horodatage sont posés par le serveur
 *    (CommentStateProcessor), jamais fournis par le client ;
 *  - contrairement à Favorite, commenter son propre contenu est permis (répondre à ses
 *    propres commentateurs est un usage normal) ;
 *  - la visibilité suit celle de la cible, pas un droit propre au commentaire : un
 *    commentaire sur une fiche publique se lit sans compte, un commentaire sur une fiche
 *    privée n'est visible que par son propriétaire — même en collection, filtrée par
 *    CurrentUserExtension via une sous-requête sur la cible (pas de relation Doctrine) ;
 *  - supprimer est réservé à l'auteur du commentaire ou à un admin (pas au propriétaire de
 *    la cible commentée : modération encore non tranchée, cf. ROLE_MODERATOR en kanban).
 */
final class CommentSecurityTest extends ApiSecurityTestCase
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

    private function makeComment(User $author, string $targetType, int $targetId, string $content = 'Un commentaire.'): Comment
    {
        $c = new Comment();
        $c->setAuthor($author);
        $c->setTargetType($targetType);
        $c->setTargetId($targetId);
        $c->setContent($content);
        $c->setCreatedAt(new \DateTimeImmutable());
        $this->em->persist($c);
        $this->em->flush();

        return $c;
    }

    public function testCreateRequiresAuthentication(): void
    {
        $this->client->request('POST', '/api/comments', [
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => 1, 'content' => 'Bravo !'],
        ]);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testCanCommentOnSomeoneElsesPublicEntry(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');

        $this->client->request('POST', '/api/comments', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId(), 'content' => 'Bravo !'],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['targetType' => 'homebrew_entry', 'targetId' => $entry->getId(), 'content' => 'Bravo !', 'authorId' => $alice->getId()]);
    }

    public function testCreateIgnoresClientProvidedAuthor(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');

        $this->client->request('POST', '/api/comments', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId(), 'content' => 'Bravo !', 'author' => '/api/users/'.$bob->getId()],
        ]);

        $this->em->clear();
        $comment = $this->em->getRepository(Comment::class)->findOneBy(['targetId' => $entry->getId()]);
        $this->assertSame($alice->getId(), $comment->getAuthor()->getId());
    }

    public function testCanCommentOnOwnContent(): void
    {
        $alice = $this->createUser('alice@example.com');
        $entry = $this->makeEntry($alice);

        $this->client->request('POST', '/api/comments', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId(), 'content' => 'Merci !'],
        ]);
        $this->assertResponseStatusCodeSame(201);
    }

    public function testCommentingOnUnknownTargetIsRejected(): void
    {
        $alice = $this->createUser('alice@example.com');

        $this->client->request('POST', '/api/comments', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => 999999, 'content' => 'Bravo !'],
        ]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCommentingOnSomeoneElsesPrivateEntryIsRejected(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'private');
        $alice = $this->createUser('alice@example.com');

        $this->client->request('POST', '/api/comments', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId(), 'content' => 'Bravo !'],
        ]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testUnknownAndPrivateTargetsAreRejectedWithTheSameBody(): void
    {
        // La propriété de sécurité revendiquée par Comment (cf. son docblock) est que
        // « cible introuvable » et « cible privée d'autrui » ne se distinguent PAS : sans
        // ça, la réponse elle-même révélerait qu'un contenu privé existe à cet id.
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'private');
        $alice = $this->createUser('alice@example.com');

        $unknown = $this->client->request('POST', '/api/comments', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => 999999, 'content' => 'Bravo !'],
        ]);
        $unknownBody = json_decode($unknown->getContent(false), true);

        $private = $this->client->request('POST', '/api/comments', [
            'headers' => $this->authHeaders($alice),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => $entry->getId(), 'content' => 'Bravo !'],
        ]);
        $privateBody = json_decode($private->getContent(false), true);

        $this->assertSame(404, $unknown->getStatusCode());
        $this->assertSame(404, $private->getStatusCode());
        // `trace` (chemin/ligne d'appel du processor) diffère forcément d'un appel à
        // l'autre en mode debug — ce n'est pas ce que revendique la propriété de sécurité.
        // Ce qui doit être strictement identique, c'est ce qu'un client voit réellement :
        // titre, détail, statut, type.
        foreach (['title', 'detail', 'status', 'type', 'description'] as $field) {
            $this->assertSame($unknownBody[$field] ?? null, $privateBody[$field] ?? null, "champ « $field »");
        }
    }

    public function testAnonymousCanReadCommentsOnPublicEntry(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'public');
        $this->makeComment($bob, 'homebrew_entry', $entry->getId());

        $response = $this->client->request('GET', '/api/comments?targetType=homebrew_entry&targetId='.$entry->getId());
        $this->assertResponseStatusCodeSame(200);
        $body = $response->toArray();
        $this->assertCount(1, $body['member'] ?? $body['hydra:member']);
    }

    public function testAnonymousCannotSeeCommentsOnPrivateEntry(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'private');
        $this->makeComment($bob, 'homebrew_entry', $entry->getId());

        $response = $this->client->request('GET', '/api/comments?targetType=homebrew_entry&targetId='.$entry->getId());
        $this->assertResponseStatusCodeSame(200);
        $body = $response->toArray();
        $this->assertCount(0, $body['member'] ?? $body['hydra:member']);
    }

    public function testCannotReadCommentOnSomeoneElsesPrivateEntry(): void
    {
        // Scoped out of the query by CurrentUserExtension -> not found (404), même
        // convention que CustomCreatureSecurityTest::testNonOwnerCannotReadCustomCreature.
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob, 'private');
        $comment = $this->makeComment($bob, 'homebrew_entry', $entry->getId());
        $alice = $this->createUser('alice@example.com');

        $this->client->request('GET', '/api/comments/'.$comment->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(404);
    }

    public function testAuthorCanDeleteOwnComment(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');
        $comment = $this->makeComment($alice, 'homebrew_entry', $entry->getId());

        $this->client->request('DELETE', '/api/comments/'.$comment->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);
    }

    public function testCannotDeleteSomeoneElsesComment(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');
        $comment = $this->makeComment($alice, 'homebrew_entry', $entry->getId());
        $eve = $this->createUser('eve@example.com');

        $this->client->request('DELETE', '/api/comments/'.$comment->getId(), ['headers' => $this->authHeaders($eve)]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdminCanDeleteAnyComment(): void
    {
        $bob = $this->createUser('bob@example.com');
        $entry = $this->makeEntry($bob);
        $alice = $this->createUser('alice@example.com');
        $comment = $this->makeComment($alice, 'homebrew_entry', $entry->getId());
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);

        $this->client->request('DELETE', '/api/comments/'.$comment->getId(), ['headers' => $this->authHeaders($admin)]);
        $this->assertResponseStatusCodeSame(204);
    }
}
