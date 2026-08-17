<?php

namespace App\Controller\Admin;

use App\Entity\Mount;

class MountCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Mount::class;
    }
}
