<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\VoieRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;

#[ORM\Entity(repositoryClass: VoieRepository::class)]
#[ApiResource]
#[ApiFilter(SearchFilter::class, properties: ['profile' => 'exact'])]
class Voie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column(length: 50)]
    private ?string $category = null;

    #[ORM\ManyToOne(inversedBy: 'voies')]
    private ?Profile $profile = null;

    #[ORM\ManyToMany(targetEntity: Race::class, inversedBy: 'availableVoies')]
    private Collection $races;

    #[ORM\Column]
    private ?int $maxRank = null;

    #[ORM\OneToMany(mappedBy: 'voie', targetEntity: Capability::class, orphanRemoval: true)]
    private Collection $capabilities;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $details = null;

    public function __construct()
    {
        $this->capabilities = new ArrayCollection();
        $this->races = new ArrayCollection();
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

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getMaxRank(): ?int
    {
        return $this->maxRank;
    }

    public function setMaxRank(int $maxRank): static
    {
        $this->maxRank = $maxRank;

        return $this;
    }

    public function getDetails(): ?array
    {
        return $this->details;
    }

    public function setDetails(?array $details): static
    {
        $this->details = $details;

        return $this;
    }

    public function getProfile(): ?Profile
    {
        return $this->profile;
    }

    public function setProfile(?Profile $profile): static
    {
        $this->profile = $profile;

        return $this;
    }

    /**
     * @return Collection<int, Race>
     */
    public function getRaces(): Collection
    {
        return $this->races;
    }

    public function addRace(Race $race): static
    {
        if (!$this->races->contains($race)) {
            $this->races->add($race);
        }

        return $this;
    }

    public function removeRace(Race $race): static
    {
        $this->races->removeElement($race);

        return $this;
    }



    /**
     * @return Collection<int, Capability>
     */
    public function getCapabilities(): Collection
    {
        return $this->capabilities;
    }

    public function addCapability(Capability $capability): static
    {
        if (!$this->capabilities->contains($capability)) {
            $this->capabilities->add($capability);
            $capability->setVoie($this);
        }

        return $this;
    }

    public function removeCapability(Capability $capability): static
    {
        if ($this->capabilities->removeElement($capability)) {
            // set the owning side to null (unless already changed)
            if ($capability->getVoie() === $this) {
                $capability->setVoie(null);
            }
        }

        return $this;
    }
}
