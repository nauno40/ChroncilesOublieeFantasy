<?php

namespace App\Controller\Admin;

use App\Entity\Lodging;

class LodgingCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Lodging::class;
    }
}
