<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\CustomCreatureRepository;
use App\State\CustomCreatureStateProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Monstre « maison » créé par un MJ, hors compendium SRD.
 *
 * Contrairement à {@see Creature} (référence publique, en lecture seule pour tous),
 * un CustomCreature appartient à un utilisateur (owner) : il n'est visible et éditable
 * que par son créateur. Le scoping automatique est assuré par CurrentUserExtension,
 * l'owner est posé à la création par CustomCreatureStateProcessor.
 */
#[ORM\Entity(repositoryClass: CustomCreatureRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Post(security: "is_granted('ROLE_USER')", processor: CustomCreatureStateProcessor::class),
        new Get(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
        new Put(security: "is_granted('ROLE_USER') and object.getOwner() == user", processor: CustomCreatureStateProcessor::class),
        new Patch(security: "is_granted('ROLE_USER') and object.getOwner() == user", processor: CustomCreatureStateProcessor::class),
        new Delete(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
    ],
    normalizationContext: ['groups' => ['custom_creature:read']],
    denormalizationContext: ['groups' => ['custom_creature:write']]
)]
class CustomCreature
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['custom_creature:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?int $nc = null;

    #[ORM\Column]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?int $hp = null;

    #[ORM\Column]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?int $def = null;

    #[ORM\Column]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?int $init = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?array $stats = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?array $specialAbilities = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?array $attacks = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?array $capabilities = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?string $picture = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?string $category = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?string $environment = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?string $archetype = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private ?string $size = null;

    // fetchEager: false — l'expression de sécurité par opération référence object.getOwner(),
    // ce qui pousse API Platform à joindre la relation en eager. On la garde lazy (cf. Character).
    #[ApiProperty(fetchEager: false)]
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['custom_creature:read'])]
    private ?User $owner = null;

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

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(?string $category): static
    {
        $this->category = $category;

        return $this;
    }

    public function getEnvironment(): ?string
    {
        return $this->environment;
    }

    public function setEnvironment(?string $environment): static
    {
        $this->environment = $environment;

        return $this;
    }

    public function getArchetype(): ?string
    {
        return $this->archetype;
    }

    public function setArchetype(?string $archetype): static
    {
        $this->archetype = $archetype;

        return $this;
    }

    public function getSize(): ?string
    {
        return $this->size;
    }

    public function setSize(?string $size): static
    {
        $this->size = $size;

        return $this;
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
}
