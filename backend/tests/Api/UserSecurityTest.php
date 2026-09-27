<?php

namespace App\Tests\Api;

use App\Entity\Campaign;
use App\Entity\Character;
use App\Entity\CustomCreature;
use App\Entity\HomebrewEntry;
use App\Entity\User;

/**
 * Access control on the User resource:
 *  - registration (POST) is public
 *  - the collection is admin-only
 *  - item operations require admin or being the user itself
 */
final class UserSecurityTest extends ApiSecurityTestCase
{
    public function testRegistrationIsPublic(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'password', 'pseudo' => 'Newcomer'],
        ]);

        $this->assertResponseStatusCodeSame(201);
    }

    public function testListUsersRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/users');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testListUsersForbiddenForRegularUser(): void
    {
        $user = $this->createUser('player@example.com');

        $this->client->request('GET', '/api/users', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testListUsersAllowedForAdmin(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);

        $this->client->request('GET', '/api/users', ['headers' => $this->authHeaders($admin)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testUserCanReadOwnRecord(): void
    {
        $user = $this->createUser('player@example.com');

        $this->client->request('GET', '/api/users/'.$user->getId(), ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testUserCannotReadAnotherRecord(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');

        // User is not scoped by CurrentUserExtension, so the object loads and the
        // `object == user` security expression denies access with a 403.
        $this->client->request('GET', '/api/users/'.$bob->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdminCanReadAnyRecord(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $player = $this->createUser('player@example.com');

        $this->client->request('GET', '/api/users/'.$player->getId(), ['headers' => $this->authHeaders($admin)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testUserCannotDeleteAnotherRecord(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');

        $this->client->request('DELETE', '/api/users/'.$bob->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testUserCannotPatchAnotherRecord(): void
    {
        $alice = $this->createUser('alice@example.com');
        $bob = $this->createUser('bob@example.com');

        $this->client->request('PATCH', '/api/users/'.$bob->getId(), [
            'headers' => $this->authHeaders($alice) + ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['email' => 'hijacked@example.com'],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    private function createCustomCreature(User $owner, string $name = 'Créature'): CustomCreature
    {
        $creature = new CustomCreature();
        $creature->setName($name);
        $creature->setNc(1);
        $creature->setHp(8);
        $creature->setDef(12);
        $creature->setInit(10);
        $creature->setOwner($owner);
        $this->em->persist($creature);
        $this->em->flush();

        return $creature;
    }

    private function createHomebrewEntry(User $owner): HomebrewEntry
    {
        $entry = new HomebrewEntry();
        $entry->setOwner($owner);
        $entry->setCategory('sort');
        $entry->setName('Sort de test');
        $entry->setCreatedAt(new \DateTimeImmutable());
        $entry->setUpdatedAt(new \DateTimeImmutable());
        $this->em->persist($entry);
        $this->em->flush();

        return $entry;
    }

    /**
     * Les quatre clés étrangères vers `user` posées sans clause ON DELETE (campaign,
     * character, custom_creature, homebrew_entry) faisaient échouer la suppression de son
     * propre compte en 500 (violation de contrainte brute) dès qu'on possédait le moindre
     * contenu — la fonctionnalité était donc en pratique cassée pour tout compte réel.
     */
    public function testUserCanDeleteOwnAccountEvenWhileOwningACampaign(): void
    {
        $alice = $this->createUser('alice@example.com');
        $campaign = $this->createCampaign($alice);

        $this->client->request('DELETE', '/api/users/'.$alice->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);

        $this->em->clear();
        $this->assertNull($this->em->getRepository(Campaign::class)->find($campaign->getId()));
    }

    public function testDeletingOwnAccountDetachesCharacterInsteadOfDeletingIt(): void
    {
        // Choix tranché avec l'utilisateur : une fiche de personnage survit, détachée
        // (owner_id à NULL — colonne déjà nullable pour les fiches « legacy »), plutôt que
        // d'être supprimée avec le compte — cohérent avec ON DELETE SET NULL déjà posé sur
        // character.campaign_id (suppression de campagne) pour la même raison.
        $alice = $this->createUser('alice@example.com');
        $character = $this->createCharacter($alice);

        $this->client->request('DELETE', '/api/users/'.$alice->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);

        $this->em->clear();
        $fresh = $this->em->getRepository(Character::class)->find($character->getId());
        $this->assertNotNull($fresh);
        $this->assertNull($fresh->getOwner());
    }

    public function testDeletingOwnAccountDeletesOwnedCustomCreatures(): void
    {
        // Choix tranché avec l'utilisateur : supprimer son compte supprime aussi son contenu
        // communautaire publié (même logique qu'un compte GitHub emporte ses dépôts non
        // transférés), plutôt que de le laisser orphelin.
        $alice = $this->createUser('alice@example.com');
        $creature = $this->createCustomCreature($alice);

        $this->client->request('DELETE', '/api/users/'.$alice->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);

        $this->em->clear();
        $this->assertNull($this->em->getRepository(CustomCreature::class)->find($creature->getId()));
    }

    public function testDeletingOwnAccountDeletesOwnedHomebrewEntries(): void
    {
        $alice = $this->createUser('alice@example.com');
        $entry = $this->createHomebrewEntry($alice);

        $this->client->request('DELETE', '/api/users/'.$alice->getId(), ['headers' => $this->authHeaders($alice)]);
        $this->assertResponseStatusCodeSame(204);

        $this->em->clear();
        $this->assertNull($this->em->getRepository(HomebrewEntry::class)->find($entry->getId()));
    }
}
