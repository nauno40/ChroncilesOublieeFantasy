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

    public function testOwnerCanRegenerateInviteCode(): void
    {
        $mj = $this->createUser('mj@example.com');
        $campaign = $this->createCampaign($mj);
        $campaign->setInviteCode('OLDCODE1');
        $this->em->flush();

        $response = $this->client->request('POST', '/api/campaigns/'.$campaign->getId().'/regenerate_invite', [
            'headers' => $this->authHeaders($mj),
            'json' => [],
        ]);
        $this->assertResponseStatusCodeSame(200);
        $this->assertNotSame('OLDCODE1', $response->toArray()['inviteCode']);
    }

    public function testNonOwnerCannotRegenerate(): void
    {
        $mj = $this->createUser('mj@example.com');
        $intrus = $this->createUser('intrus@example.com');
        $campaign = $this->createCampaign($mj);

        $this->client->request('POST', '/api/campaigns/'.$campaign->getId().'/regenerate_invite', [
            'headers' => $this->authHeaders($intrus),
            'json' => [],
        ]);
        // Le non-propriétaire est refusé par l'expression de sécurité : la campagne est
        // scopée hors de sa requête par CurrentUserExtension, donc l'objet lu vaut null ;
        // l'expression "object != null and object.getOwner() == user" échoue alors sur le
        // premier terme et refuse l'accès. Un POST item-op ne peut pas proprement renvoyer
        // 404 ici (API Platform ne 404 pas sur un $data null pour les opérations POST),
        // d'où l'attente de 403 plutôt que 404.
        $this->assertResponseStatusCodeSame(403);
    }
}
