<?php

namespace App\Controller\Admin;

use App\Entity\Material;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class MaterialCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Material::class;
    }
}
