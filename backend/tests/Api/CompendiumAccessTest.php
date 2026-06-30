<?php

namespace App\Tests\Api;

/**
 * The game compendium must stay publicly readable without authentication.
 */
final class CompendiumAccessTest extends ApiSecurityTestCase
{
    public function testRacesArePublic(): void
    {
        $this->client->request('GET', '/api/races');
        $this->assertResponseStatusCodeSame(200);
    }

    public function testCreaturesArePublic(): void
    {
        $this->client->request('GET', '/api/creatures');
        $this->assertResponseStatusCodeSame(200);
    }

    public function testCapabilitiesArePublic(): void
    {
        $this->client->request('GET', '/api/capabilities');
        $this->assertResponseStatusCodeSame(200);
    }
}
