<?php

namespace App\Controller\Admin;

use App\Entity\CreatureFamily;

class CreatureFamilyCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return CreatureFamily::class;
    }
}
