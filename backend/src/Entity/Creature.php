<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\CreatureRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CreatureRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['creature:read']],
    denormalizationContext: ['groups' => ['creature:write']]
)]
class Creature
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['creature:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['creature:read', 'creature:write'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['creature:read', 'creature:write'])]
    private ?string $description = null;

    #[ORM\ManyToOne(inversedBy: 'creatures')]
    #[Groups(['creature:read', 'creature:write'])]
    private ?CreatureFamily $family = null;

    #[ORM\Column]
    #[Groups(['creature:read', 'creature:write'])]
    private ?int $nc = null;

    #[ORM\Column]
    #[Groups(['creature:read', 'creature:write'])]
    private ?int $hp = null;

    #[ORM\Column]
    #[Groups(['creature:read', 'creature:write'])]
    private ?int $def = null;

    #[ORM\Column]
    #[Groups(['creature:read', 'creature:write'])]
    private ?int $init = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['creature:read', 'creature:write'])]
    private ?array $stats = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['creature:read', 'creature:write'])]
    private ?array $specialAbilities = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['creature:read', 'creature:write'])]
    private ?array $attacks = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['creature:read', 'creature:write'])]
    private ?array $capabilities = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['creature:read', 'creature:write'])]
    private ?string $picture = null;

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

    public function getFamily(): ?CreatureFamily
    {
        return $this->family;
    }

    public function setFamily(?CreatureFamily $family): static
    {
        $this->family = $family;
        return $this;
    }

    public function getNc(): ?int
    {
        return $this->nc;
    }

    public function setNc(int $nc): static
    {
        $this->nc = $nc;
        return $this;
    }

    public function getHp(): ?int
    {
        return $this->hp;
    }

    public function setHp(int $hp): static
    {
        $this->hp = $hp;
        return $this;
    }

    public function getDef(): ?int
    {
        return $this->def;
    }

    public function setDef(int $def): static
    {
        $this->def = $def;
        return $this;
    }

    public function getInit(): ?int
    {
        return $this->init;
    }

    public function setInit(int $init): static
    {
        $this->init = $init;
        return $this;
    }

    public function getStats(): ?array
    {
        return $this->stats;
    }

    public function setStats(?array $stats): static
    {
        $this->stats = $stats;
        return $this;
    }
    
    public function getSpecialAbilities(): ?array
    {
        return $this->specialAbilities;
    }

    public function setSpecialAbilities(?array $specialAbilities): static
    {
        $this->specialAbilities = $specialAbilities;
        return $this;
    }

    public function getAttacks(): ?array
    {
        return $this->attacks;
    }

    public function setAttacks(?array $attacks): static
    {
        $this->attacks = $attacks;
        return $this;
    }

    public function getCapabilities(): ?array
    {
        return $this->capabilities;
    }

    public function setCapabilities(?array $capabilities): static
    {
        $this->capabilities = $capabilities;
        return $this;
    }

    public function getPicture(): ?string
    {
        return $this->picture;
    }

    public function setPicture(?string $picture): static
    {
        $this->picture = $picture;
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
            // set the owning side to null (unless already changed)
            if ($creatureVoie->getCreature() === $this) {
                $creatureVoie->setCreature(null);
            }
        }

        return $this;
    }
}
