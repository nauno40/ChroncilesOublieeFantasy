<?php

namespace App\Controller\Admin;

use App\Entity\Race;

class RaceCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Race::class;
    }
}
