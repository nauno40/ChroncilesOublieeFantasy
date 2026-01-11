<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\FamilyRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: FamilyRepository::class)]
#[ApiResource]
class Family
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column]
    private ?int $baseHp = null;

    #[ORM\Column(length: 10)]
    private ?string $recoveryDie = null;

    #[ORM\Column]
    private ?int $luckPoints = null;

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $manaStat = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $specials = null;

    #[ORM\OneToMany(mappedBy: 'family', targetEntity: Profile::class)]
    private Collection $profiles;

    public function __construct()
    {
        $this->profiles = new ArrayCollection();
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

    public function getBaseHp(): ?int
    {
        return $this->baseHp;
    }

    public function setBaseHp(int $baseHp): static
    {
        $this->baseHp = $baseHp;

        return $this;
    }

    public function getRecoveryDie(): ?string
    {
        return $this->recoveryDie;
    }

    public function setRecoveryDie(string $recoveryDie): static
    {
        $this->recoveryDie = $recoveryDie;

        return $this;
    }

    public function getLuckPoints(): ?int
    {
        return $this->luckPoints;
    }

    public function setLuckPoints(int $luckPoints): static
    {
        $this->luckPoints = $luckPoints;

        return $this;
    }

    public function getManaStat(): ?string
    {
        return $this->manaStat;
    }

    public function setManaStat(?string $manaStat): static
    {
        $this->manaStat = $manaStat;

        return $this;
    }

    public function getSpecials(): ?string
    {
        return $this->specials;
    }

    public function setSpecials(?string $specials): static
    {
        $this->specials = $specials;

        return $this;
    }

    /**
     * @return Collection<int, Profile>
     */
    public function getProfiles(): Collection
    {
        return $this->profiles;
    }

    public function addProfile(Profile $profile): static
    {
        if (!$this->profiles->contains($profile)) {
            $this->profiles->add($profile);
            $profile->setFamily($this);
        }

        return $this;
    }

    public function removeProfile(Profile $profile): static
    {
        if ($this->profiles->removeElement($profile)) {
            // set the owning side to null (unless already changed)
            if ($profile->getFamily() === $this) {
                $profile->setFamily(null);
            }
        }

        return $this;
    }
}
