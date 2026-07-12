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
use App\Entity\Trait\CreatureProfileTrait;
use App\Repository\CustomCreatureRepository;
use App\State\CustomCreatureStateProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Monstre « maison » créé par un MJ, hors compendium SRD.
 *
 * Contrairement à {@see Creature} (référence publique, en lecture seule pour tous),
 * un CustomCreature appartient à un utilisateur (owner) : il n'est visible et éditable
 * que par son créateur. Le scoping automatique est assuré par CurrentUserExtension,
 * l'owner est posé à la création par CustomCreatureStateProcessor.
 *
 * Les champs de fiche (name, PV, stats, attaques…) sont mutualisés avec Creature via
 * {@see CreatureProfileTrait} ; seules la config API/sécurité et la relation owner diffèrent.
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
    use CreatureProfileTrait;

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['custom_creature:read'])]
    private ?int $id = null;

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
