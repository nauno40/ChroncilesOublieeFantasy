<?php

namespace App\Tests\Api;

/**
 * Regression guard: Clue and Session (like Quest) belong to private campaigns and
 * must not be listable without authentication. They share Quest's access rules;
 * this locks the authentication requirement that closes the public-read leak.
 */
final class CampaignSubResourceLeakTest extends ApiSecurityTestCase
{
    public function testCluesListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/clues');
        $this->assertResponseStatusCodeSame(401);
    }

    public function testSessionsListRequiresAuthentication(): void
    {
        $this->client->request('GET', '/api/sessions');
        $this->assertResponseStatusCodeSame(401);
    }
}
