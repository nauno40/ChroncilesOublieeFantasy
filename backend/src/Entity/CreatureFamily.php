<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\CreatureFamilyRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CreatureFamilyRepository::class)]
#[ApiResource]
class CreatureFamily
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['creature:read'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $image = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $reference = null;

    #[ORM\OneToMany(mappedBy: 'family', targetEntity: Creature::class)]
    private Collection $creatures;

    public function __construct()
    {
        $this->creatures = new ArrayCollection();
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

    public function setDescription(?string $description): static
    {
        $this->description = $description;

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

    public function getReference(): ?string
    {
        return $this->reference;
    }

    public function setReference(?string $reference): static
    {
        $this->reference = $reference;

        return $this;
    }

    /**
     * @return Collection<int, Creature>
     */
    public function getCreatures(): Collection
    {
        return $this->creatures;
    }

    public function addCreature(Creature $creature): static
    {
        if (!$this->creatures->contains($creature)) {
            $this->creatures->add($creature);
            $creature->setFamily($this);
        }

        return $this;
    }

    public function removeCreature(Creature $creature): static
    {
        if ($this->creatures->removeElement($creature)) {
            // set the owning side to null (unless already changed)
            if ($creature->getFamily() === $this) {
                $creature->setFamily(null);
            }
        }

        return $this;
    }
}
