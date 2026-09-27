<?php

namespace App\Controller\Admin;

use App\Entity\Profile;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[IsGranted('ROLE_ADMIN')]
class ProfileCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return Profile::class;
    }
}
