<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Campaign;
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
            Session::class !== $resourceClass
        ) {
            return;
        }

        $user = $this->security->getUser();
        if (null === $user) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];

        if (Campaign::class === $resourceClass || Character::class === $resourceClass) {
            // Owner is a direct relation on these entities
            $queryBuilder->andWhere(sprintf('%s.owner = :current_user', $rootAlias));
            $queryBuilder->setParameter('current_user', $user);
        } else {
            // For Quest, Clue, Session - filter by their campaign's owner
            $queryBuilder->join(sprintf('%s.campaign', $rootAlias), 'c');
            $queryBuilder->andWhere('c.owner = :current_user');
            $queryBuilder->setParameter('current_user', $user);
        }
    }
}
