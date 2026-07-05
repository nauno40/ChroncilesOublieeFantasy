<?php

namespace App\Tests\Api;

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
}
