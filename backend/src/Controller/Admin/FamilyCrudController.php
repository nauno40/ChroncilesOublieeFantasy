<?php

namespace App\Controller\Admin;

use App\Entity\Family;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\Field;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IntegerField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextEditorField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class FamilyCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return Family::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('name'),
            TextEditorField::new('description'),
            IntegerField::new('baseHp'),
            TextField::new('recoveryDie'),
            IntegerField::new('luckPoints'),
            TextField::new('manaStat'),
        ];
    }
}
