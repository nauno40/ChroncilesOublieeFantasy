<?php

namespace App\Entity\Trait;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Champs communs à une fiche de créature, partagés par {@see \App\Entity\Creature}
 * (compendium public) et {@see \App\Entity\CustomCreature} (monstre maison d'un MJ).
 *
 * Les deux entités gardent leur configuration API et leur sécurité propres (lecture
 * publique vs owner-scopée) ; seule la duplication des colonnes et des accesseurs est
 * factorisée ici. Chaque propriété porte les groupes de sérialisation des deux entités,
 * chacune ne sérialisant que ceux de son propre contexte.
 */
trait CreatureProfileTrait
{
    #[ORM\Column(length: 255)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?string $description = null;

    #[ORM\Column]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?int $nc = null;

    #[ORM\Column]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?int $hp = null;

    #[ORM\Column]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?int $def = null;

    #[ORM\Column]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?int $init = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?array $stats = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?array $specialAbilities = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?array $attacks = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?array $capabilities = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?string $picture = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?string $category = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?string $environment = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?string $archetype = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['creature:read', 'creature:write', 'custom_creature:read', 'custom_creature:write'])]
    private ?string $size = null;

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getNc(): ?int { return $this->nc; }
    public function setNc(int $nc): static { $this->nc = $nc; return $this; }

    public function getHp(): ?int { return $this->hp; }
    public function setHp(int $hp): static { $this->hp = $hp; return $this; }

    public function getDef(): ?int { return $this->def; }
    public function setDef(int $def): static { $this->def = $def; return $this; }

    public function getInit(): ?int { return $this->init; }
    public function setInit(int $init): static { $this->init = $init; return $this; }

    public function getStats(): ?array { return $this->stats; }
    public function setStats(?array $stats): static { $this->stats = $stats; return $this; }

    public function getSpecialAbilities(): ?array { return $this->specialAbilities; }
    public function setSpecialAbilities(?array $specialAbilities): static { $this->specialAbilities = $specialAbilities; return $this; }

    public function getAttacks(): ?array { return $this->attacks; }
    public function setAttacks(?array $attacks): static { $this->attacks = $attacks; return $this; }

    public function getCapabilities(): ?array { return $this->capabilities; }
    public function setCapabilities(?array $capabilities): static { $this->capabilities = $capabilities; return $this; }

    public function getPicture(): ?string { return $this->picture; }
    public function setPicture(?string $picture): static { $this->picture = $picture; return $this; }

    public function getCategory(): ?string { return $this->category; }
    public function setCategory(?string $category): static { $this->category = $category; return $this; }

    public function getEnvironment(): ?string { return $this->environment; }
    public function setEnvironment(?string $environment): static { $this->environment = $environment; return $this; }

    public function getArchetype(): ?string { return $this->archetype; }
    public function setArchetype(?string $archetype): static { $this->archetype = $archetype; return $this; }

    public function getSize(): ?string { return $this->size; }
    public function setSize(?string $size): static { $this->size = $size; return $this; }
}
