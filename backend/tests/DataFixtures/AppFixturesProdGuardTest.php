<?php

namespace App\Tests\DataFixtures;

use App\DataFixtures\AppFixtures;
use App\Service\CapabilityEffectBuilder;
use Doctrine\Persistence\ObjectManager;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * `doctrine:fixtures:load` purge toutes les tables et sème des comptes admin à mot de
 * passe connu — acceptable en dev (données jetables), catastrophique en production.
 * `AppFixtures::load()` doit refuser de s'exécuter avant de toucher quoi que ce soit.
 */
final class AppFixturesProdGuardTest extends TestCase
{
    private function fixtures(string $appEnv): AppFixtures
    {
        return new AppFixtures(
            $this->createStub(UserPasswordHasherInterface::class),
            new CapabilityEffectBuilder(),
            $appEnv,
        );
    }

    public function testRefuseDeChargerEnProduction(): void
    {
        $manager = $this->createMock(ObjectManager::class);
        $manager->expects($this->never())->method('persist');
        $manager->expects($this->never())->method('flush');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/production/');

        $this->fixtures('prod')->load($manager);
    }
}
