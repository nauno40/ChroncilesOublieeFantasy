<?php

namespace App\Repository;

use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CampaignMembership>
 */
class CampaignMembershipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CampaignMembership::class);
    }

    public function findOneByCampaignAndPlayer(Campaign $campaign, User $player): ?CampaignMembership
    {
        return $this->findOneBy(['campaign' => $campaign, 'player' => $player]);
    }

    /**
     * @return Campaign[]
     */
    public function findCampaignsForPlayer(User $player): array
    {
        return array_map(
            static fn (CampaignMembership $m) => $m->getCampaign(),
            $this->findBy(['player' => $player]),
        );
    }
}
