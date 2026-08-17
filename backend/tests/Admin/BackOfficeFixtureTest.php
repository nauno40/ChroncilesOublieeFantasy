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

        // Les clés sont le contrat porteur : les tâches suivantes appellent le jeu d'essai
        // par ces noms exacts. Un simple assertCount laisserait passer un renommage de clé
        // (ex. « creature-voie » → « creature_voie ») et ferait échouer une tâche suivante
        // loin de la cause ; on fige donc l'ensemble des noms, pas seulement leur nombre.
        $expectedKeys = [
            'race', 'family', 'profile', 'voie', 'capability',
            'creature-family', 'creature', 'creature-voie',
            'equipment', 'material', 'food', 'lodging', 'mount',
            'state', 'poison', 'trap',
            'campaign', 'quest', 'clue', 'session', 'encounter', 'membership',
            'character', 'character-voie',
            'homebrew', 'custom-creature',
        ];
        self::assertEqualsCanonicalizing(
            $expectedKeys,
            array_keys($entities),
            'Les clés du jeu d\'essai sont un contrat : les tâches suivantes les appellent par nom ; un renommage doit faire échouer ce test.'
        );

        foreach ($entities as $key => $entity) {
            self::assertNotNull($entity->getId(), sprintf('L\'entité « %s » doit être persistée.', $key));
        }
    }
}
