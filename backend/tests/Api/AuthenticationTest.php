<?php

namespace App\Tests\Api;

use App\Entity\User;

/**
 * Registration + JWT login round-trip, and the password hashing done by
 * UserPasswordHasher on write.
 */
final class AuthenticationTest extends ApiSecurityTestCase
{
    public function testRegisteredUserCanLogIn(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123'],
        ]);
        $this->assertResponseStatusCodeSame(201);

        $response = $this->client->request('POST', '/api/login_check', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123'],
        ]);
        $this->assertResponseIsSuccessful();
        $this->assertArrayHasKey('token', $response->toArray());
    }

    public function testLoginWithWrongPasswordFails(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123'],
        ]);

        $this->client->request('POST', '/api/login_check', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'wrong-password'],
        ]);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testPasswordIsHashedOnRegistration(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123'],
        ]);
        $this->assertResponseStatusCodeSame(201);

        $this->em->clear();
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => 'newcomer@example.com']);

        $this->assertNotNull($user);
        $this->assertNotSame('secret123', $user->getPassword(), 'The raw password must not be stored.');
    }
}
