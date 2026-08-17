<?php

namespace App\Controller\Admin;

use App\Entity\Encounter;

class EncounterCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return Encounter::class;
    }
}
