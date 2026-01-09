<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\EquipmentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: EquipmentRepository::class)]
#[ApiResource]
class Equipment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 50)]
    private ?string $type = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $price = null;

    #[ORM\Column(nullable: true)]
    private ?float $weight = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $rarity = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $material = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $quality = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $damage = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $range = null;

    #[ORM\Column(nullable: true)]
    private ?int $acBonus = null;

    #[ORM\Column(nullable: true)]
    private ?int $acMaxAgi = null;

    #[ORM\Column(nullable: true)]
    private ?int $acPenalty = null;

    #[ORM\Column(nullable: true)]
    private ?array $properties = null;

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
    
    // Getters and Setters...
    
    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }

    public function getPrice(): ?string { return $this->price; }
    public function setPrice(?string $price): static { $this->price = $price; return $this; }

    public function getWeight(): ?float { return $this->weight; }
    public function setWeight(?float $weight): static { $this->weight = $weight; return $this; }

    public function getRarity(): ?string { return $this->rarity; }
    public function setRarity(?string $rarity): static { $this->rarity = $rarity; return $this; }

    public function getMaterial(): ?string { return $this->material; }
    public function setMaterial(?string $material): static { $this->material = $material; return $this; }

    public function getQuality(): ?string { return $this->quality; }
    public function setQuality(?string $quality): static { $this->quality = $quality; return $this; }

    public function getDamage(): ?string { return $this->damage; }
    public function setDamage(?string $damage): static { $this->damage = $damage; return $this; }

    public function getRange(): ?string { return $this->range; }
    public function setRange(?string $range): static { $this->range = $range; return $this; }

    public function getAcBonus(): ?int { return $this->acBonus; }
    public function setAcBonus(?int $acBonus): static { $this->acBonus = $acBonus; return $this; }

    public function getAcMaxAgi(): ?int { return $this->acMaxAgi; }
    public function setAcMaxAgi(?int $acMaxAgi): static { $this->acMaxAgi = $acMaxAgi; return $this; }

    public function getAcPenalty(): ?int { return $this->acPenalty; }
    public function setAcPenalty(?int $acPenalty): static { $this->acPenalty = $acPenalty; return $this; }

    public function getProperties(): ?array { return $this->properties; }
    public function setProperties(?array $properties): static { $this->properties = $properties; return $this; }
}
