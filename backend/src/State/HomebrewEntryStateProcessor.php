<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\HomebrewEntry;
use App\Repository\HomebrewEntryRepository;
use Doctrine\ORM\EntityManagerInterface;
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
        private HomebrewEntryRepository $repository,
        private EntityManagerInterface $entityManager,
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
                // Une entrée qui se prend elle-même pour parent casserait la hiérarchie.
                if ($parent === $data || (null !== $data->getId() && $parent->getId() === $data->getId())) {
                    throw new AccessDeniedException('Une entrée ne peut pas être son propre parent.');
                }
                // Le modèle ne prévoit qu'un seul niveau d'imbrication (une voie porte des
                // capacités) : un parent qui a lui-même un parent bornerait la profondeur à
                // trois niveaux et ouvrirait la porte à des cycles indirects (A → B → A).
                if (null !== $parent->getParent()) {
                    throw new AccessDeniedException("Le parent ne peut pas lui-même avoir un parent (un seul niveau d'imbrication est autorisé).");
                }
                // Un parent d'autrui ouvrirait la porte au rattachement frauduleux.
                if ($parent->getOwner() !== $this->security->getUser()) {
                    throw new AccessDeniedException("Le parent n'appartient pas à l'utilisateur courant.");
                }
                // La visibilité de l'enfant suit celle du parent : une voie publique dont
                // les capacités seraient privées s'afficherait vide pour ses lecteurs.
                $data->setVisibility($parent->getVisibility());
            } elseif (null !== $data->getId()) {
                // Entrée racine déjà en base (une voie) : si sa visibilité change, il faut
                // la propager à ses enfants déjà enregistrés — sinon une voie basculée en
                // public laisserait ses capacités privées, invisibles pour les lecteurs.
                // Comparaison à la valeur chargée en base (avant denormalisation de cette
                // requête), pas à une valeur par défaut : seul un changement effectif cascade.
                $originalData = $this->entityManager->getUnitOfWork()->getOriginalEntityData($data);
                $originalVisibility = $originalData['visibility'] ?? null;
                if (null !== $originalVisibility && $originalVisibility !== $data->getVisibility()) {
                    $children = $this->repository->findBy(['parent' => $data]);
                    foreach ($children as $child) {
                        // Ces entités sont déjà gérées par l'EntityManager : le flush effectué
                        // plus bas par le processeur de persistance embarque ces changements.
                        $child->setVisibility($data->getVisibility());
                    }
                }
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
