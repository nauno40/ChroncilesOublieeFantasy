<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Repository\FavoriteRepository;
use App\State\FavoriteStateProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Un membre marque comme favori une entrée de la bibliothèque communautaire
 * ({@see HomebrewEntry}) ou un monstre custom ({@see CustomCreature}) — jamais le sien
 * (contrôlé par {@see FavoriteStateProcessor}, pas par la base : ça resterait un favori
 * cohérent en base, juste sans intérêt produit).
 *
 * Même construction que {@see ContentReport} : pas de relation Doctrine directe vers la
 * cible (deux entités visées, sans classe mère commune) — `targetType` + `targetId` en
 * pointeur faible. La collection est scopée au membre courant par CurrentUserExtension :
 * personne ne voit les favoris de quelqu'un d'autre.
 */
#[ORM\Entity(repositoryClass: FavoriteRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_favorite_user_target', columns: ['user_id', 'target_type', 'target_id'])]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Post(security: "is_granted('ROLE_USER')", processor: FavoriteStateProcessor::class),
        new Get(security: "is_granted('ROLE_USER') and object.getUser() == user"),
        new Delete(security: "is_granted('ROLE_USER') and object.getUser() == user"),
    ],
    normalizationContext: ['groups' => ['favorite:read']],
    denormalizationContext: ['groups' => ['favorite:write']],
    order: ['createdAt' => 'DESC'],
)]
class Favorite
{
    public const TARGET_TYPES = ['homebrew_entry', 'custom_creature'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['favorite:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\Column(length: 30)]
    #[Groups(['favorite:read', 'favorite:write'])]
    #[Assert\Choice(choices: self::TARGET_TYPES)]
    #[Assert\NotBlank]
    private ?string $targetType = null;

    #[ORM\Column]
    #[Groups(['favorite:read', 'favorite:write'])]
    #[Assert\Positive]
    #[Assert\NotBlank]
    private ?int $targetId = null;

    #[ORM\Column]
    #[Groups(['favorite:read'])]
    private ?\DateTimeImmutable $createdAt = null;

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

    public function getTargetType(): ?string
    {
        return $this->targetType;
    }

    public function setTargetType(string $targetType): static
    {
        $this->targetType = $targetType;

        return $this;
    }

    public function getTargetId(): ?int
    {
        return $this->targetId;
    }

    public function setTargetId(int $targetId): static
    {
        $this->targetId = $targetId;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}
