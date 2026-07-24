<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

/** Piège du compendium (COF2, partie 3-MJ ch.1). Table de référence, en lecture publique. */
#[ORM\Entity]
#[ApiResource(shortName: 'Trap')]
class Trap
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    // Difficultés stockées en chaîne : certaines valent « 5 ou 15 » selon le déclenchement.
    #[ORM\Column(length: 50, nullable: true)]
    private ?string $detectDifficulty = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $disarmDifficulty = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $effect = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $complement = null;

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

    public function getDetectDifficulty(): ?string
    {
        return $this->detectDifficulty;
    }

    public function setDetectDifficulty(?string $detectDifficulty): static
    {
        $this->detectDifficulty = $detectDifficulty;

        return $this;
    }

    public function getDisarmDifficulty(): ?string
    {
        return $this->disarmDifficulty;
    }

    public function setDisarmDifficulty(?string $disarmDifficulty): static
    {
        $this->disarmDifficulty = $disarmDifficulty;

        return $this;
    }

    public function getEffect(): ?string
    {
        return $this->effect;
    }

    public function setEffect(?string $effect): static
    {
        $this->effect = $effect;

        return $this;
    }

    public function getComplement(): ?string
    {
        return $this->complement;
    }

    public function setComplement(?string $complement): static
    {
        $this->complement = $complement;

        return $this;
    }
}
