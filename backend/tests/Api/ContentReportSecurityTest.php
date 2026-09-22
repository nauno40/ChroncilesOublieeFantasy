<?php

namespace App\Tests\Api;

use App\Entity\ContentReport;
use App\Entity\User;

/**
 * Contrôle d'accès sur le signalement de contenu communautaire :
 *  - poster un signalement exige d'être connecté ; le déclarant, le statut et
 *    l'horodatage sont posés par le serveur (ContentReportStateProcessor), jamais
 *    fournis par le client ;
 *  - lister/consulter/traiter/supprimer un signalement est réservé à ROLE_ADMIN — aucun
 *    rôle modérateur distinct pour l'instant (question produit encore ouverte).
 */
final class ContentReportSecurityTest extends ApiSecurityTestCase
{
    private function createReport(User $reporter, string $status = 'pending'): ContentReport
    {
        $report = new ContentReport();
        $report->setReporter($reporter);
        $report->setTargetType('homebrew_entry');
        $report->setTargetId(1);
        $report->setReason('Contenu hors charte');
        $report->setStatus($status);
        $report->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($report);
        $this->em->flush();

        return $report;
    }

    public function testCreateRequiresAuthentication(): void
    {
        $this->client->request('POST', '/api/content_reports', [
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => 1, 'reason' => 'Spam'],
        ]);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testAnyLoggedInUserCanReport(): void
    {
        $user = $this->createUser('joueur@example.com');

        $this->client->request('POST', '/api/content_reports', [
            'headers' => $this->authHeaders($user),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => 42, 'reason' => 'Description injurieuse'],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains([
            'reporter' => '/api/users/'.$user->getId(),
            'status' => 'pending',
        ]);
    }

    public function testCreateIgnoresClientProvidedReporterAndStatus(): void
    {
        $user = $this->createUser('joueur@example.com');
        $other = $this->createUser('autre@example.com');

        $this->client->request('POST', '/api/content_reports', [
            'headers' => $this->authHeaders($user),
            'json' => [
                'targetType' => 'custom_creature',
                'targetId' => 7,
                'reason' => 'Statistiques absurdes',
                'reporter' => '/api/users/'.$other->getId(),
                'status' => 'resolved',
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        // Le déclarant reste l'auteur réel de la requête, et un signalement naît toujours pending.
        $this->assertJsonContains([
            'reporter' => '/api/users/'.$user->getId(),
            'status' => 'pending',
        ]);
    }

    public function testCreateRejectsUnknownTargetType(): void
    {
        $user = $this->createUser('joueur@example.com');

        $this->client->request('POST', '/api/content_reports', [
            'headers' => $this->authHeaders($user),
            'json' => ['targetType' => 'creature', 'targetId' => 1, 'reason' => 'Motif'],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testCreateRejectsBlankReason(): void
    {
        $user = $this->createUser('joueur@example.com');

        $this->client->request('POST', '/api/content_reports', [
            'headers' => $this->authHeaders($user),
            'json' => ['targetType' => 'homebrew_entry', 'targetId' => 1, 'reason' => ''],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testListIsForbiddenForRegularUser(): void
    {
        $user = $this->createUser('joueur@example.com');

        $this->client->request('GET', '/api/content_reports', ['headers' => $this->authHeaders($user)]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testListIsAllowedForAdmin(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $reporter = $this->createUser('joueur@example.com');
        $this->createReport($reporter);

        $this->client->request('GET', '/api/content_reports', ['headers' => $this->authHeaders($admin)]);
        $this->assertResponseStatusCodeSame(200);
    }

    public function testRegularUserCannotReadSomeoneElsesReport(): void
    {
        $reporter = $this->createUser('joueur@example.com');
        $report = $this->createReport($reporter);
        $other = $this->createUser('autre@example.com');

        // Même le déclarant n'a pas de droit de lecture dédié : la consultation d'un
        // signalement est un geste de modération, réservé à ROLE_ADMIN.
        $this->client->request('GET', '/api/content_reports/'.$report->getId(), ['headers' => $this->authHeaders($other)]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdminResolvingAReportStampsResolverAndTimestamp(): void
    {
        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $reporter = $this->createUser('joueur@example.com');
        $report = $this->createReport($reporter);

        $this->client->request('PATCH', '/api/content_reports/'.$report->getId(), [
            'headers' => $this->authHeaders($admin) + ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['status' => 'resolved'],
        ]);

        $this->assertResponseStatusCodeSame(200);
        $this->assertJsonContains([
            'status' => 'resolved',
            'resolvedBy' => '/api/users/'.$admin->getId(),
        ]);

        $this->em->clear();
        $fresh = $this->em->getRepository(ContentReport::class)->find($report->getId());
        $this->assertNotNull($fresh->getResolvedAt());
    }

    public function testRegularUserCannotResolveAReport(): void
    {
        $reporter = $this->createUser('joueur@example.com');
        $report = $this->createReport($reporter);

        $this->client->request('PATCH', '/api/content_reports/'.$report->getId(), [
            'headers' => $this->authHeaders($reporter) + ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['status' => 'dismissed'],
        ]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testDeleteIsRestrictedToAdmin(): void
    {
        $reporter = $this->createUser('joueur@example.com');
        $report = $this->createReport($reporter);

        $this->client->request('DELETE', '/api/content_reports/'.$report->getId(), ['headers' => $this->authHeaders($reporter)]);
        $this->assertResponseStatusCodeSame(403);

        $admin = $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $this->client->request('DELETE', '/api/content_reports/'.$report->getId(), ['headers' => $this->authHeaders($admin)]);
        $this->assertResponseStatusCodeSame(204);
    }
}
