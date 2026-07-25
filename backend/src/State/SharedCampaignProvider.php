<?php

namespace App\State;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Campaign;
use App\Factory\SharedCampaignFactory;
use App\Repository\CampaignMembershipRepository;
use App\Repository\CampaignRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Alimente la vue joueur (SharedCampaign) à partir des campagnes visibles par l'utilisateur
 * courant : celles qu'il a rejointes (membre) ET celles dont il est propriétaire (MJ testant
 * son propre personnage). Lit les entités au repository, hors du scope propriétaire.
 */
final readonly class SharedCampaignProvider implements ProviderInterface
{
    public function __construct(
        private Security $security,
        private CampaignMembershipRepository $memberships,
        private CampaignRepository $campaigns,
        private SharedCampaignFactory $factory,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $user = $this->security->getUser();
        if (null === $user) {
            return $operation instanceof CollectionOperationInterface ? [] : null;
        }

        // Campagnes rejointes (membre) + campagnes possédées, dédupliquées par id.
        $byId = [];
        foreach ($this->memberships->findCampaignsForPlayer($user) as $c) {
            $byId[$c->getId()] = $c;
        }
        foreach ($this->campaigns->findBy(['owner' => $user]) as $c) {
            $byId[$c->getId()] = $c;
        }

        if ($operation instanceof CollectionOperationInterface) {
            return array_map(fn (Campaign $c) => $this->factory->fromCampaign($c), array_values($byId));
        }

        $campaign = $byId[(int) ($uriVariables['id'] ?? 0)] ?? null;

        return $campaign ? $this->factory->fromCampaign($campaign) : null; // sinon 404
    }
}
