<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Poison du compendium (COF2, partie 3-MJ ch.1). Table de référence, en lecture publique. */
#[ORM\Entity]
#[ApiResource(shortName: 'Poison')]
class Poison
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $effectFail = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $effectSuccess = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $duration = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $delay = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $note = null;

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

    public function getEffectFail(): ?string
    {
        return $this->effectFail;
    }

    public function setEffectFail(?string $effectFail): static
    {
        $this->effectFail = $effectFail;

        return $this;
    }

    public function getEffectSuccess(): ?string
    {
        return $this->effectSuccess;
    }

    public function setEffectSuccess(?string $effectSuccess): static
    {
        $this->effectSuccess = $effectSuccess;

        return $this;
    }

    public function getDuration(): ?string
    {
        return $this->duration;
    }

    public function setDuration(?string $duration): static
    {
        $this->duration = $duration;

        return $this;
    }

    public function getDelay(): ?string
    {
        return $this->delay;
    }

    public function setDelay(?string $delay): static
    {
        $this->delay = $delay;

        return $this;
    }

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function setNote(?string $note): static
    {
        $this->note = $note;

        return $this;
    }
}
