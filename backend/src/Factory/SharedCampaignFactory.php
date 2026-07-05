<?php

namespace App\Factory;

use App\ApiResource\SharedCampaign;
use App\ApiResource\SharedSession;
use App\Entity\Campaign;
use App\Entity\Session;
use App\Repository\SessionRepository;

/**
 * Convertit une Campaign en vue joueur (SharedCampaign) : nom + résumés uniquement.
 * Aucune donnée secrète (notes, indices, quêtes) n'est mappée.
 */
final class SharedCampaignFactory
{
    public function __construct(
        private readonly SessionRepository $sessions,
    ) {
    }

    public function fromCampaign(Campaign $campaign): SharedCampaign
    {
        $dto = new SharedCampaign();
        $dto->id = $campaign->getId();
        $dto->name = $campaign->getName();
        $dto->gameMaster = $campaign->getOwner()?->getPseudo();
        // Requête directe (plutôt que $campaign->getSessions()) : dans certains contextes
        // (ex. tests fonctionnels sans reboot du kernel) la collection en mémoire peut être
        // périmée si la session a été rattachée côté propriétaire seulement.
        $dto->sessions = array_map(
            fn (Session $s) => $this->sessionDto($s),
            $this->sessions->findBy(['campaign' => $campaign], ['date' => 'ASC']),
        );

        return $dto;
    }

    private function sessionDto(Session $s): SharedSession
    {
        $dto = new SharedSession();
        $dto->id = $s->getId();
        $dto->title = $s->getTitle();
        $dto->date = $s->getDate()?->format('Y-m-d');
        $dto->summary = $s->getSummary();

        return $dto;
    }
}
