<?php

namespace App\Controller\Admin;

use App\Entity\Encounter;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class EncounterCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Encounter::class;
    }
}
