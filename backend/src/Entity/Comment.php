<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\Repository\CommentRepository;
use App\State\CommentStateProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Commentaire posté sur une entrée de la bibliothèque communautaire ({@see HomebrewEntry})
 * ou un monstre custom ({@see CustomCreature}) — visible par qui peut lire la cible (comme
 * elle : public sans compte, privé réservé au propriétaire de la cible).
 *
 * Même construction que {@see Favorite}/{@see ContentReport} : pas de relation Doctrine
 * directe vers la cible (`targetType` + `targetId` en pointeur faible, deux entités visées
 * sans classe mère commune). La visibilité suit celle de la cible : CurrentUserExtension
 * filtre par une sous-requête sur HomebrewEntry/CustomCreature (aucune relation à joindre) ;
 * CommentStateProcessor applique la même règle à l'écriture (cible introuvable ou non
 * visible → 404, pas de distinction avec « n'existe pas », pour ne rien révéler du contenu
 * privé d'autrui).
 *
 * Pas d'édition (Patch) : seul un ajout puis une suppression sont permis. La suppression
 * du commentaire d'un tiers par le propriétaire de la cible (modération de sa propre
 * fiche) n'est pas ouverte ici — question produit non tranchée (ROLE_MODERATOR, cf. kanban) ;
 * pour l'instant seul l'auteur du commentaire ou un admin peut le supprimer.
 */
#[ORM\Entity(repositoryClass: CommentRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Post(security: "is_granted('ROLE_USER')", processor: CommentStateProcessor::class),
        new Get(),
        new Delete(security: "is_granted('ROLE_USER') and (object.getAuthor() == user or is_granted('ROLE_ADMIN'))"),
    ],
    normalizationContext: ['groups' => ['comment:read']],
    denormalizationContext: ['groups' => ['comment:write']],
    order: ['createdAt' => 'ASC'],
)]
#[ApiFilter(SearchFilter::class, properties: ['targetType' => 'exact', 'targetId' => 'exact'])]
class Comment
{
    public const TARGET_TYPES = ['homebrew_entry', 'custom_creature'];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['comment:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $author = null;

    #[ORM\Column(length: 30)]
    #[Groups(['comment:read', 'comment:write'])]
    #[Assert\Choice(choices: self::TARGET_TYPES)]
    #[Assert\NotBlank]
    private ?string $targetType = null;

    #[ORM\Column]
    #[Groups(['comment:read', 'comment:write'])]
    #[Assert\Positive]
    #[Assert\NotBlank]
    private ?int $targetId = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['comment:read', 'comment:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 2000)]
    private ?string $content = null;

    #[ORM\Column]
    #[Groups(['comment:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[Groups(['comment:read'])]
    public function getAuthorId(): ?int
    {
        return $this->author?->getId();
    }

    #[Groups(['comment:read'])]
    public function getAuthorPseudo(): ?string
    {
        return $this->author?->getPseudo();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(User $author): static
    {
        $this->author = $author;

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

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

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
