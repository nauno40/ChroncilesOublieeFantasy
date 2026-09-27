<?php

namespace App\Controller\Admin;

use App\Entity\Mount;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class MountCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Mount::class;
    }
}
