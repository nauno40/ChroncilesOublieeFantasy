<?php

namespace App\Controller\Admin;

use App\Entity\Race;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;

/**
 * Pas de `configureFields()` ici, et c'est délibéré : la fiche d'une race porte une
 * vingtaine de champs (modificateurs, tailles et poids, âge, traits physiques, noms
 * typiques…) que la configuration automatique d'EasyAdmin expose toutes. La liste
 * explicite qui figurait ici n'en gardait que deux — et nommait `title`, un champ que
 * l'entité n'a jamais eu, ce qui faisait répondre 500 à la page entière.
 */
class RaceCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Race::class;
    }
}
