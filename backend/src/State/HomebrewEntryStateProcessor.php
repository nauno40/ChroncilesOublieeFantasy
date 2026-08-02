<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\HomebrewEntry;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

/**
 * Pose l'owner (à la création) et les timestamps sur une entrée de bibliothèque homebrew,
 * puis délègue à la persistance Doctrine. L'owner n'est jamais fourni par le client.
 */
final readonly class HomebrewEntryStateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
    ) {
    }

    /**
     * @param HomebrewEntry $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof HomebrewEntry) {
            $now = new \DateTimeImmutable();
            if (null === $data->getOwner()) {
                $user = $this->security->getUser();
                if ($user) {
                    $data->setOwner($user);
                }
                $data->setCreatedAt($now);
            }
            $data->setUpdatedAt($now);

            $parent = $data->getParent();
            if (null !== $parent) {
                // Un parent d'autrui ouvrirait la porte au rattachement frauduleux.
                if ($parent->getOwner() !== $this->security->getUser()) {
                    throw new AccessDeniedException("Le parent n'appartient pas à l'utilisateur courant.");
                }
                // La visibilité de l'enfant suit celle du parent : une voie publique dont
                // les capacités seraient privées s'afficherait vide pour ses lecteurs.
                $data->setVisibility($parent->getVisibility());
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
