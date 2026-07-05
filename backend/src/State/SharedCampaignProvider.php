<?php

namespace App\State;

use ApiPlatform\Metadata\CollectionOperationInterface;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Campaign;
use App\Factory\SharedCampaignFactory;
use App\Repository\CampaignMembershipRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Alimente la vue joueur (SharedCampaign) à partir des campagnes où l'utilisateur
 * courant est membre. Lit les entités au repository, hors du scope propriétaire.
 */
final readonly class SharedCampaignProvider implements ProviderInterface
{
    public function __construct(
        private Security $security,
        private CampaignMembershipRepository $memberships,
        private SharedCampaignFactory $factory,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $user = $this->security->getUser();
        if (null === $user) {
            return $operation instanceof CollectionOperationInterface ? [] : null;
        }

        if ($operation instanceof CollectionOperationInterface) {
            return array_map(
                fn (Campaign $c) => $this->factory->fromCampaign($c),
                $this->memberships->findCampaignsForPlayer($user),
            );
        }

        $id = $uriVariables['id'] ?? null;
        foreach ($this->memberships->findCampaignsForPlayer($user) as $campaign) {
            if ($campaign->getId() === (int) $id) {
                return $this->factory->fromCampaign($campaign);
            }
        }

        return null; // non-membre ou inconnu -> 404
    }
}
