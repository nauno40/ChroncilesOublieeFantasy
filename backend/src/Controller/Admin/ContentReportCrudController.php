<?php

namespace App\Controller\Admin;

use App\Entity\ContentReport;
use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Field\ChoiceField;

/**
 * Signalements de contenu communautaire : consultables, jamais créés depuis le
 * back-office (ils viennent de l'API, posés par un membre), et modifiables sur le seul
 * champ `status` — le reste (déclarant, cible, motif, horodatages) est écrit par le
 * serveur et resterait faux si un administrateur pouvait le corriger à la main.
 */
class ContentReportCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return ContentReport::class;
    }

    public function configureActions(Actions $actions): Actions
    {
        return $actions->disable(Action::NEW);
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
