<?php

namespace App\Entity;

use App\Repository\EmailVerificationTokenRepository;
use Doctrine\ORM\Mapping as ORM;

/**
 * Jeton de confirmation d'adresse e-mail, envoyé à l'inscription.
 *
 * Entité interne (pas exposée par API Platform), sur le même modèle que
 * `PasswordResetToken` : seul le hash du jeton est stocké, le jeton en clair
 * ne vit que dans le lien envoyé par e-mail.
 */
#[ORM\Entity(repositoryClass: EmailVerificationTokenRepository::class)]
class EmailVerificationToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    // Hash SHA-256 (hex, 64 caractères) du jeton en clair.
    #[ORM\Column(length: 64, unique: true)]
    private ?string $hashedToken = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $expiresAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getHashedToken(): ?string
    {
        return $this->hashedToken;
    }

    public function setHashedToken(string $hashedToken): static
    {
        $this->hashedToken = $hashedToken;

        return $this;
    }

    public function getExpiresAt(): ?\DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;

        return $this;
    }

    public function isExpired(): bool
    {
        return $this->expiresAt < new \DateTimeImmutable();
    }
}
