<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\CustomCreature;
use App\Entity\Favorite;
use App\Entity\HomebrewEntry;
use App\Entity\User;
use App\Repository\CustomCreatureRepository;
use App\Repository\FavoriteRepository;
use App\Repository\HomebrewEntryRepository;
use App\Service\NotificationMailer;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * Pose le membre courant et l'horodatage (jamais fournis par le client), et refuse deux
 * cas que la contrainte d'unicité en base ne peut pas traduire proprement en réponse HTTP :
 * mettre son propre contenu en favori (ça n'a pas d'intérêt produit — « Mes créations »
 * fait déjà ce travail), et le mettre deux fois (la contrainte lèverait une exception SQL
 * brute, pas une 409 lisible).
 */
final readonly class FavoriteStateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
        private HomebrewEntryRepository $homebrewEntries,
        private CustomCreatureRepository $customCreatures,
        private FavoriteRepository $favorites,
        private NotificationMailer $notificationMailer,
    ) {
    }

    /**
     * @param Favorite $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $target = null;
        if ($operation instanceof Post) {
            /** @var User $user */
            $user = $this->security->getUser();
            $data->setUser($user);
            $data->setCreatedAt(new \DateTimeImmutable());

            $target = $this->findTarget($data->getTargetType(), $data->getTargetId());
            if (null === $target) {
                throw new NotFoundHttpException('Cible du favori introuvable.');
            }
            if ($target->getOwner()?->getId() === $user->getId()) {
                throw new AccessDeniedException('Impossible de mettre son propre contenu en favori.');
            }

            $existing = $this->favorites->findOneBy([
                'user' => $user,
                'targetType' => $data->getTargetType(),
                'targetId' => $data->getTargetId(),
            ]);
            if (null !== $existing) {
                throw new ConflictHttpException('Ce contenu est déjà dans vos favoris.');
            }
        }

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        if ($target instanceof HomebrewEntry || $target instanceof CustomCreature) {
            $this->notificationMailer->notifyNewFavorite($data, $target);
        }

        return $result;
    }

    private function findTarget(?string $targetType, ?int $targetId): HomebrewEntry|CustomCreature|null
    {
        if (null === $targetType || null === $targetId) {
            return null;
        }

        return match ($targetType) {
            'homebrew_entry' => $this->homebrewEntries->find($targetId),
            'custom_creature' => $this->customCreatures->find($targetId),
            default => null,
        };
    }
}
