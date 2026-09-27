<?php

namespace App\Controller\Admin;

use App\Entity\Equipment;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class EquipmentCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Equipment::class;
    }
}
