<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Étiquette libre posée sur du contenu communautaire (HomebrewEntry, CustomCreature) —
 * vocabulaire partagé entre bibliothèque et bestiaire maison, pour une découverte unifiée
 * (un même tag « boss » a du sens sur un sort comme sur une créature).
 *
 * Pas de curation ni de modération dédiée (choix par défaut, personne n'a demandé de
 * système plus lourd) : n'importe quel membre fait naître un tag en l'utilisant sur son
 * propre contenu ({@see TagResolver}, find-or-create, normalisé en minuscules). Un tag
 * jamais réutilisé reste juste orphelin en base — coût négligeable, pas de suppression
 * automatique qui casserait un lien pendant une modification concurrente.
 *
 * Lecture seule côté API : jamais de POST direct sur `/api/tags`, uniquement une
 * `GetCollection` publique pour l'auto-complétion (« tags déjà utilisés ») côté front.
 */
#[ORM\Entity(repositoryClass: \App\Repository\TagRepository::class)]
#[ApiResource(
    operations: [new GetCollection()],
    normalizationContext: ['groups' => ['tag:read']],
    order: ['name' => 'ASC'],
    paginationEnabled: false,
)]
class Tag
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['tag:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 30, unique: true)]
    #[Groups(['tag:read'])]
    private ?string $name = null;

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
}
