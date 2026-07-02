<?php

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-test-user',
    description: 'Crée ou actualise un utilisateur de test (dev). Idempotent.',
)]
final class CreateTestUserCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly UserRepository $userRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('email', null, InputOption::VALUE_REQUIRED, 'Email du compte de test', 'test@test.com')
            ->addOption('password', null, InputOption::VALUE_REQUIRED, 'Mot de passe en clair', 'password')
            ->addOption('role', null, InputOption::VALUE_REQUIRED, 'Rôle principal', 'ROLE_ADMIN');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email = (string) $input->getOption('email');
        $plainPassword = (string) $input->getOption('password');
        $role = (string) $input->getOption('role');

        $existing = $this->userRepository->findOneBy(['email' => $email]);
        $user = $existing ?? new User();

        $user->setEmail($email);
        $user->setRoles([$role]);
        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));

        $this->em->persist($user);
        $this->em->flush();

        $io->success(sprintf(
            'Utilisateur de test %s : %s (%s / mot de passe: %s)',
            $existing ? 'mis à jour' : 'créé',
            $email,
            $role,
            $plainPassword,
        ));

        return Command::SUCCESS;
    }
}
