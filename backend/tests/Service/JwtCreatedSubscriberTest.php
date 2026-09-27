<?php

namespace App\Tests\Service;

use App\Entity\User;
use App\EventSubscriber\JwtCreatedSubscriber;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\User\InMemoryUser;

/**
 * Le front décode le JWT lui-même pour peupler `user.id` (AuthService.ts,
 * `decodeUserFromToken`) sans requête supplémentaire — si ce claim manquait ou valait 0,
 * tous les contrôles « mine » du site (OwnerBar, etc.) se casseraient silencieusement.
 */
final class JwtCreatedSubscriberTest extends TestCase
{
    public function testAjouteLIdDeLUtilisateurAuPayload(): void
    {
        $user = new User();
        $user->setEmail('alice@example.com');
        (new \ReflectionProperty(User::class, 'id'))->setValue($user, 42);

        $event = new JWTCreatedEvent(['username' => 'alice@example.com', 'roles' => ['ROLE_USER']], $user);
        (new JwtCreatedSubscriber())->onJwtCreated($event);

        $this->assertSame(42, $event->getData()['id']);
    }

    public function testNAjouteRienPourUnUtilisateurQuiNestPasNotreEntite(): void
    {
        // Lexik peut en théorie être utilisé avec un autre UserInterface (comptes de
        // service, etc.) : pas d'id à extraire, le subscriber ne doit rien casser.
        $event = new JWTCreatedEvent(['username' => 'service'], new InMemoryUser('service', null));
        (new JwtCreatedSubscriber())->onJwtCreated($event);

        $this->assertArrayNotHasKey('id', $event->getData());
    }
}
