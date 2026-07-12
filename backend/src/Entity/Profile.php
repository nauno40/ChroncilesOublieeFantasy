<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\ApiProperty;
use App\Repository\ProfileRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ProfileRepository::class)]
#[ApiResource]
class Profile
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $note = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $lore = null;

    #[ORM\ManyToOne(inversedBy: 'profiles')]
    private ?Family $family = null;

    #[ORM\Column(nullable: true)]
    private ?array $weaponsAuth = null;

    #[ORM\Column(nullable: true)]
    private ?array $armorAuth = null;

    // Seuil de DEF max d'armure autorisée (spec §8). -1 = aucune armure.
    #[ORM\Column(nullable: true)]
    #[Groups(['profile:read'])]
    private ?int $armorMaxDef = null;

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $magicStat = null;

    #[ORM\OneToMany(targetEntity: Voie::class, mappedBy: 'profile')]
    #[Groups(['profile:read'])]
    #[ApiProperty(readableLink: true)]
    private Collection $voies;

    public function __construct()
    {
        $this->voies = new ArrayCollection();
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

    public function getNote(): ?string
    {
        return $this->note;
    }

    public function setNote(?string $note): static
    {
        $this->note = $note;

        return $this;
    }

    public function getFamily(): ?Family
    {
        return $this->family;
    }

    public function setFamily(?Family $family): static
    {
        $this->family = $family;

        return $this;
    }

    public function getWeaponsAuth(): ?array
    {
        return $this->weaponsAuth;
    }

    public function setWeaponsAuth(?array $weaponsAuth): static
    {
        $this->weaponsAuth = $weaponsAuth;

        return $this;
    }

    public function getArmorAuth(): ?array
    {
        return $this->armorAuth;
    }

    public function setArmorAuth(?array $armorAuth): static
    {
        $this->armorAuth = $armorAuth;

        return $this;
    }

    public function getArmorMaxDef(): ?int
    {
        return $this->armorMaxDef;
    }

    public function setArmorMaxDef(?int $armorMaxDef): static
    {
        $this->armorMaxDef = $armorMaxDef;

        return $this;
    }

    public function getMagicStat(): ?string
    {
        return $this->magicStat;
    }

    public function setMagicStat(?string $magicStat): static
    {
        $this->magicStat = $magicStat;

        return $this;
    }

    /**
     * @return Collection<int, Voie>
     */
    public function getVoies(): Collection
    {
        return $this->voies;
    }

    public function addVoie(Voie $voie): static
    {
        if (!$this->voies->contains($voie)) {
            $this->voies->add($voie);
            $voie->setProfile($this);
        }

        return $this;
    }

    public function removeVoie(Voie $voie): static
    {
        if ($this->voies->removeElement($voie)) {
            // set the owning side to null (unless already changed)
            if ($voie->getProfile() === $this) {
                $voie->setProfile(null);
            }
        }

        return $this;
    }

    public function getLore(): ?array
    {
        return $this->lore;
    }

    public function setLore(?array $lore): static
    {
        $this->lore = $lore;

        return $this;
    }

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $stats = null;

    public function getStats(): ?array { return $this->stats; }
    public function setStats(?array $stats): static { $this->stats = $stats; return $this; }

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $startingEquipment = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $masteries = null;

    public function getStartingEquipment(): ?array
    {
        return $this->startingEquipment;
    }

    public function setStartingEquipment(?array $startingEquipment): static
    {
        $this->startingEquipment = $startingEquipment;

        return $this;
    }

    public function getMasteries(): ?array
    {
        return $this->masteries;
    }

    public function setMasteries(?array $masteries): static
    {
        $this->masteries = $masteries;

        return $this;
    }

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $imageUrl = null;

    public function getImageUrl(): ?string
    {
        return $this->imageUrl;
    }

    public function setImageUrl(?string $imageUrl): static
    {
        $this->imageUrl = $imageUrl;

        return $this;
    }
}
