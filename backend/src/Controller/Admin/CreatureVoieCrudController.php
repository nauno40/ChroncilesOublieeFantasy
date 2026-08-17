<?php

namespace App\Controller\Admin;

use App\Entity\CreatureVoie;

class CreatureVoieCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return CreatureVoie::class;
    }
}
