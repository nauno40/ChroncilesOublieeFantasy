<?php

namespace App\Tests\Admin;

use App\Entity\ContentReport;
use App\Entity\User;
use App\Tests\Api\ApiSecurityTestCase;

/**
 * Section back-office des signalements : ni « famille A » (pas de création, pas d'édition
 * libre) ni « famille B/C » (l'administrateur peut faire évoluer le statut) — un troisième
 * comportement, couvert ici plutôt que dans les listes figées de BackOfficeSecurityTest.
 */
final class ContentReportAdminTest extends ApiSecurityTestCase
{
    private function createReport(User $reporter): ContentReport
    {
        $report = new ContentReport();
        $report->setReporter($reporter);
        $report->setTargetType('homebrew_entry');
        $report->setTargetId(1);
        $report->setReason('Contenu hors charte');
        $report->setStatus('pending');
        $report->setCreatedAt(new \DateTimeImmutable());

        $this->em->persist($report);
        $this->em->flush();

        return $report;
    }

    private ?User $admin = null;

    private function requestAsAdmin(string $method, string $path, array $options = []): void
    {
        // Mémoïsé : un test peut appeler ce helper plusieurs fois (index puis détail), et
        // recréer l'admin à chaque appel violerait l'unicité de l'e-mail.
        $this->admin ??= $this->createUser('admin@example.com', ['ROLE_ADMIN']);
        $this->client->request($method, $path, $options + ['auth_basic' => ['admin@example.com', 'password']]);
    }

    public function testRegularUserIsDeniedTheSection(): void
    {
        $this->createUser('player@example.com');
        $this->client->request('GET', '/admin/content-report', ['auth_basic' => ['player@example.com', 'password']]);
        $this->assertResponseStatusCodeSame(403);
    }

    public function testAdminReadsIndexAndDetail(): void
    {
        $reporter = $this->createUser('joueur@example.com');
        $report = $this->createReport($reporter);

        $this->requestAsAdmin('GET', '/admin/content-report');
        $this->assertResponseIsSuccessful();

        $this->requestAsAdmin('GET', '/admin/content-report/'.$report->getId());
        $this->assertResponseIsSuccessful();
    }

    public function testCreationRouteIsClosed(): void
    {
        $this->requestAsAdmin('GET', '/admin/content-report/new');
        $this->assertResponseStatusCodeSame(403);
    }

    public function testEditFormRendersAndChangesOnlyStatus(): void
    {
        $reporter = $this->createUser('joueur@example.com');
        $report = $this->createReport($reporter);

        $this->requestAsAdmin('GET', '/admin/content-report/'.$report->getId().'/edit');
        $this->assertResponseIsSuccessful();
    }
}
