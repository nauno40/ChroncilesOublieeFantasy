<?php

namespace App\ApiResource;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\State\JoinCampaignProcessor;
use App\State\SharedCampaignProvider;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Vue en lecture seule d'une campagne pour un joueur membre : nom + résumés.
 * Aucune donnée secrète (notes, indices, quêtes) n'existe dans ce modèle.
 */
#[ApiResource(
    shortName: 'SharedCampaign',
    operations: [
        new GetCollection(
            uriTemplate: '/shared_campaigns',
            security: "is_granted('ROLE_USER')",
            provider: SharedCampaignProvider::class,
        ),
        new Get(
            uriTemplate: '/shared_campaigns/{id}',
            security: "is_granted('ROLE_USER')",
            provider: SharedCampaignProvider::class,
        ),
        new Post(
            uriTemplate: '/shared_campaigns/join',
            security: "is_granted('ROLE_USER')",
            input: JoinCampaignInput::class,
            processor: JoinCampaignProcessor::class,
            read: false,
        ),
    ],
    normalizationContext: ['groups' => ['shared_campaign:read']],
)]
final class SharedCampaign
{
    #[Groups(['shared_campaign:read'])]
    public ?int $id = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $name = null;

    #[Groups(['shared_campaign:read'])]
    public ?string $gameMaster = null;

    /** @var SharedSession[] */
    #[Groups(['shared_campaign:read'])]
    public array $sessions = [];
}
