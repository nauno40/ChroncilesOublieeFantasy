<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\EncounterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Rencontre préparée par le MJ : un roster nommé (créatures + quantités) rattaché à
 * une campagne, que l'on peut lancer dans le Suivi de Combat. Enfant de Campaign,
 * sécurisé par le propriétaire de la campagne — même modèle que {@see Quest}.
 */
#[ORM\Entity(repositoryClass: EncounterRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Post(securityPostDenormalize: "is_granted('ROLE_USER') and object.getCampaign() != null and object.getCampaign().getOwner() == user"),
        new Get(security: "is_granted('ROLE_USER') and object.getCampaign() != null and object.getCampaign().getOwner() == user"),
        new Patch(securityPostDenormalize: "is_granted('ROLE_USER') and object.getCampaign() != null and object.getCampaign().getOwner() == user"),
        new Delete(security: "is_granted('ROLE_USER') and object.getCampaign() != null and object.getCampaign().getOwner() == user"),
    ],
    normalizationContext: ['groups' => ['campaign:read']],
    denormalizationContext: ['groups' => ['campaign:write']]
)]
class Encounter
{
    #[Groups(['campaign:read'])]
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[Groups(['campaign:read', 'campaign:write'])]
    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[Groups(['campaign:read', 'campaign:write'])]
    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $notes = null;

    /**
     * Roster : liste d'entrées { name, source, referenceId, quantity, initiative, hp, def, per }.
     */
    #[Groups(['campaign:read', 'campaign:write'])]
    #[ORM\Column(nullable: true)]
    private ?array $combatants = null;

    #[ORM\ManyToOne(inversedBy: 'encounters', cascade: ['persist'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?Campaign $campaign = null;

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

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function setNotes(?string $notes): static
    {
        $this->notes = $notes;

        return $this;
    }

    public function getCombatants(): ?array
    {
        return $this->combatants;
    }

    public function setCombatants(?array $combatants): static
    {
        $this->combatants = $combatants;

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
