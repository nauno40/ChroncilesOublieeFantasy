<?php

namespace App\Controller\Admin;

use App\Entity\User;
use EasyCorp\Bundle\EasyAdminBundle\Field\BooleanField;
use EasyCorp\Bundle\EasyAdminBundle\Field\IdField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;
use EasyCorp\Bundle\EasyAdminBundle\Field\ArrayField;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;

class UserCrudController extends AbstractWritableCrudController
{
    public static function getEntityFqcn(): string
    {
        return User::class;
    }

    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id')->hideOnForm(),
            TextField::new('email'),
            ArrayField::new('roles'),
            // Éditable : un administrateur doit pouvoir confirmer manuellement un compte
            // bloqué par un e-mail de confirmation jamais reçu (support), sans repasser
            // par le lien envoyé à l'inscription.
            BooleanField::new('isVerified', 'E-mail confirmé'),
            TextField::new('password')->setFormType(PasswordType::class)->onlyWhenCreating(),
        ];
    }
}
