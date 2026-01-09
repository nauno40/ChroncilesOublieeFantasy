<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\CapabilityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;

#[ORM\Entity(repositoryClass: CapabilityRepository::class)]
#[ApiResource]
#[ApiFilter(SearchFilter::class, properties: ['voie' => 'exact'])]
class Capability
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column]
    private ?int $rank = null;

    #[ORM\ManyToOne(inversedBy: 'capabilities')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Voie $voie = null;

    #[ORM\Column]
    private ?bool $isSpell = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $actionType = null;

    #[ORM\Column]
    private ?bool $limited = null;

    #[ORM\Column(nullable: true)]
    private ?array $effect = null;

    public function getId(): ?int
    {
        return $this->id;
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

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getRank(): ?int
    {
        return $this->rank;
    }

    public function setRank(int $rank): static
    {
        $this->rank = $rank;

        return $this;
    }

    public function getVoie(): ?Voie
    {
        return $this->voie;
    }

    public function setVoie(?Voie $voie): static
    {
        $this->voie = $voie;

        return $this;
    }

    public function isIsSpell(): ?bool
    {
        return $this->isSpell;
    }

    public function setIsSpell(bool $isSpell): static
    {
        $this->isSpell = $isSpell;

        return $this;
    }

    public function getActionType(): ?string
    {
        return $this->actionType;
    }

    public function setActionType(?string $actionType): static
    {
        $this->actionType = $actionType;

        return $this;
    }

    public function isLimited(): ?bool
    {
        return $this->limited;
    }

    public function setLimited(bool $limited): static
    {
        $this->limited = $limited;

        return $this;
    }

    public function getEffect(): ?array
    {
        return $this->effect;
    }

    public function setEffect(?array $effect): static
    {
        $this->effect = $effect;

        return $this;
    }

    public function isSpell(): ?bool
    {
        return $this->isSpell;
    }
}
