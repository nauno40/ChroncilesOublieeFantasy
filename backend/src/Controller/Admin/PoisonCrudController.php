<?php

namespace App\Controller\Admin;

use App\Entity\Poison;

class PoisonCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Poison::class;
    }
}
