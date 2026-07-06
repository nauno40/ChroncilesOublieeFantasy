<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\CustomCreature;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Pose l'utilisateur courant comme propriétaire d'un monstre custom à la création,
 * puis délègue à la persistance Doctrine. L'owner n'est jamais fourni par le client
 * (champ en lecture seule) : le scoping repose entièrement sur cette assignation.
 */
final readonly class CustomCreatureStateProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private ProcessorInterface $persistProcessor,
        private Security $security,
    ) {
    }

    /**
     * @param CustomCreature $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof CustomCreature && null === $data->getOwner()) {
            $user = $this->security->getUser();
            if ($user) {
                $data->setOwner($user);
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
