<?php

namespace App\Form\DataTransformer;

use Symfony\Component\Form\DataTransformerInterface;
use Symfony\Component\Form\Exception\TransformationFailedException;

/**
 * Les colonnes JSON du projet sont des tableaux PHP ; un éditeur de code manipule du texte.
 *
 * @implements DataTransformerInterface<?array, ?string>
 */
final class JsonToStringTransformer implements DataTransformerInterface
{
    public function transform(mixed $value): string
    {
        if (null === $value) {
            return '';
        }

        return json_encode($value, \JSON_PRETTY_PRINT | \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES);
    }

    public function reverseTransform(mixed $value): ?array
    {
        if (null === $value || '' === trim((string) $value)) {
            return null;
        }

        try {
            $decoded = json_decode((string) $value, true, 512, \JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new TransformationFailedException('JSON invalide : '.$exception->getMessage(), previous: $exception);
        }

        if (!\is_array($decoded)) {
            throw new TransformationFailedException('Le contenu doit être un objet ou un tableau JSON.');
        }

        return $decoded;
    }
}
