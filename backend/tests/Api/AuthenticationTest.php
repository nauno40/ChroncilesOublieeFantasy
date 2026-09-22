<?php

namespace App\Tests\Api;

use App\Entity\EmailVerificationToken;
use App\Entity\User;

/**
 * Registration + JWT login round-trip, the password hashing done by
 * UserPasswordHasher on write, and the e-mail confirmation gate (UserChecker).
 */
final class AuthenticationTest extends ApiSecurityTestCase
{
    public function testFreshlyRegisteredUserCannotLogInBeforeConfirmingEmail(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123', 'pseudo' => 'Newcomer'],
        ]);
        $this->assertResponseStatusCodeSame(201);

        $this->client->request('POST', '/api/login_check', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123'],
        ]);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testRegisteredUserCanLogInAfterConfirmingEmail(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123', 'pseudo' => 'Newcomer'],
        ]);
        $this->assertResponseStatusCodeSame(201);

        $this->em->clear();
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => 'newcomer@example.com']);
        $token = $this->em->getRepository(EmailVerificationToken::class)->findOneBy(['user' => $user]);
        $this->assertNotNull($token, 'UserPasswordHasher must send a verification token on registration.');

        // Le jeton en clair n'est jamais persisté : on ne peut le récupérer qu'en le
        // régénérant nous-mêmes et en écrasant le hash stocké (même limite que
        // PasswordResetTest, qui fabrique son propre jeton pour la même raison).
        $raw = bin2hex(random_bytes(32));
        $token->setHashedToken(hash('sha256', $raw));
        $this->em->flush();

        $this->client->request('POST', '/api/verify-email', ['json' => ['token' => $raw]]);
        $this->assertResponseStatusCodeSame(200);

        $response = $this->client->request('POST', '/api/login_check', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123'],
        ]);
        $this->assertResponseIsSuccessful();
        $this->assertArrayHasKey('token', $response->toArray());
    }

    public function testLoginWithWrongPasswordFails(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123', 'pseudo' => 'Newcomer'],
        ]);

        $this->client->request('POST', '/api/login_check', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'wrong-password'],
        ]);
        $this->assertResponseStatusCodeSame(401);
    }

    public function testPasswordIsHashedOnRegistration(): void
    {
        $this->client->request('POST', '/api/users', [
            'json' => ['email' => 'newcomer@example.com', 'password' => 'secret123', 'pseudo' => 'Newcomer'],
        ]);
        $this->assertResponseStatusCodeSame(201);

        $this->em->clear();
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => 'newcomer@example.com']);

        $this->assertNotNull($user);
        $this->assertNotSame('secret123', $user->getPassword(), 'The raw password must not be stored.');
    }
}
