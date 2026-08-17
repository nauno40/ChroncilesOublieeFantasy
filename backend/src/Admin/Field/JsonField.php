<?php

namespace App\Admin\Field;

use App\Form\Type\JsonCodeType;
use EasyCorp\Bundle\EasyAdminBundle\Field\CodeEditorField;

/**
 * Champ d'administration pour une colonne JSON.
 *
 * Le langage déclaré est `js` : EasyAdmin n'accepte pas `json` dans sa liste de langages
 * colorisés, et la coloration JavaScript rend le JSON correctement.
 */
final class JsonField
{
    public static function new(string $propertyName, ?string $label = null): CodeEditorField
    {
        return CodeEditorField::new($propertyName, $label)
            ->setLanguage('js')
            ->setNumOfRows(10)
            ->setFormType(JsonCodeType::class)
            ->formatValue(static fn (mixed $value): string => null === $value
                ? ''
                : json_encode($value, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES));
    }
}
