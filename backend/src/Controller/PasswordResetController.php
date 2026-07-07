<?php

namespace App\Controller;

use App\Entity\PasswordResetToken;
use App\Repository\PasswordResetTokenRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Réinitialisation de mot de passe (flux e-mail + jeton), hors API Platform.
 * Endpoints publics : demande (forgot) puis réinitialisation (reset).
 */
class PasswordResetController extends AbstractController
{
    private const TOKEN_TTL = '+1 hour';
    private const MIN_PASSWORD = 6;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $users,
        private readonly PasswordResetTokenRepository $tokens,
        private readonly UserPasswordHasherInterface $hasher,
        private readonly MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')] private readonly string $frontendUrl,
        #[Autowire('%env(MAILER_FROM)%')] private readonly string $mailerFrom,
    ) {
    }

    #[Route('/api/forgot-password', name: 'api_forgot_password', methods: ['POST'])]
    public function forgot(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $email = trim((string) ($data['email'] ?? ''));

        // Réponse neutre systématique : ne révèle pas si l'adresse a un compte.
        $neutral = new JsonResponse([
            'message' => 'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d\'être envoyé.',
        ]);

        if ($email === '') {
            return $neutral;
        }

        $user = $this->users->findOneBy(['email' => $email]);
        if (!$user) {
            return $neutral;
        }

        // Un seul jeton actif par utilisateur.
        $this->tokens->removeForUser($user);

        $rawToken = bin2hex(random_bytes(32));
        $token = (new PasswordResetToken())
            ->setUser($user)
            ->setHashedToken(hash('sha256', $rawToken))
            ->setExpiresAt(new \DateTimeImmutable(self::TOKEN_TTL));
        $this->em->persist($token);
        $this->em->flush();

        $link = rtrim($this->frontendUrl, '/').'/reset-password?token='.$rawToken;
        $message = (new Email())
            ->from($this->mailerFrom)
            ->to($user->getEmail())
            ->subject('Réinitialisation de votre mot de passe — Chroniques Oubliées')
            ->text(
                "Bonjour,\n\nVous avez demandé à réinitialiser votre mot de passe.\n".
                "Cliquez sur le lien suivant (valable 1 heure) :\n\n$link\n\n".
                "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
            )
            ->html(
                '<p>Bonjour,</p><p>Vous avez demandé à réinitialiser votre mot de passe. '.
                'Ce lien est valable 1 heure :</p>'.
                '<p><a href="'.$link.'">Réinitialiser mon mot de passe</a></p>'.
                "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>"
            );
        $this->mailer->send($message);

        return $neutral;
    }

    #[Route('/api/reset-password', name: 'api_reset_password', methods: ['POST'])]
    public function reset(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $rawToken = (string) ($data['token'] ?? '');
        $password = (string) ($data['password'] ?? '');

        if (mb_strlen($password) < self::MIN_PASSWORD) {
            return new JsonResponse(['message' => 'Le mot de passe doit contenir au moins '.self::MIN_PASSWORD.' caractères.'], 400);
        }
        if ($rawToken === '') {
            return new JsonResponse(['message' => 'Lien de réinitialisation invalide.'], 400);
        }

        $token = $this->tokens->findOneByHashedToken(hash('sha256', $rawToken));
        if (!$token || $token->isExpired()) {
            if ($token) {
                $this->em->remove($token);
                $this->em->flush();
            }

            return new JsonResponse(['message' => 'Ce lien de réinitialisation est invalide ou expiré.'], 400);
        }

        $user = $token->getUser();
        $user->setPassword($this->hasher->hashPassword($user, $password));
        $this->tokens->removeForUser($user); // consomme le jeton
        $this->em->flush();

        return new JsonResponse(['message' => 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.']);
    }
}
