<?php

namespace App\Tests\Service;

use App\EventSubscriber\RateLimitSubscriber;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;

final class RateLimitSubscriberTest extends TestCase
{
    private function send(RateLimitSubscriber $subscriber, string $method, string $path, string $ip = '203.0.113.1'): RequestEvent
    {
        $request = Request::create($path, $method, server: ['REMOTE_ADDR' => $ip]);
        $event = new RequestEvent($this->createStub(HttpKernelInterface::class), $request, HttpKernelInterface::MAIN_REQUEST);
        $subscriber->onRequest($event);

        return $event;
    }

    public function testLaConnexionEstBloqueeApresDixEssaisParMinute(): void
    {
        $subscriber = new RateLimitSubscriber(new ArrayAdapter());

        for ($i = 1; $i <= 10; ++$i) {
            $this->assertFalse($this->send($subscriber, 'POST', '/api/login_check')->hasResponse(), "essai $i");
        }

        $bloque = $this->send($subscriber, 'POST', '/api/login_check');
        $this->assertTrue($bloque->hasResponse());
        $this->assertSame(429, $bloque->getResponse()->getStatusCode());
        $this->assertTrue($bloque->getResponse()->headers->has('Retry-After'));
    }

    public function testLInscriptionEstBloqueeApresCinqEssais(): void
    {
        $subscriber = new RateLimitSubscriber(new ArrayAdapter());

        for ($i = 0; $i < 5; ++$i) {
            $this->send($subscriber, 'POST', '/api/users');
        }

        $this->assertSame(429, $this->send($subscriber, 'POST', '/api/users')->getResponse()->getStatusCode());
    }

    public function testChaqueAdresseALeSienCompteur(): void
    {
        $subscriber = new RateLimitSubscriber(new ArrayAdapter());

        for ($i = 0; $i < 11; ++$i) {
            $this->send($subscriber, 'POST', '/api/login_check', '203.0.113.1');
        }

        $this->assertFalse($this->send($subscriber, 'POST', '/api/login_check', '203.0.113.2')->hasResponse());
    }

    public function testLesLecturesEtLesAutresRoutesNeSontJamaisLimitees(): void
    {
        $subscriber = new RateLimitSubscriber(new ArrayAdapter());

        for ($i = 0; $i < 200; ++$i) {
            $this->assertFalse($this->send($subscriber, 'GET', '/api/homebrew_entries')->hasResponse());
            $this->assertFalse($this->send($subscriber, 'GET', '/api/users')->hasResponse());
            $this->assertFalse($this->send($subscriber, 'POST', '/api/campaigns')->hasResponse());
        }
    }

    public function testLesEcrituresCommunautairesSontLimiteesAuDessusDeSoixanteParMinute(): void
    {
        $subscriber = new RateLimitSubscriber(new ArrayAdapter());

        for ($i = 0; $i < 60; ++$i) {
            $this->assertFalse($this->send($subscriber, 'POST', '/api/homebrew_entries')->hasResponse());
        }

        $this->assertSame(429, $this->send($subscriber, 'PATCH', '/api/homebrew_entries/3')->getResponse()->getStatusCode());
    }

    public function testLaConfirmationEtLeRenvoiDeMailSontLimitesACinqParDixMinutes(): void
    {
        $subscriber = new RateLimitSubscriber(new ArrayAdapter());

        for ($i = 0; $i < 5; ++$i) {
            $this->send($subscriber, 'POST', '/api/resend-verification');
        }

        $this->assertSame(429, $this->send($subscriber, 'POST', '/api/verify-email')->getResponse()->getStatusCode());
    }

    public function testDesactiveIlNeBloqueRien(): void
    {
        $subscriber = new RateLimitSubscriber(new ArrayAdapter(), false);

        for ($i = 0; $i < 50; ++$i) {
            $this->assertFalse($this->send($subscriber, 'POST', '/api/login_check')->hasResponse());
        }
    }
}
