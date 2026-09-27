<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\FilterInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;

/**
 * Recherche plein texte sur `name` OU `description` (un seul paramètre `search` couvrant
 * les deux colonnes) — `SearchFilter` natif ne sait mapper qu'une propriété par paramètre,
 * pas un OU entre deux propriétés, d'où ce filtre dédié. Insensible à la casse (`LOWER`,
 * comme le faisait le filtrage client qu'il remplace, cf. HomebrewBrowser.tsx).
 */
final class HomebrewSearchFilter implements FilterInterface
{
    public function apply(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $search = $context['filters']['search'] ?? null;
        if (!\is_string($search) || '' === trim($search)) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];
        $param = $queryNameGenerator->generateParameterName('search');
        $queryBuilder
            ->andWhere(sprintf('LOWER(%s.name) LIKE :%s OR LOWER(%s.description) LIKE :%s', $alias, $param, $alias, $param))
            ->setParameter($param, '%'.mb_strtolower($search).'%');
    }

    public function getDescription(string $resourceClass): array
    {
        return [
            'search' => [
                'property' => null,
                'type' => 'string',
                'required' => false,
                'description' => 'Recherche insensible à la casse dans le nom et la description.',
            ],
        ];
    }
}
