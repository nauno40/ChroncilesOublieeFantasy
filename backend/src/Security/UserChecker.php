<?php

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Bloque la connexion d'un compte dont l'adresse e-mail n'a pas encore été confirmée.
 *
 * Vérifié en `checkPostAuth` (après validation du mot de passe), pas en `checkPreAuth` :
 * sinon la réponse distinguerait « mauvais mot de passe » de « compte non confirmé » avant
 * même d'avoir vérifié le mot de passe, ce qui confirmerait l'existence du compte à un
 * attaquant qui ne connaît pas encore le mot de passe.
 */
final class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
    }

    public function checkPostAuth(UserInterface $user): void
    {
        if ($user instanceof User && !$user->isVerified()) {
            throw new CustomUserMessageAccountStatusException(
                'Confirmez votre adresse e-mail avant de vous connecter — vérifiez votre boîte de réception.'
            );
        }
    }
}
