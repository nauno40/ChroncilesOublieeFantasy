<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\Metadata\Post;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Comment;
use App\Entity\CustomCreature;
use App\Entity\HomebrewEntry;
use App\Entity\User;
use App\Repository\CustomCreatureRepository;
use App\Repository\HomebrewEntryRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Pose l'auteur et l'horodatage (jamais fournis par le client), et refuse de commenter une
 * cible introuvable ou non visible (privée et pas la sienne) — une seule et même 404, pour
 * ne rien révéler de l'existence d'un contenu privé d'autrui.
 */
final readonly class CommentStateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
        private HomebrewEntryRepository $homebrewEntries,
        private CustomCreatureRepository $customCreatures,
    ) {
    }

    /**
     * @param Comment $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($operation instanceof Post) {
            /** @var User $user */
            $user = $this->security->getUser();
            $data->setAuthor($user);
            $data->setCreatedAt(new \DateTimeImmutable());

            if (null === $this->findVisibleTarget($data->getTargetType(), $data->getTargetId(), $user)) {
                throw new NotFoundHttpException('Cible du commentaire introuvable.');
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }

    private function findVisibleTarget(?string $targetType, ?int $targetId, User $user): HomebrewEntry|CustomCreature|null
    {
        if (null === $targetType || null === $targetId) {
            return null;
        }

        $target = match ($targetType) {
            'homebrew_entry' => $this->homebrewEntries->find($targetId),
            'custom_creature' => $this->customCreatures->find($targetId),
            default => null,
        };

        if (null === $target) {
            return null;
        }

        if ('public' !== $target->getVisibility() && $target->getOwner()?->getId() !== $user->getId()) {
            return null;
        }

        return $target;
    }
}
