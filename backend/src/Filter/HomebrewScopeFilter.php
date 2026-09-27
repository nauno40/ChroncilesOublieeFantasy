<?php

namespace App\Filter;

use ApiPlatform\Doctrine\Orm\Filter\FilterInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * `scope=mine|community` — l'onglet de la Bibliothèque (HomebrewBrowser.tsx). `owner`
 * n'est jamais exposé en lecture (aucun groupe de sérialisation dessus, seuls
 * `authorId`/`authorPseudo` le sont) donc ni `SearchFilter` ni aucun filtre déclaratif ne
 * peuvent le cibler — d'où ce filtre dédié, qui lit l'utilisateur courant lui-même plutôt
 * qu'un paramètre client.
 *
 * S'applique EN PLUS du scope déjà posé par CurrentUserExtension (owner = moi OU
 * visibility = public) : ce filtre ne fait que resserrer parmi ce qui est déjà visible,
 * jamais l'élargir — un visiteur anonyme demandant `scope=mine` obtient une liste vide
 * (`1 = 0`), pas une erreur, et jamais le contenu privé d'un tiers.
 */
final class HomebrewScopeFilter implements FilterInterface
{
    public function __construct(private readonly Security $security)
    {
    }

    public function apply(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $scope = $context['filters']['scope'] ?? null;
        if (!\in_array($scope, ['mine', 'community'], true)) {
            return;
        }

        $alias = $queryBuilder->getRootAliases()[0];
        $user = $this->security->getUser();

        if ('mine' === $scope) {
            if (null === $user) {
                $queryBuilder->andWhere('1 = 0');

                return;
            }
            $param = $queryNameGenerator->generateParameterName('scope_user');
            $queryBuilder->andWhere(sprintf('%s.owner = :%s', $alias, $param))->setParameter($param, $user);

            return;
        }

        // community : publique, et pas la mienne si je suis connecté (sinon « ma propre
        // création publique » apparaîtrait deux fois — sous Mes créations ET Communauté).
        $queryBuilder->andWhere(sprintf("%s.visibility = 'public'", $alias));
        if (null !== $user) {
            $param = $queryNameGenerator->generateParameterName('scope_user');
            $queryBuilder->andWhere(sprintf('%s.owner != :%s', $alias, $param))->setParameter($param, $user);
        }
    }

    public function getDescription(string $resourceClass): array
    {
        return [
            'scope' => [
                'property' => null,
                'type' => 'string',
                'required' => false,
                'description' => "'mine' (mes créations) ou 'community' (publique, hors les miennes).",
                'schema' => ['type' => 'string', 'enum' => ['mine', 'community']],
            ],
        ];
    }
}
