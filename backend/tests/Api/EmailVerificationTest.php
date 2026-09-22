<?php

namespace App\Tests\Api;

use App\Entity\EmailVerificationToken;
use App\Entity\User;

/**
 * Flux de confirmation d'adresse e-mail (endpoints publics verify/resend).
 */
final class EmailVerificationTest extends ApiSecurityTestCase
{
    private function post(string $path, array $body): void
    {
        $this->client->request('POST', $path, [
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode($body),
        ]);
    }

    private function persistToken(User $user, string $rawToken, string $ttl): void
    {
        $token = (new EmailVerificationToken())
            ->setUser($user)
            ->setHashedToken(hash('sha256', $rawToken))
            ->setExpiresAt(new \DateTimeImmutable($ttl));
        $this->em->persist($token);
        $this->em->flush();
    }

    public function testVerifyWithValidTokenMarksUserVerifiedAndConsumesToken(): void
    {
        $user = $this->createUser('bob@example.com', verified: false);
        $raw = bin2hex(random_bytes(16));
        $this->persistToken($user, $raw, '+24 hours');

        $this->post('/api/verify-email', ['token' => $raw]);
        $this->assertResponseStatusCodeSame(200);

        $this->em->clear();
        $fresh = $this->em->getRepository(User::class)->find($user->getId());
        $this->assertTrue($fresh->isVerified());
        $this->assertCount(0, $this->em->getRepository(EmailVerificationToken::class)->findAll());
    }

    public function testVerifyWithInvalidTokenIsRejected(): void
    {
        $this->post('/api/verify-email', ['token' => 'deadbeef']);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testVerifyWithExpiredTokenIsRejected(): void
    {
        $user = $this->createUser('carol@example.com', verified: false);
        $raw = bin2hex(random_bytes(16));
        $this->persistToken($user, $raw, '-1 hour');

        $this->post('/api/verify-email', ['token' => $raw]);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testResendForUnknownEmailReturns200AndCreatesNoToken(): void
    {
        $this->post('/api/resend-verification', ['email' => 'nobody@example.com']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertCount(0, $this->em->getRepository(EmailVerificationToken::class)->findAll());
    }

    public function testResendForAlreadyVerifiedUserCreatesNoToken(): void
    {
        $this->createUser('dan@example.com', verified: true);

        $this->post('/api/resend-verification', ['email' => 'dan@example.com']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertCount(0, $this->em->getRepository(EmailVerificationToken::class)->findAll());
    }

    public function testResendForUnverifiedUserCreatesSingleToken(): void
    {
        $user = $this->createUser('erin@example.com', verified: false);

        $this->post('/api/resend-verification', ['email' => 'erin@example.com']);
        $this->post('/api/resend-verification', ['email' => 'erin@example.com']);

        $this->assertResponseStatusCodeSame(200);
        $this->assertCount(1, $this->em->getRepository(EmailVerificationToken::class)->findBy(['user' => $user]));
    }
}
