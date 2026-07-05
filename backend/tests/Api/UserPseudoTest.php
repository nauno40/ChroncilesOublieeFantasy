<?php

namespace App\Tests\Api;

/**
 * Le pseudo est requis à l'inscription et exposé en lecture ; il ne remplace
 * pas l'email comme identifiant de connexion.
 */
final class UserPseudoTest extends ApiSecurityTestCase
{
    public function testRegistrationRequiresPseudo(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'nopseudo@example.com', 'password' => 'password'],
        ]);
        $this->assertResponseStatusCodeSame(422); // validation: pseudo manquant
    }

    public function testRegistrationStoresPseudo(): void
    {
        $response = $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'jean@example.com', 'password' => 'password', 'pseudo' => 'Jean le Rouge'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['pseudo' => 'Jean le Rouge']);
    }
}
