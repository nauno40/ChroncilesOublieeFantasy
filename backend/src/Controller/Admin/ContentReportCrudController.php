<?php

namespace App\Controller\Admin;

use App\Entity\ContentReport;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Signalements de contenu communautaire : consultables, jamais créés depuis le
 * back-office (ils viennent de l'API, posés par un membre), et modifiables sur le seul
 * champ `status` — le reste (déclarant, cible, motif, horodatages) est écrit par le
 * serveur et resterait faux si un administrateur pouvait le corriger à la main.
 *
 * Seul contrôleur du back-office ouvert à ROLE_MODERATOR (en plus de ROLE_ADMIN, qui
 * garde tout le reste) : traiter un signalement (lire/passer en resolved|dismissed) est
 * exactement ce qu'un bénévole doit pouvoir faire, sans accès aux notes privées des MJ ni
 * au compendium officiel. La suppression reste réservée à l'admin — un geste de nettoyage
 * plus radical que la modération courante (changer un statut), pas nécessaire au jour le jour.
 */
#[IsGranted(new Expression("is_granted('ROLE_ADMIN') or is_granted('ROLE_MODERATOR')"))]
class ContentReportCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return ContentReport::class;
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions
            ->disable(Action::NEW)
            ->setPermission(Action::DELETE, 'ROLE_ADMIN');
    }

    public function configureFields(string $pageName): iterable
    {
        foreach (parent::configureFields($pageName) as $field) {
            // `status` est un VARCHAR libre côté schéma (pas d'enum Postgres) : un champ
            // texte laisserait un administrateur taper autre chose que pending/resolved/
            // dismissed, valeur que ContentReportStateProcessor ne saurait plus interpréter.
            if ('status' === $field->getAsDto()->getProperty()) {
                yield ChoiceField::new('status')->setChoices(array_combine(ContentReport::STATUSES, ContentReport::STATUSES));
                continue;
            }

            yield $field;
        }
    }

    protected function readOnlyFields(): array
    {
        return ['reporter', 'targetType', 'targetId', 'reason', 'resolvedBy', 'resolvedAt', 'createdAt'];
    }
}
