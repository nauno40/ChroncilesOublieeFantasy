<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\CreatureVoieRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CreatureVoieRepository::class)]
#[ApiResource]
class CreatureVoie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'creatureVoies')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Creature $creature = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    private ?Voie $voie = null;

    #[ORM\Column]
    private ?int $rank = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCreature(): ?Creature
    {
        return $this->creature;
    }

    public function setCreature(?Creature $creature): static
    {
        $this->creature = $creature;

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

    public function getRank(): ?int
    {
        return $this->rank;
    }

    public function setRank(int $rank): static
    {
        $this->rank = $rank;

        return $this;
    }
}
