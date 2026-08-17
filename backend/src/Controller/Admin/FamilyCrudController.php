<?php

namespace App\Controller\Admin;

use App\Entity\Family;

class FamilyCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Family::class;
    }
}
