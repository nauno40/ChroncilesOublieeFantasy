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
use Symfony\Component\DependencyInjection\Attribute\Autowire;
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
        #[Autowire('%kernel.environment%')] private readonly string $appEnv = 'dev',
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('email', null, InputOption::VALUE_REQUIRED, 'Email du compte de test', 'test@test.com')
            ->addOption('password', null, InputOption::VALUE_REQUIRED, 'Mot de passe en clair', 'password')
            ->addOption('role', null, InputOption::VALUE_REQUIRED, 'Rôle principal', 'ROLE_ADMIN')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Autorise l\'exécution en APP_ENV=prod');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        // `docker/dev-entrypoint.sh` n'appelle cette commande qu'en APP_ENV=dev, mais rien
        // n'empêchait jusqu'ici un `bin/console app:create-test-user` manuel en production
        // de semer un compte ROLE_ADMIN à mot de passe connu (par défaut test@test.com/password).
        if ('prod' === $this->appEnv && !$input->getOption('force')) {
            $io->error(
                'Commande refusée en APP_ENV=prod (créerait un compte à mot de passe connu). '.
                'Repassez avec --force si c\'est réellement voulu.'
            );

            return Command::FAILURE;
        }

        $email = (string) $input->getOption('email');
        $plainPassword = (string) $input->getOption('password');
        $role = (string) $input->getOption('role');

        $existing = $this->userRepository->findOneBy(['email' => $email]);
        $user = $existing ?? new User();

        $user->setEmail($email);
        $user->setRoles([$role]);
        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));
        $user->setVerified(true);

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
