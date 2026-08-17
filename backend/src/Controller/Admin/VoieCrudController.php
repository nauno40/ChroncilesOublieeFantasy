<?php

namespace App\Controller\Admin;

use App\Entity\Voie;

class VoieCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Voie::class;
    }
}
