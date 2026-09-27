<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\FilterInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\CustomCreature;
use App\Entity\HomebrewEntry;
use Doctrine\ORM\QueryBuilder;

/**
 * `order[popularity]=asc|desc` : trie par nombre de favoris. Sous-requête corrélée sur
 * `favorite`, jamais dénormalisé — pas de compteur à tenir à jour ni de risque de dérive si
 * une suppression de compte cascade sur des favoris sans repasser par FavoriteStateProcessor
 * (`ON DELETE CASCADE` sur `favorite.user_id`, cf. jalon C). `HIDDEN` : la sous-requête ne
 * sert qu'au tri, elle n'entre pas dans les objets hydratés.
 *
 * Un seul filtre pour les deux entités (HomebrewEntry et CustomCreature) : `targetType`
 * dépend de la classe de ressource, résolue ici plutôt que par deux classes quasi identiques.
 */
final class PopularityFilter implements FilterInterface
{
    private const TARGET_TYPES = [
        HomebrewEntry::class => 'homebrew_entry',
        CustomCreature::class => 'custom_creature',
    ];

    public function apply(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $direction = strtoupper((string) ($context['filters']['order']['popularity'] ?? ''));
        if (!\in_array($direction, ['ASC', 'DESC'], true)) {
            return;
        }

        $targetType = self::TARGET_TYPES[$resourceClass] ?? null;
        if (null === $targetType) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];
        $favAlias = $queryNameGenerator->generateJoinAlias('fav');
        $typeParam = $queryNameGenerator->generateParameterName('target_type');

        $queryBuilder
            ->addSelect(sprintf(
                "(SELECT COUNT(%1\$s.id) FROM App\\Entity\\Favorite %1\$s WHERE %1\$s.targetType = :%2\$s AND %1\$s.targetId = %3\$s.id) AS HIDDEN popularity",
                $favAlias, $typeParam, $alias
            ))
            ->addOrderBy('popularity', $direction)
            ->setParameter($typeParam, $targetType);
    }

    public function getDescription(string $resourceClass): array
    {
        return [
            'order[popularity]' => [
                'property' => null,
                'type' => 'string',
                'required' => false,
                'description' => 'Trie par nombre de favoris.',
                'schema' => ['type' => 'string', 'enum' => ['asc', 'desc']],
            ],
        ];
    }
}
