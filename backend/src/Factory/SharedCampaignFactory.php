<?php

namespace App\Factory;

use App\ApiResource\SharedCampaign;
use App\ApiResource\SharedClue;
use App\ApiResource\SharedQuest;
use App\ApiResource\SharedSession;
use App\Entity\Campaign;
use App\Entity\Clue;
use App\Entity\Quest;
use App\Entity\Session;
use App\Repository\ClueRepository;
use App\Repository\QuestRepository;
use App\Repository\SessionRepository;

/**
 * Convertit une Campaign en vue joueur (SharedCampaign) : nom + résumés de séances, plus les
 * quêtes et indices que le MJ a EXPLICITEMENT marqués comme partagés (`shared = true`).
 * Aucune autre donnée secrète (notes, statuts, éléments non partagés) n'est mappée.
 */
final class SharedCampaignFactory
{
    public function __construct(
        private readonly SessionRepository $sessions,
        private readonly QuestRepository $quests,
        private readonly ClueRepository $clues,
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
        // périmée si l'entité a été rattachée côté propriétaire seulement.
        $dto->sessions = array_map(
            fn (Session $s) => $this->sessionDto($s),
            $this->sessions->findBy(['campaign' => $campaign], ['date' => 'ASC']),
        );
        $dto->quests = array_map(
            fn (Quest $q) => $this->questDto($q),
            $this->quests->findBy(['campaign' => $campaign, 'shared' => true], ['id' => 'ASC']),
        );
        $dto->clues = array_map(
            fn (Clue $c) => $this->clueDto($c),
            $this->clues->findBy(['campaign' => $campaign, 'shared' => true], ['id' => 'ASC']),
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

    private function questDto(Quest $q): SharedQuest
    {
        $dto = new SharedQuest();
        $dto->id = $q->getId();
        $dto->title = $q->getTitle();
        $dto->description = $q->getDescription();
        $dto->type = $q->getType();

        return $dto;
    }

    private function clueDto(Clue $c): SharedClue
    {
        $dto = new SharedClue();
        $dto->id = $c->getId();
        $dto->content = $c->getContent();

        return $dto;
    }
}
