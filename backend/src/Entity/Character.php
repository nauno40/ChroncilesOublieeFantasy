<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\CharacterRepository;
use App\State\CharacterStateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CharacterRepository::class)]
#[ORM\Table(name: '`character`')]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Post(security: "is_granted('ROLE_USER')", processor: CharacterStateProcessor::class),
        new Get(security: "is_granted('ROLE_USER') and (object.getOwner() == user or (object.getCampaign() != null and object.getCampaign().getOwner() == user))"),
        new Put(security: "is_granted('ROLE_USER') and (object.getOwner() == user or (object.getCampaign() != null and object.getCampaign().getOwner() == user))", processor: CharacterStateProcessor::class),
        new Patch(security: "is_granted('ROLE_USER') and (object.getOwner() == user or (object.getCampaign() != null and object.getCampaign().getOwner() == user))", processor: CharacterStateProcessor::class),
        new Delete(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
    ],
    normalizationContext: ['groups' => ['character:read']],
    denormalizationContext: ['groups' => ['character:write']]
)]
#[ORM\HasLifecycleCallbacks]
class Character
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['character:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['character:read', 'character:write'])]
    private ?string $name = null;

    #[ORM\Column]
    #[Groups(['character:read', 'character:write'])]
    private ?int $level = 1;

    #[ORM\ManyToOne]
    #[Groups(['character:read', 'character:write'])]
    private ?Race $race = null;

    #[ORM\ManyToOne]
    #[Groups(['character:read', 'character:write'])]
    private ?Profile $profile = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?array $caracs = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?array $playState = null;

    #[ORM\OneToMany(targetEntity: CharacterVoie::class, mappedBy: 'character', cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['character:read', 'character:write'])]
    private Collection $characterVoies;

    #[ORM\Column]
    #[Groups(['character:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['character:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    // fetchEager: false — casse le cycle d'eager-loading Campaign <-> Character (la sécurité
    // par opération référence object.getCampaign(), ce qui pousse API Platform à joindre la
    // relation en profondeur et dépasse max_joins). La campagne reste sérialisée en lazy.
    #[ApiProperty(fetchEager: false)]
    #[ORM\ManyToOne(inversedBy: 'characters')]
    #[Groups(['character:read', 'character:write', 'campaign:read', 'campaign:write'])]
    private ?Campaign $campaign = null;

    /**
     * Rattachement d'une fiche à une campagne par son identifiant (write-only, non persisté).
     * Un joueur membre ne peut pas résoudre l'IRI d'une campagne (owner-scopée) ; il fournit
     * donc l'id, que CharacterStateProcessor résout côté serveur puis valide par l'appartenance.
     */
    #[Groups(['character:write'])]
    private ?int $campaignId = null;

    #[ORM\ManyToOne(inversedBy: 'characters')]
    #[ORM\JoinColumn(nullable: true)] # Nullable for legacy characters
    #[Groups(['character:read'])]
    private ?User $owner = null;

    public function __construct()
    {
        $this->characterVoies = new ArrayCollection();
    }

    public function getCampaignId(): ?int
    {
        return $this->campaignId;
    }

    public function setCampaignId(?int $campaignId): static
    {
        $this->campaignId = $campaignId;

        return $this;
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

    public function getLevel(): ?int
    {
        return $this->level;
    }

    public function setLevel(int $level): static
    {
        $this->level = $level;

        return $this;
    }

    public function getRace(): ?Race
    {
        return $this->race;
    }

    public function setRace(?Race $race): static
    {
        $this->race = $race;

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

    public function getCaracs(): ?array
    {
        return $this->caracs;
    }

    public function setCaracs(?array $caracs): static
    {
        $this->caracs = $caracs;

        return $this;
    }

    public function getPlayState(): ?array
    {
        return $this->playState;
    }

    public function setPlayState(?array $playState): static
    {
        $this->playState = $playState;

        return $this;
    }

    /** @return Collection<int, CharacterVoie> */
    public function getCharacterVoies(): Collection
    {
        return $this->characterVoies;
    }

    public function addCharacterVoie(CharacterVoie $cv): static
    {
        if (!$this->characterVoies->contains($cv)) {
            $this->characterVoies->add($cv);
            $cv->setCharacter($this);
        }

        return $this;
    }

    public function removeCharacterVoie(CharacterVoie $cv): static
    {
        if ($this->characterVoies->removeElement($cv)) {
            if ($cv->getCharacter() === $this) {
                $cv->setCharacter(null);
            }
        }

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    public function getCampaign(): ?Campaign
    {
        return $this->campaign;
    }

    public function setCampaign(?Campaign $campaign): static
    {
        $this->campaign = $campaign;

        return $this;
    }
}
