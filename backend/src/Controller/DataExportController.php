<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\CampaignRepository;
use App\Repository\CharacterRepository;
use App\Repository\CommentRepository;
use App\Repository\ContentReportRepository;
use App\Repository\CustomCreatureRepository;
use App\Repository\FavoriteRepository;
use App\Repository\HomebrewEntryRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * Export des données personnelles (portabilité, cf. l'état des lieux communauté — texte
 * légal à part, non couvert ici). Route en dehors d'API Platform, comme
 * PasswordResetController/EmailVerificationController, mais celle-ci exige une session :
 * `^/api` est PUBLIC_ACCESS au niveau du pare-feu (cf. security.yaml), donc l'authentification
 * est vérifiée ici à la main plutôt que déléguée à `#[IsGranted]`, pour renvoyer un 401
 * explicite (cohérent avec le reste de l'API) plutôt que la 403 par défaut de Symfony sur un
 * jeton anonyme.
 *
 * Réutilise le sérialiseur et les groupes de lecture déjà exposés par chaque ressource
 * (campaign:read, character:read…) : mêmes données qu'un GET normal sur sa propre collection,
 * rassemblées en un seul document — pas un nouveau modèle à maintenir en parallèle.
 */
class DataExportController extends AbstractController
{
    public function __construct(
        private readonly Security $security,
        private readonly SerializerInterface $serializer,
        private readonly CampaignRepository $campaigns,
        private readonly CharacterRepository $characters,
        private readonly CustomCreatureRepository $customCreatures,
        private readonly HomebrewEntryRepository $homebrewEntries,
        private readonly FavoriteRepository $favorites,
        private readonly CommentRepository $comments,
        private readonly ContentReportRepository $contentReports,
    ) {
    }

    #[Route('/api/me/export', name: 'api_export_my_data', methods: ['GET'])]
    public function export(): JsonResponse
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            return new JsonResponse(['message' => 'Authentification requise.'], 401);
        }

        $groupe = fn (array $entites, string $groupe) => json_decode(
            $this->serializer->serialize($entites, 'json', ['groups' => [$groupe]]),
            true
        );

        $data = [
            'exportedAt' => (new \DateTimeImmutable())->format(\DATE_ATOM),
            'compte' => [
                'email' => $user->getEmail(),
                'pseudo' => $user->getPseudo(),
                'roles' => $user->getRoles(),
            ],
            'campagnes' => $groupe($this->campaigns->findBy(['owner' => $user]), 'campaign:read'),
            'personnages' => $groupe($this->characters->findBy(['owner' => $user]), 'character:read'),
            'monstresMaison' => $groupe($this->customCreatures->findBy(['owner' => $user]), 'custom_creature:read'),
            'bibliotheque' => $groupe($this->homebrewEntries->findBy(['owner' => $user]), 'homebrew:read'),
            'favoris' => $groupe($this->favorites->findBy(['user' => $user]), 'favorite:read'),
            'commentaires' => $groupe($this->comments->findBy(['author' => $user]), 'comment:read'),
            'signalements' => $groupe($this->contentReports->findBy(['reporter' => $user]), 'content_report:read'),
        ];

        return new JsonResponse($data, 200, [
            'Content-Disposition' => 'attachment; filename="export-chroniques-oubliees.json"',
        ]);
    }
}
