<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\EmailVerificationToken;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final readonly class UserPasswordHasher implements ProcessorInterface
{
    private const TOKEN_TTL = '+24 hours';

    public function __construct(
        private ProcessorInterface $persistProcessor,
        private UserPasswordHasherInterface $passwordHasher,
        private EntityManagerInterface $em,
        private MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')] private string $frontendUrl,
        #[Autowire('%env(MAILER_FROM)%')] private string $mailerFrom,
        #[Autowire('%env(bool:EMAIL_VERIFICATION_REQUIRED)%')] private bool $emailVerificationRequired = true,
    ) {
    }

    /**
     * @param User $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $isRegistration = $operation instanceof Post;

        // Environnement où la confirmation est désactivée (dev/e2e — Playwright crée des
        // dizaines de comptes et attend une connexion immédiate) : le compte démarre déjà
        // vérifié, pas d'e-mail envoyé. `UserChecker` continue d'appliquer la même règle
        // (`isVerified()`) dans tous les environnements — seule cette valeur de départ change.
        if ($isRegistration && !$this->emailVerificationRequired) {
            $data->setVerified(true);
        }

        if ($data->getPassword()) {
            $hashedPassword = $this->passwordHasher->hashPassword(
                $data,
                $data->getPassword()
            );
            $data->setPassword($hashedPassword);
            $data->eraseCredentials();
        }

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // Seule une inscription (création) déclenche l'envoi du lien de confirmation —
        // pas une mise à jour de profil, qui repasserait par ce même processeur.
        if ($isRegistration && $this->emailVerificationRequired) {
            $this->sendVerificationEmail($data);
        }

        return $result;
    }

    private function sendVerificationEmail(User $user): void
    {
        $rawToken = bin2hex(random_bytes(32));
        $token = (new EmailVerificationToken())
            ->setUser($user)
            ->setHashedToken(hash('sha256', $rawToken))
            ->setExpiresAt(new \DateTimeImmutable(self::TOKEN_TTL));
        $this->em->persist($token);
        $this->em->flush();

        $link = rtrim($this->frontendUrl, '/').'/verify-email?token='.$rawToken;
        $message = (new Email())
            ->from($this->mailerFrom)
            ->to($user->getEmail())
            ->subject('Confirmez votre adresse e-mail — Chroniques Oubliées')
            ->text(
                "Bonjour,\n\nBienvenue sur Chroniques Oubliées ! Confirmez votre adresse e-mail ".
                "en cliquant sur le lien suivant (valable 24 heures) :\n\n$link\n\n".
                "Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail."
            )
            ->html(
                '<p>Bonjour,</p><p>Bienvenue sur Chroniques Oubliées ! Confirmez votre adresse '.
                'e-mail en cliquant sur ce lien (valable 24 heures) :</p>'.
                '<p><a href="'.$link.'">Confirmer mon adresse e-mail</a></p>'.
                "<p>Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.</p>"
            );
        $this->mailer->send($message);
    }
}
