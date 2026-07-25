<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\HomebrewEntryRepository;
use App\State\HomebrewEntryStateProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Contenu « homebrew » créé par un MJ (bibliothèque) : une fiche catégorisée (sort, race,
 * classe, voie, objet magique, créature, poison…) avec nom + description. Owner-scopée
 * (chacun gère la sienne) ; les entrées `visibility = public` sont lisibles par tous
 * (bibliothèque communautaire). Le scope de lecture « mienne OU publique » est appliqué par
 * CurrentUserExtension ; l'owner est posé par HomebrewEntryStateProcessor.
 */
#[ORM\Entity(repositoryClass: HomebrewEntryRepository::class)]
#[ApiResource(
    shortName: 'HomebrewEntry',
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Post(security: "is_granted('ROLE_USER')", processor: HomebrewEntryStateProcessor::class),
        new Get(security: "is_granted('ROLE_USER') and (object.getOwner() == user or object.getVisibility() == 'public')"),
        new Put(security: "is_granted('ROLE_USER') and object.getOwner() == user", processor: HomebrewEntryStateProcessor::class),
        new Patch(security: "is_granted('ROLE_USER') and object.getOwner() == user", processor: HomebrewEntryStateProcessor::class),
        new Delete(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
    ],
    normalizationContext: ['groups' => ['homebrew:read']],
    denormalizationContext: ['groups' => ['homebrew:write']],
    order: ['updatedAt' => 'DESC'],
)]
class HomebrewEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['homebrew:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $owner = null;

    // Catégorie (type de contenu) : validée côté front via une liste (sort, race, classe…).
    #[ORM\Column(length: 40)]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?string $category = null;

    #[ORM\Column(length: 255)]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?string $description = null;

    // 'private' (par défaut) ou 'public' (bibliothèque communautaire).
    #[ORM\Column(length: 20, options: ['default' => 'private'])]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private string $visibility = 'private';

    #[ORM\Column]
    #[Groups(['homebrew:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['homebrew:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[Groups(['homebrew:read'])]
    public function getAuthorId(): ?int
    {
        return $this->owner?->getId();
    }

    #[Groups(['homebrew:read'])]
    public function getAuthorPseudo(): ?string
    {
        return $this->owner?->getPseudo();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getVisibility(): string
    {
        return $this->visibility;
    }

    public function setVisibility(string $visibility): static
    {
        $this->visibility = $visibility;

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

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}
