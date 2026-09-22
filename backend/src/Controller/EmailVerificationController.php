<?php

namespace App\Controller;

use App\Entity\EmailVerificationToken;
use App\Repository\EmailVerificationTokenRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Confirmation d'adresse e-mail (flux jeton) et renvoi du lien, hors API Platform —
 * même construction que PasswordResetController.
 */
class EmailVerificationController extends AbstractController
{
    private const TOKEN_TTL = '+24 hours';

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $users,
        private readonly EmailVerificationTokenRepository $tokens,
        private readonly MailerInterface $mailer,
        #[Autowire('%env(FRONTEND_URL)%')] private readonly string $frontendUrl,
        #[Autowire('%env(MAILER_FROM)%')] private readonly string $mailerFrom,
    ) {
    }

    #[Route('/api/verify-email', name: 'api_verify_email', methods: ['POST'])]
    public function verify(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $rawToken = (string) ($data['token'] ?? '');

        if ($rawToken === '') {
            return new JsonResponse(['message' => 'Lien de confirmation invalide.'], 400);
        }

        $token = $this->tokens->findOneByHashedToken(hash('sha256', $rawToken));
        if (!$token || $token->isExpired()) {
            if ($token) {
                $this->em->remove($token);
                $this->em->flush();
            }

            return new JsonResponse(['message' => 'Ce lien de confirmation est invalide ou expiré.'], 400);
        }

        $user = $token->getUser();
        $user->setVerified(true);
        $this->tokens->removeForUser($user); // consomme le jeton
        $this->em->flush();

        return new JsonResponse(['message' => 'Votre adresse e-mail est confirmée. Vous pouvez vous connecter.']);
    }

    #[Route('/api/resend-verification', name: 'api_resend_verification', methods: ['POST'])]
    public function resend(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $email = trim((string) ($data['email'] ?? ''));

        // Réponse neutre systématique : ne révèle pas si l'adresse a un compte,
        // ni si ce compte est déjà confirmé (même logique que forgot-password).
        $neutral = new JsonResponse([
            'message' => 'Si un compte existe et attend confirmation, un e-mail vient d\'être envoyé.',
        ]);

        if ($email === '') {
            return $neutral;
        }

        $user = $this->users->findOneBy(['email' => $email]);
        if (!$user || $user->isVerified()) {
            return $neutral;
        }

        $this->tokens->removeForUser($user);

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
                "Bonjour,\n\nConfirmez votre adresse e-mail en cliquant sur le lien suivant ".
                "(valable 24 heures) :\n\n$link\n\n".
                "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail."
            )
            ->html(
                '<p>Bonjour,</p><p>Confirmez votre adresse e-mail en cliquant sur ce lien '.
                '(valable 24 heures) :</p>'.
                '<p><a href="'.$link.'">Confirmer mon adresse e-mail</a></p>'.
                "<p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>"
            );
        $this->mailer->send($message);

        return $neutral;
    }
}
