<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Filter\HomebrewScopeFilter;
use App\Filter\HomebrewSearchFilter;
use App\Filter\PopularityFilter;
use App\Filter\TagFilter;
use App\Repository\HomebrewEntryRepository;
use App\State\HomebrewEntryStateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Contenu « homebrew » créé par un MJ (bibliothèque) : une fiche catégorisée (sort, race,
 * classe, voie, objet magique, créature, poison…) avec nom + description. Owner-scopée
 * (chacun gère la sienne) ; les entrées `visibility = public` sont lisibles par **tous**,
 * y compris sans compte (jalon B du site communautaire — bibliothèque publique, URL
 * partageables). Le scope de lecture « mienne OU publique » (ou « publique seulement »
 * pour un visiteur anonyme) est appliqué par CurrentUserExtension ; l'owner est posé par
 * HomebrewEntryStateProcessor. Écritures toujours réservées à ROLE_USER + propriétaire.
 */
#[ORM\Entity(repositoryClass: HomebrewEntryRepository::class)]
#[ApiResource(
    shortName: 'HomebrewEntry',
    operations: [
        new GetCollection(),
        new Post(security: "is_granted('ROLE_USER')", processor: HomebrewEntryStateProcessor::class),
        new Get(security: "object.getVisibility() == 'public' or (is_granted('ROLE_USER') and object.getOwner() == user)"),
        new Put(security: "is_granted('ROLE_USER') and object.getOwner() == user", processor: HomebrewEntryStateProcessor::class),
        new Patch(security: "is_granted('ROLE_USER') and object.getOwner() == user", processor: HomebrewEntryStateProcessor::class),
        new Delete(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
    ],
    normalizationContext: ['groups' => ['homebrew:read']],
    denormalizationContext: ['groups' => ['homebrew:write']],
    order: ['updatedAt' => 'DESC'],
)]
#[ApiFilter(SearchFilter::class, properties: ['category' => 'exact', 'parent' => 'exact'])]
#[ApiFilter(HomebrewSearchFilter::class)]
#[ApiFilter(HomebrewScopeFilter::class)]
#[ApiFilter(TagFilter::class)]
#[ApiFilter(PopularityFilter::class)]
class HomebrewEntry
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['homebrew:read'])]
    private ?int $id = null;

    // ON DELETE CASCADE : supprimer son compte supprime les entrées de bibliothèque qu'on
    // possède, y compris publiques — un favori/commentaire d'un tiers qui pointait dessus
    // devient orphelin et disparaît simplement de l'affichage (déjà géré côté front).
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    // Catégorie (type de contenu) : validée côté front via une liste (sort, race, classe…).
    #[ORM\Column(length: 40)]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?string $category = null;

    #[ORM\Column(length: 255)]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?string $description = null;

    // 'private' (par défaut) ou 'public' (bibliothèque communautaire).
    #[ORM\Column(length: 20, options: ['default' => 'private'])]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private string $visibility = 'private';

    /**
     * Voie parente d'une capacité. Nul pour une entrée autonome — les capacités créées
     * avant l'imbrication n'ont pas de parent et doivent continuer de fonctionner.
     */
    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: true, onDelete: 'CASCADE')]
    #[ApiProperty(readableLink: false, writableLink: false)]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?HomebrewEntry $parent = null;

    /**
     * Champs structurés propres à la catégorie (schéma-less, comme CustomCreature.stats) :
     * p. ex. race → {modifiers, speed, minHeight…} ; sort → {rank, effect…}. Le schéma
     * par catégorie est porté côté front (homebrewSchemas.ts).
     */
    #[ORM\Column(nullable: true)]
    #[Groups(['homebrew:read', 'homebrew:write'])]
    private ?array $data = null;

    #[ORM\Column]
    #[Groups(['homebrew:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['homebrew:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\ManyToMany(targetEntity: Tag::class)]
    #[ORM\JoinTable(name: 'homebrew_entry_tag')]
    private Collection $tagEntities;

    /**
     * Écriture uniquement : noms de tags bruts envoyés par le client (`["boss","urbain"]`),
     * résolus (find-or-create, normalisés) par HomebrewEntryStateProcessor via TagResolver —
     * jamais persistés tels quels. `null` (jamais envoyé) signifie « ne pas toucher aux tags
     * existants » ; `[]` signifie « les retirer tous » — distinction nécessaire pour qu'un
     * PATCH qui ne parle pas des tags ne les efface pas silencieusement.
     */
    private ?array $rawTagNames = null;

    public function __construct()
    {
        $this->tagEntities = new ArrayCollection();
    }

    #[Groups(['homebrew:read'])]
    public function getTags(): array
    {
        return array_map(static fn (Tag $t) => $t->getName(), $this->tagEntities->toArray());
    }

    #[Groups(['homebrew:write'])]
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

    #[Groups(['homebrew:read'])]
    public function getAuthorId(): ?int
    {
        return $this->owner?->getId();
    }

    #[Groups(['homebrew:read'])]
    public function getAuthorPseudo(): ?string
    {
        return $this->owner?->getPseudo();
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

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;

        return $this;
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

    public function getVisibility(): string
    {
        return $this->visibility;
    }

    public function setVisibility(string $visibility): static
    {
        $this->visibility = $visibility;

        return $this;
    }

    public function getData(): ?array
    {
        return $this->data;
    }

    public function setData(?array $data): static
    {
        $this->data = $data;

        return $this;
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): static
    {
        $this->parent = $parent;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}
