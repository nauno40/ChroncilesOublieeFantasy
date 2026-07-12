<?php

namespace App\EventSubscriber;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * Ajoute l'identifiant de l'utilisateur au payload du JWT, en plus des
 * `username` (e-mail) et `roles` par défaut de LexikJWT. Le front peut ainsi
 * peupler `user.id` en décodant simplement le jeton, sans requête supplémentaire.
 */
class JwtCreatedSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return ['lexik_jwt_authentication.on_jwt_created' => 'onJwtCreated'];
    }

    public function onJwtCreated(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $payload = $event->getData();
        $payload['id'] = $user->getId();
        $event->setData($payload);
    }
}
