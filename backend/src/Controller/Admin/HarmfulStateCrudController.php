<?php

namespace App\Controller\Admin;

use App\Entity\HarmfulState;

class HarmfulStateCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return HarmfulState::class;
    }
}
