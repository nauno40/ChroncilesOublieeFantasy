<?php

namespace App\Tests\Admin;

use App\Tests\Api\ApiSecurityTestCase;

/**
 * Le jeu d'essai du back-office doit produire une ligne de chaque entité : c'est ce qui
 * fait que les listes déroulantes des formulaires ont quelque chose à convertir en chaîne.
 */
final class BackOfficeFixtureTest extends ApiSecurityTestCase
{
    public function testSeedsOneRowPerEntity(): void
    {
        $owner = $this->createUser('mj@example.com');

        $entities = BackOfficeFixture::seed($this->em, $owner);

        self::assertCount(26, $entities);
        foreach ($entities as $key => $entity) {
            self::assertNotNull($entity->getId(), sprintf('L\'entité « %s » doit être persistée.', $key));
        }
    }
}
