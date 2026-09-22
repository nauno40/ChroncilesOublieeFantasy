<?php

namespace App\Tests\Command;

use App\Command\CreateTestUserCommand;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Application;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Pare-feu APP_ENV=prod de la commande : `docker/dev-entrypoint.sh` ne l'appelle qu'en dev,
 * mais rien n'empêchait un `bin/console app:create-test-user` manuel en production de semer
 * un compte ROLE_ADMIN à mot de passe connu (test@test.com/password par défaut).
 */
final class CreateTestUserCommandTest extends TestCase
{
    private function tester(string $appEnv): CommandTester
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('persist');
        $em->expects($this->never())->method('flush');

        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $users = $this->createStub(UserRepository::class);

        $command = new CreateTestUserCommand($em, $hasher, $users, $appEnv);
        $application = new Application();
        $application->addCommand($command);

        return new CommandTester($application->find('app:create-test-user'));
    }

    public function testRefuseEnProductionSansForce(): void
    {
        $tester = $this->tester('prod');

        $this->assertSame(Command::FAILURE, $tester->execute([]));
        $this->assertStringContainsString('refusée', $tester->getDisplay());
    }

    public function testAccepteEnProductionAvecForce(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('persist');
        $em->expects($this->once())->method('flush');

        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $hasher->method('hashPassword')->willReturn('hashed');
        $users = $this->createStub(UserRepository::class);
        $users->method('findOneBy')->willReturn(null);

        $command = new CreateTestUserCommand($em, $hasher, $users, 'prod');
        $application = new Application();
        $application->addCommand($command);
        $tester = new CommandTester($application->find('app:create-test-user'));

        $this->assertSame(Command::SUCCESS, $tester->execute(['--force' => true]));
    }

    public function testAccepteEnDevSansForce(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('persist');
        $em->expects($this->once())->method('flush');

        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $hasher->method('hashPassword')->willReturn('hashed');
        $users = $this->createStub(UserRepository::class);
        $users->method('findOneBy')->willReturn(null);

        $command = new CreateTestUserCommand($em, $hasher, $users, 'dev');
        $application = new Application();
        $application->addCommand($command);
        $tester = new CommandTester($application->find('app:create-test-user'));

        $this->assertSame(Command::SUCCESS, $tester->execute([]));
    }
}
