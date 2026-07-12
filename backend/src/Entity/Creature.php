<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Entity\Trait\CreatureProfileTrait;
use App\Repository\CreatureRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CreatureRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['creature:read']],
    denormalizationContext: ['groups' => ['creature:write']]
)]
class Creature
{
    use CreatureProfileTrait;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['creature:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'creatures')]
    #[Groups(['creature:read', 'creature:write'])]
    private ?CreatureFamily $family = null;

    #[ORM\OneToMany(mappedBy: 'creature', targetEntity: CreatureVoie::class, orphanRemoval: true)]
    #[Groups(['creature:read'])]
    private Collection $creatureVoies;

    public function __construct()
    {
        $this->creatureVoies = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFamily(): ?CreatureFamily
    {
        return $this->family;
    }

    public function setFamily(?CreatureFamily $family): static
    {
        $this->family = $family;
        return $this;
    }

    /**
     * @return Collection<int, CreatureVoie>
     */
    public function getCreatureVoies(): Collection
    {
        return $this->creatureVoies;
    }

    public function addCreatureVoie(CreatureVoie $creatureVoie): static
    {
        if (!$this->creatureVoies->contains($creatureVoie)) {
            $this->creatureVoies->add($creatureVoie);
            $creatureVoie->setCreature($this);
        }

        return $this;
    }

    public function removeCreatureVoie(CreatureVoie $creatureVoie): static
    {
        if ($this->creatureVoies->removeElement($creatureVoie)) {
            if ($creatureVoie->getCreature() === $this) {
                $creatureVoie->setCreature(null);
            }
        }

        return $this;
    }
}
