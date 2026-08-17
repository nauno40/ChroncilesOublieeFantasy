<?php

namespace App\Form\Type;

use App\Form\DataTransformer\JsonToStringTransformer;
use EasyCorp\Bundle\EasyAdminBundle\Form\Type\CodeEditorType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;

/**
 * L'éditeur de code d'EasyAdmin, branché sur une colonne `json` de Doctrine.
 */
final class JsonCodeType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->addModelTransformer(new JsonToStringTransformer());
    }

    public function getParent(): string
    {
        return CodeEditorType::class;
    }
}
