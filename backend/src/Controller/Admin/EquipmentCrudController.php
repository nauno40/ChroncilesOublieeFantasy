<?php

namespace App\Controller\Admin;

use App\Entity\Equipment;

class EquipmentCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Equipment::class;
    }
}
