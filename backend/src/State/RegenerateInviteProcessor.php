<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Campaign;
use App\Service\InviteCodeGenerator;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Régénère le code d'invitation d'une campagne (révocation de l'ancien code).
 */
final readonly class RegenerateInviteProcessor implements ProcessorInterface
{
    public function __construct(
        private InviteCodeGenerator $inviteCodeGenerator,
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * @param Campaign $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Campaign
    {
        $data->setInviteCode($this->inviteCodeGenerator->generate());
        $this->em->flush();

        return $data;
    }
}
