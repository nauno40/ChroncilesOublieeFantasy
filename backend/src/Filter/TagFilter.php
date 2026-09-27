<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\FilterInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;

/**
 * `tag=nom` : ne garde que les entrées portant ce tag. Générique — fonctionne pour
 * n'importe quelle ressource portant une relation `tagEntities` (HomebrewEntry,
 * CustomCreature) sans code par entité, contrairement à {@see \App\Filter\PopularityFilter}
 * qui doit distinguer `targetType` pour interroger `favorite`.
 */
final class TagFilter implements FilterInterface
{
    public function apply(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $tag = $context['filters']['tag'] ?? null;
        if (!\is_string($tag) || '' === trim($tag)) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];
        $joinAlias = $queryNameGenerator->generateJoinAlias('tag');
        $param = $queryNameGenerator->generateParameterName('tag');

        $queryBuilder
            ->join(sprintf('%s.tagEntities', $alias), $joinAlias)
            ->andWhere(sprintf('LOWER(%s.name) = :%s', $joinAlias, $param))
            ->setParameter($param, mb_strtolower(trim($tag)));
    }

    public function getDescription(string $resourceClass): array
    {
        return [
            'tag' => [
                'property' => null,
                'type' => 'string',
                'required' => false,
                'description' => 'Ne garde que les entrées portant ce tag (nom exact, insensible à la casse).',
            ],
        ];
    }
}
