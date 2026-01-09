<?php

namespace App\Controller\Admin;

use App\Entity\CreatureFamily;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class CreatureFamilyCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return CreatureFamily::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('name'),
            TextEditorField::new('description'),
        ];
    }
}
