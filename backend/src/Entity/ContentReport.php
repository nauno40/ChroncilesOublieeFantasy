<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\ContentReportRepository;
use App\State\ContentReportStateProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Signalement d'une entrée de la bibliothèque communautaire ({@see HomebrewEntry}) ou
 * d'un monstre custom ({@see CustomCreature}), par un membre qui n'en est pas l'auteur.
 *
 * Pas de relation Doctrine directe vers la cible : les deux entités visées n'ont pas de
 * classe mère commune (`targetType` + `targetId` en pointeur faible, comme un signalement
 * doit pouvoir survivre à la suppression de son sujet). La vérification/qualification du
 * signalement reste manuelle (ROLE_ADMIN) — aucun rôle modérateur distinct pour l'instant
 * (question produit encore ouverte : qui modère).
 */
#[ORM\Entity(repositoryClass: ContentReportRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_ADMIN')"),
        new Post(security: "is_granted('ROLE_USER')", processor: ContentReportStateProcessor::class),
        new Get(security: "is_granted('ROLE_ADMIN')"),
        new Patch(security: "is_granted('ROLE_ADMIN')", processor: ContentReportStateProcessor::class),
        new Delete(security: "is_granted('ROLE_ADMIN')"),
    ],
    normalizationContext: ['groups' => ['content_report:read']],
    denormalizationContext: ['groups' => ['content_report:write']],
    order: ['createdAt' => 'DESC'],
)]
#[ApiFilter(SearchFilter::class, properties: ['status' => 'exact'])]
class ContentReport
{
    public const TARGET_TYPES = ['homebrew_entry', 'custom_creature'];
    public const STATUSES = ['pending', 'resolved', 'dismissed'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['content_report:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['content_report:read'])]
    private ?User $reporter = null;

    #[ORM\Column(length: 30)]
    #[Groups(['content_report:read', 'content_report:write'])]
    #[Assert\Choice(choices: self::TARGET_TYPES)]
    #[Assert\NotBlank]
    private ?string $targetType = null;

    #[ORM\Column]
    #[Groups(['content_report:read', 'content_report:write'])]
    #[Assert\Positive]
    #[Assert\NotBlank]
    private ?int $targetId = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['content_report:read', 'content_report:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 2000)]
    private ?string $reason = null;

    #[ORM\Column(length: 20, options: ['default' => 'pending'])]
    #[Groups(['content_report:read', 'content_report:write'])]
    #[Assert\Choice(choices: self::STATUSES)]
    private string $status = 'pending';

    #[ORM\ManyToOne]
    #[Groups(['content_report:read'])]
    private ?User $resolvedBy = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['content_report:read'])]
    private ?\DateTimeImmutable $resolvedAt = null;

    #[ORM\Column]
    #[Groups(['content_report:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getReporter(): ?User
    {
        return $this->reporter;
    }

    public function setReporter(User $reporter): static
    {
        $this->reporter = $reporter;

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

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function setReason(string $reason): static
    {
        $this->reason = $reason;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getResolvedBy(): ?User
    {
        return $this->resolvedBy;
    }

    public function setResolvedBy(?User $resolvedBy): static
    {
        $this->resolvedBy = $resolvedBy;

        return $this;
    }

    public function getResolvedAt(): ?\DateTimeImmutable
    {
        return $this->resolvedAt;
    }

    public function setResolvedAt(?\DateTimeImmutable $resolvedAt): static
    {
        $this->resolvedAt = $resolvedAt;

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
