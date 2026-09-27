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
use ApiPlatform\Metadata\ApiFilter;
use App\Entity\Trait\CreatureProfileTrait;
use App\Filter\PopularityFilter;
use App\Filter\TagFilter;
use App\Repository\CustomCreatureRepository;
use App\State\CustomCreatureStateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Monstre « maison » créé par un MJ, hors compendium SRD.
 *
 * Un CustomCreature appartient à un utilisateur (owner) : il n'est éditable que par son
 * créateur, mais une fiche `visibility = public` est lisible par **tous, y compris sans
 * compte** (jalon B du site communautaire — bibliothèque publique, URL partageables),
 * comme {@see Creature} (référence officielle). Le scoping en lecture (« mienne OU
 * publique », ou « publique seulement » pour un visiteur anonyme) est assuré par
 * CurrentUserExtension ; l'owner est posé à la création par CustomCreatureStateProcessor.
 *
 * Les champs de fiche (name, PV, stats, attaques…) sont mutualisés avec Creature via
 * {@see CreatureProfileTrait} ; seules la config API/sécurité et la relation owner diffèrent.
 */
#[ORM\Entity(repositoryClass: CustomCreatureRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Post(security: "is_granted('ROLE_USER')", processor: CustomCreatureStateProcessor::class),
        new Get(security: "object.getVisibility() == 'public' or (is_granted('ROLE_USER') and object.getOwner() == user)"),
        new Put(security: "is_granted('ROLE_USER') and object.getOwner() == user", processor: CustomCreatureStateProcessor::class),
        new Patch(security: "is_granted('ROLE_USER') and object.getOwner() == user", processor: CustomCreatureStateProcessor::class),
        new Delete(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
    ],
    normalizationContext: ['groups' => ['custom_creature:read']],
    denormalizationContext: ['groups' => ['custom_creature:write']]
)]
#[ApiFilter(TagFilter::class)]
#[ApiFilter(PopularityFilter::class)]
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
    // ON DELETE CASCADE : supprimer son compte supprime les monstres maison qu'on possède,
    // y compris publics — un favori/commentaire d'un tiers qui pointait dessus devient
    // orphelin et disparaît simplement de l'affichage (déjà géré côté front).
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['custom_creature:read'])]
    private ?User $owner = null;

    /**
     * Visibilité : « private » (défaut, visible du seul créateur) ou « public »
     * (publié dans la bibliothèque communautaire, consultable par tous). Aligne le
     * monstre maison sur {@see HomebrewEntry} : un seul modèle de partage privé/public.
     */
    #[ORM\Column(length: 20, options: ['default' => 'private'])]
    #[Groups(['custom_creature:read', 'custom_creature:write'])]
    private string $visibility = 'private';

    #[ORM\ManyToMany(targetEntity: Tag::class)]
    #[ORM\JoinTable(name: 'custom_creature_tag')]
    private Collection $tagEntities;

    /**
     * Écriture uniquement : noms de tags bruts, résolus (find-or-create) par
     * CustomCreatureStateProcessor via TagResolver — voir HomebrewEntry::$rawTagNames pour
     * le détail de la convention `null` (ne pas toucher) vs `[]` (tout retirer).
     */
    private ?array $rawTagNames = null;

    public function __construct()
    {
        $this->tagEntities = new ArrayCollection();
    }

    #[Groups(['custom_creature:read'])]
    public function getTags(): array
    {
        return array_map(static fn (Tag $t) => $t->getName(), $this->tagEntities->toArray());
    }

    #[Groups(['custom_creature:write'])]
    public function setTags(array $tags): static
    {
        $this->rawTagNames = $tags;

        return $this;
    }

    public function getRawTagNames(): ?array
    {
        return $this->rawTagNames;
    }

    public function getTagEntities(): Collection
    {
        return $this->tagEntities;
    }

    public function setTagEntities(Collection $tagEntities): static
    {
        $this->tagEntities = $tagEntities;

        return $this;
    }

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

    public function getVisibility(): string
    {
        return $this->visibility;
    }

    public function setVisibility(string $visibility): static
    {
        $this->visibility = $visibility;

        return $this;
    }

    #[Groups(['custom_creature:read'])]
    public function getAuthorId(): ?int
    {
        return $this->owner?->getId();
    }

    #[Groups(['custom_creature:read'])]
    public function getAuthorPseudo(): ?string
    {
        return $this->owner?->getPseudo();
    }
}
