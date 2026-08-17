<?php

namespace App\Controller\Admin;

use App\Entity\CustomCreature;

class CustomCreatureCrudController extends AbstractReadDeleteCrudController
{
    public static function getEntityFqcn(): string
    {
        return CustomCreature::class;
    }
}
