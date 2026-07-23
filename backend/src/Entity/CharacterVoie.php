<?php
// backend/src/Entity/CharacterVoie.php
namespace App\Entity;

use App\Repository\CharacterVoieRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CharacterVoieRepository::class)]
class CharacterVoie
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['character:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'characterVoies')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Character $character = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['character:read', 'character:write'])]
    #[Assert\NotBlank]
    private ?Voie $voie = null;

    #[ORM\Column]
    #[Groups(['character:read', 'character:write'])]
    #[Assert\GreaterThanOrEqual(0)]
    private ?int $rank = 0;

    // profil | peuple | prestige | hybride
    #[ORM\Column(length: 20)]
    #[Groups(['character:read', 'character:write'])]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['profil', 'peuple', 'prestige', 'hybride', 'trait'])]
    private ?string $source = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?array $choices = null;

    public function getId(): ?int { return $this->id; }

    public function getCharacter(): ?Character { return $this->character; }
    public function setCharacter(?Character $character): static { $this->character = $character; return $this; }

    public function getVoie(): ?Voie { return $this->voie; }
    public function setVoie(?Voie $voie): static { $this->voie = $voie; return $this; }

    public function getRank(): ?int { return $this->rank; }
    public function setRank(int $rank): static { $this->rank = $rank; return $this; }

    public function getSource(): ?string { return $this->source; }
    public function setSource(string $source): static { $this->source = $source; return $this; }

    public function getChoices(): ?array { return $this->choices; }
    public function setChoices(?array $choices): static { $this->choices = $choices; return $this; }
}
