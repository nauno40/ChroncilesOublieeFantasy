<?php

namespace App\Tests\Form;

use App\Form\DataTransformer\JsonToStringTransformer;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Form\Exception\TransformationFailedException;

/**
 * Test pur : ni base de données ni noyau Symfony.
 */
final class JsonToStringTransformerTest extends TestCase
{
    private JsonToStringTransformer $transformer;

    protected function setUp(): void
    {
        $this->transformer = new JsonToStringTransformer();
    }

    public function testNullBecomesAnEmptyString(): void
    {
        self::assertSame('', $this->transformer->transform(null));
    }

    public function testArrayIsRenderedIndentedAndUnescaped(): void
    {
        $rendered = $this->transformer->transform(['nom' => 'Épée', 'url' => 'a/b']);

        self::assertStringContainsString('"Épée"', $rendered, 'L\'accent ne doit pas être échappé en \\u00e9.');
        self::assertStringContainsString('"a/b"', $rendered, 'La barre oblique ne doit pas être échappée.');
        self::assertStringContainsString("\n", $rendered, 'Le JSON doit être indenté pour être relisible.');
    }

    public function testEmptyInputBecomesNull(): void
    {
        self::assertNull($this->transformer->reverseTransform(''));
        self::assertNull($this->transformer->reverseTransform("  \n "));
        self::assertNull($this->transformer->reverseTransform(null));
    }

    public function testValidJsonBecomesAnArray(): void
    {
        self::assertSame(['bonuses' => ['DEF' => 2]], $this->transformer->reverseTransform('{"bonuses":{"DEF":2}}'));
    }

    public function testInvalidJsonIsRejectedWithAReadableMessage(): void
    {
        $this->expectException(TransformationFailedException::class);
        $this->transformer->reverseTransform('{"bonuses":');
    }

    public function testScalarJsonIsRejected(): void
    {
        // Les colonnes visées sont des tableaux : accepter `42` produirait une valeur que
        // Doctrine refuserait d'écrire, bien plus loin et avec un message illisible.
        $this->expectException(TransformationFailedException::class);
        $this->transformer->reverseTransform('42');
    }
}
