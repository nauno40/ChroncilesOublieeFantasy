<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\HomebrewEntry;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

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
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
