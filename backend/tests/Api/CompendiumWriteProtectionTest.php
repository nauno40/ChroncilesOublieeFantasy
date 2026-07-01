<?php

namespace App\Tests\Api;

/**
 * The game compendium is publicly *readable* but must not be writable by the
 * public: create/update/delete operations are restricted to administrators.
 * Reads stay open (see CompendiumAccessTest).
 */
final class CompendiumWriteProtectionTest extends ApiSecurityTestCase
{
    public function testAnonymousCannotCreateRace(): void
    {
        $this->client->request('POST', '/api/races', [
            'json' => ['name' => 'Forbidden Race'],
        ]);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testRegularUserCannotCreateRace(): void
    {
        $user = $this->createUser('player@example.com');

        $this->client->request('POST', '/api/races', [
            'headers' => $this->authHeaders($user),
            'json' => ['name' => 'Forbidden Race'],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testRegularUserCannotDeleteRace(): void
    {
        $user = $this->createUser('player@example.com');

        // Authorization is enforced before the resource is loaded, so a
        // non-existent id still yields 403 (not 404) for a non-admin.
        $this->client->request('DELETE', '/api/races/999', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAnonymousCannotDeleteProfile(): void
    {
        $this->client->request('DELETE', '/api/profiles/999');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testAdminCanCreateCompendiumEntry(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);

        // State (HarmfulState, shortName "State") has the simplest schema.
        $this->client->request('POST', '/api/states', [
            'headers' => $this->authHeaders($admin),
            'json' => ['name' => 'Empoisonné'],
        ]);
        $this->assertResponseStatusCodeSame(201);
    }
}
