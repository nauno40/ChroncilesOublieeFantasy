<?php

namespace App\Controller\Admin;

use App\Entity\Trap;

class TrapCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Trap::class;
    }
}
