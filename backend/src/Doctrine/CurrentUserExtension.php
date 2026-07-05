<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Campaign;
use App\Entity\CampaignMembership;
use App\Entity\Character;
use App\Entity\Quest;
use App\Entity\Clue;
use App\Entity\Session;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

final readonly class CurrentUserExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(
        private Security $security,
    ) {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    public function applyToItem(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, array $identifiers, ?Operation $operation = null, array $context = []): void
    {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    private function addWhere(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if (
            Campaign::class !== $resourceClass &&
            Character::class !== $resourceClass &&
            Quest::class !== $resourceClass &&
            Clue::class !== $resourceClass &&
            Session::class !== $resourceClass &&
            CampaignMembership::class !== $resourceClass
        ) {
            return;
        }

        $user = $this->security->getUser();
        if (null === $user) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];

        if (Campaign::class === $resourceClass) {
            // Strictement propriétaire : les joueurs passent par SharedCampaign.
            $queryBuilder->andWhere(sprintf('%s.owner = :current_user', $rootAlias));
        } elseif (Character::class === $resourceClass) {
            // Propriétaire de la fiche OU MJ de la campagne à laquelle elle est rattachée.
            $queryBuilder
                ->leftJoin(sprintf('%s.campaign', $rootAlias), 'char_camp')
                ->andWhere(sprintf('%s.owner = :current_user OR char_camp.owner = :current_user', $rootAlias));
        } elseif (CampaignMembership::class === $resourceClass) {
            // Le joueur voit ses adhésions ; le MJ voit les membres de ses campagnes.
            $queryBuilder
                ->leftJoin(sprintf('%s.campaign', $rootAlias), 'ms_camp')
                ->andWhere(sprintf('%s.player = :current_user OR ms_camp.owner = :current_user', $rootAlias));
        } else {
            // Quest, Clue, Session : filtrés par le propriétaire de leur campagne.
            $queryBuilder
                ->join(sprintf('%s.campaign', $rootAlias), 'c')
                ->andWhere('c.owner = :current_user');
        }

        $queryBuilder->setParameter('current_user', $user);
    }
}
