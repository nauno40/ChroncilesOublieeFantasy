<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiProperty;
use App\Repository\RaceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: RaceRepository::class)]
#[ApiResource]
class Race
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column(nullable: true)]
    private ?array $modifiers = null;

    #[ORM\Column(nullable: true)]
    private ?int $minHeight = null;

    #[ORM\Column(nullable: true)]
    private ?int $maxHeight = null;

    #[ORM\Column(nullable: true)]
    private ?int $minWeight = null;

    #[ORM\Column(nullable: true)]
    private ?int $maxWeight = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $speed = null;

    #[ORM\ManyToMany(targetEntity: Voie::class, mappedBy: 'races')]
    #[Groups(['race:read'])]
    #[ApiProperty(readableLink: true)]
    private Collection $availableVoies;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $detailedDescription = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $publicPerception = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $abilities = null;

    #[ORM\Column(nullable: true)]
    private ?int $startingAge = null;

    #[ORM\Column(nullable: true)]
    private ?int $lifeExpectancy = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $physicalTraits = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $roleplay = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $typicalNames = null;

    public function __construct()
    {
        $this->availableVoies = new ArrayCollection();
    }

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

    public function getModifiers(): ?array
    {
        return $this->modifiers;
    }

    public function setModifiers(?array $modifiers): static
    {
        $this->modifiers = $modifiers;

        return $this;
    }

    public function getMinHeight(): ?int
    {
        return $this->minHeight;
    }

    public function setMinHeight(?int $minHeight): static
    {
        $this->minHeight = $minHeight;

        return $this;
    }

    public function getMaxHeight(): ?int
    {
        return $this->maxHeight;
    }

    public function setMaxHeight(?int $maxHeight): static
    {
        $this->maxHeight = $maxHeight;

        return $this;
    }

    public function getSpeed(): ?string
    {
        return $this->speed;
    }

    public function setSpeed(?string $speed): static
    {
        $this->speed = $speed;

        return $this;
    }

    /**
     * @return Collection<int, Voie>
     */
    public function getAvailableVoies(): Collection
    {
        return $this->availableVoies;
    }

    public function addAvailableVoie(Voie $availableVoie): static
    {
        if (!$this->availableVoies->contains($availableVoie)) {
            $this->availableVoies->add($availableVoie);
            $availableVoie->addRace($this);
        }

        return $this;
    }

    public function removeAvailableVoie(Voie $availableVoie): static
    {
        if ($this->availableVoies->removeElement($availableVoie)) {
            $availableVoie->removeRace($this);
        }

        return $this;
    }

    public function getDetailedDescription(): ?string
    {
        return $this->detailedDescription;
    }

    public function setDetailedDescription(?string $detailedDescription): static
    {
        $this->detailedDescription = $detailedDescription;

        return $this;
    }

    public function getPublicPerception(): ?string
    {
        return $this->publicPerception;
    }

    public function setPublicPerception(?string $publicPerception): static
    {
        $this->publicPerception = $publicPerception;

        return $this;
    }

    public function getAbilities(): ?string
    {
        return $this->abilities;
    }

    public function setAbilities(?string $abilities): static
    {
        $this->abilities = $abilities;

        return $this;
    }

    public function getStartingAge(): ?int
    {
        return $this->startingAge;
    }

    public function setStartingAge(?int $startingAge): static
    {
        $this->startingAge = $startingAge;

        return $this;
    }

    public function getLifeExpectancy(): ?int
    {
        return $this->lifeExpectancy;
    }

    public function setLifeExpectancy(?int $lifeExpectancy): static
    {
        $this->lifeExpectancy = $lifeExpectancy;

        return $this;
    }

    public function getPhysicalTraits(): ?string
    {
        return $this->physicalTraits;
    }

    public function setPhysicalTraits(?string $physicalTraits): static
    {
        $this->physicalTraits = $physicalTraits;

        return $this;
    }

    public function getTypicalNames(): ?string
    {
        return $this->typicalNames;
    }

    public function setTypicalNames(?string $typicalNames): static
    {
        $this->typicalNames = $typicalNames;

        return $this;
    }

    public function getMinWeight(): ?int
    {
        return $this->minWeight;
    }

    public function setMinWeight(?int $minWeight): static
    {
        $this->minWeight = $minWeight;

        return $this;
    }

    public function getMaxWeight(): ?int
    {
        return $this->maxWeight;
    }

    public function setMaxWeight(?int $maxWeight): static
    {
        $this->maxWeight = $maxWeight;

        return $this;
    }
    public function getRoleplay(): ?string
    {
        return $this->roleplay;
    }

    public function setRoleplay(?string $roleplay): static
    {
        $this->roleplay = $roleplay;

        return $this;
    }

    public function getImage(): ?string
    {
        return $this->image;
    }

    public function setImage(?string $image): static
    {
        $this->image = $image;

        return $this;
    }
}
