<?php

namespace App\Controller\Admin;

use App\Entity\Food;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class FoodCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Food::class;
    }
}
