<?php

namespace App\Tests\Api;

/**
 * Génération et régénération du code d'invitation, puis rejoindre par code.
 */
final class InviteAndJoinTest extends ApiSecurityTestCase
{
    public function testCampaignGetsInviteCodeOnCreate(): void
    {
        $mj = $this->createUser('mj@example.com');

        $response = $this->client->request('POST', '/api/campaigns', [
            'headers' => $this->authHeaders($mj),
            'json' => ['name' => 'Osgild'],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $data = $response->toArray();
        $this->assertArrayHasKey('inviteCode', $data);
        $this->assertNotEmpty($data['inviteCode']);
    }
}
