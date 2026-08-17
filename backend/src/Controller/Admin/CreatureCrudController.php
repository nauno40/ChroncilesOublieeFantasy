<?php

namespace App\Controller\Admin;

use App\Entity\Creature;

class CreatureCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Creature::class;
    }
}
