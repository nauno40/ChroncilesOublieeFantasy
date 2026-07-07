<?php

namespace App\Tests\Api;

use App\Entity\PasswordResetToken;
use App\Entity\User;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Flux de réinitialisation de mot de passe (endpoints publics forgot/reset).
 */
final class PasswordResetTest extends ApiSecurityTestCase
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
        $token = (new PasswordResetToken())
            ->setUser($user)
            ->setHashedToken(hash('sha256', $rawToken))
            ->setExpiresAt(new \DateTimeImmutable($ttl));
        $this->em->persist($token);
        $this->em->flush();
    }

    public function testForgotUnknownEmailReturns200AndCreatesNoToken(): void
    {
        $this->post('/api/forgot-password', ['email' => 'nobody@example.com']);
        $this->assertResponseStatusCodeSame(200);
        $this->assertCount(0, $this->em->getRepository(PasswordResetToken::class)->findAll());
    }

    public function testForgotKnownEmailCreatesSingleToken(): void
    {
        $user = $this->createUser('alice@example.com');

        // Deux demandes : un seul jeton actif doit subsister.
        $this->post('/api/forgot-password', ['email' => 'alice@example.com']);
        $this->post('/api/forgot-password', ['email' => 'alice@example.com']);

        $this->assertResponseStatusCodeSame(200);
        $this->assertCount(1, $this->em->getRepository(PasswordResetToken::class)->findBy(['user' => $user]));
    }

    public function testResetWithValidTokenChangesPasswordAndConsumesToken(): void
    {
        $user = $this->createUser('bob@example.com');
        $raw = bin2hex(random_bytes(16));
        $this->persistToken($user, $raw, '+1 hour');

        $this->post('/api/reset-password', ['token' => $raw, 'password' => 'brandnew1']);
        $this->assertResponseStatusCodeSame(200);

        $this->em->clear();
        // Jeton consommé.
        $this->assertCount(0, $this->em->getRepository(PasswordResetToken::class)->findAll());
        // Nouveau mot de passe effectif.
        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        $fresh = $this->em->getRepository(User::class)->find($user->getId());
        $this->assertTrue($hasher->isPasswordValid($fresh, 'brandnew1'));
    }

    public function testResetWithInvalidTokenIsRejected(): void
    {
        $this->post('/api/reset-password', ['token' => 'deadbeef', 'password' => 'brandnew1']);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testResetWithExpiredTokenIsRejected(): void
    {
        $user = $this->createUser('carol@example.com');
        $raw = bin2hex(random_bytes(16));
        $this->persistToken($user, $raw, '-1 hour');

        $this->post('/api/reset-password', ['token' => $raw, 'password' => 'brandnew1']);
        $this->assertResponseStatusCodeSame(400);
    }

    public function testResetRejectsTooShortPassword(): void
    {
        $user = $this->createUser('dan@example.com');
        $raw = bin2hex(random_bytes(16));
        $this->persistToken($user, $raw, '+1 hour');

        $this->post('/api/reset-password', ['token' => $raw, 'password' => 'abc']);
        $this->assertResponseStatusCodeSame(400);
    }
}
