<?php

namespace App\Controller\Admin;

use EasyCorp\Bundle\EasyAdminBundle\Config\Action;
use EasyCorp\Bundle\EasyAdminBundle\Config\Actions;
use EasyCorp\Bundle\EasyAdminBundle\Config\Crud;

/**
 * Base des sections qui montrent des données appartenant à un utilisateur.
 *
 * Consulter et supprimer, jamais créer ni modifier : ces données sont écrites par le front,
 * qui applique des règles (propriétaire, appartenance à la campagne, dérivations de la
 * fiche) qu'un formulaire EasyAdmin ignore. Écrire `Character.caracs` à la main produirait
 * une fiche que le front refuserait d'ouvrir.
 *
 * `disable()` ferme aussi les routes, pas seulement les boutons.
 */
abstract class AbstractReadDeleteCrudController extends AbstractWritableCrudController
{
    public function configureActions(Actions $actions): Actions
    {
        return $actions
            ->add(Crud::PAGE_INDEX, Action::DETAIL)
            ->disable(Action::NEW, Action::EDIT);
    }
}
