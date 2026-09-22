<?php

namespace App\EventSubscriber;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Limite le débit des routes qu'un inconnu peut marteler : connexion (force brute),
 * inscription (comptes en masse) et écritures du contenu communautaire (spam).
 * Fenêtre fixe par adresse IP et par règle, compteur dans le cache applicatif.
 *
 * Derrière nginx, `Request::getClientIp()` ne voit l'IP réelle qu'une fois `trusted_proxies`
 * configuré en production ; sans cela tous les visiteurs partagent l'IP du proxy et la
 * limite s'applique à eux tous ensemble.
 */
final class RateLimitSubscriber implements EventSubscriberInterface
{
    private const RULES = [
        'login' => ['path' => '#^/api/login_check$#', 'methods' => ['POST'], 'limit' => 10, 'window' => 60],
        'register' => ['path' => '#^/api/users$#', 'methods' => ['POST'], 'limit' => 5, 'window' => 600],
        'community_write' => [
            'path' => '#^/api/(homebrew_entries|custom_creatures)(/|$)#',
            'methods' => ['POST', 'PUT', 'PATCH', 'DELETE'],
            'limit' => 60,
            'window' => 60,
        ],
        'email_verification' => [
            'path' => '#^/api/(verify-email|resend-verification)$#',
            'methods' => ['POST'],
            'limit' => 5,
            'window' => 600,
        ],
    ];

    public function __construct(
        private readonly CacheItemPoolInterface $cache,
        private readonly bool $enabled = true,
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::REQUEST => ['onRequest', 32]];
    }

    public function onRequest(RequestEvent $event): void
    {
        if (!$this->enabled || !$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $name = $this->matchRule($request);
        if (null === $name) {
            return;
        }

        $rule = self::RULES[$name];
        $item = $this->cache->getItem(sprintf('rate_limit.%s.%s', $name, md5((string) $request->getClientIp())));
        $hits = $item->isHit() ? $item->get() : ['count' => 0, 'reset' => time() + $rule['window']];

        if ($hits['reset'] <= time()) {
            $hits = ['count' => 0, 'reset' => time() + $rule['window']];
        }

        ++$hits['count'];
        $item->set($hits)->expiresAt(new \DateTimeImmutable('@'.$hits['reset']));
        $this->cache->save($item);

        if ($hits['count'] > $rule['limit']) {
            $retryAfter = max(1, $hits['reset'] - time());
            $event->setResponse(new JsonResponse(
                ['message' => 'Trop de requêtes, réessayez plus tard.'],
                429,
                ['Retry-After' => (string) $retryAfter],
            ));
        }
    }

    private function matchRule(Request $request): ?string
    {
        foreach (self::RULES as $name => $rule) {
            if (\in_array($request->getMethod(), $rule['methods'], true) && 1 === preg_match($rule['path'], $request->getPathInfo())) {
                return $name;
            }
        }

        return null;
    }
}
