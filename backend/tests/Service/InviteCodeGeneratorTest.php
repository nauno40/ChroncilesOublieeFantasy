<?php

namespace App\Tests\Service;

use App\Service\InviteCodeGenerator;
use PHPUnit\Framework\TestCase;

/**
 * Code d'invitation d'une campagne : il se lit à voix haute et se recopie à la main.
 * C'est tout son contrat — et rien d'autre ne le garde.
 */
final class InviteCodeGeneratorTest extends TestCase
{
    private InviteCodeGenerator $generateur;

    protected function setUp(): void
    {
        $this->generateur = new InviteCodeGenerator();
    }

    public function testLeCodeAHuitCaracteresParDefaut(): void
    {
        $this->assertSame(8, \strlen($this->generateur->generate()));
        $this->assertSame(4, \strlen($this->generateur->generate(4)));
    }

    public function testLeCodeNeContientAucunCaractereAmbigu(): void
    {
        // Les paires qui se confondent à l'écrit sont écartées de l'alphabet : O/0 et I/1.
        // Le L reste — il n'est ambigu qu'avec le 1, lequel n'est plus dans l'alphabet.
        $ambigus = ['O', '0', 'I', '1'];
        for ($i = 0; $i < 200; $i++) {
            $code = $this->generateur->generate();
            foreach ($ambigus as $caractere) {
                $this->assertStringNotContainsString($caractere, $code, "Code ambigu généré : $code");
            }
        }
    }

    public function testLeCodeNUtiliseQueDesMajusculesEtDesChiffres(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $this->assertMatchesRegularExpression('/^[A-Z2-9]+$/', $this->generateur->generate());
        }
    }

    public function testDeuxCodesConsecutifsDiffèrent(): void
    {
        // 32^8 possibilités : une collision sur 50 tirages signalerait un générateur figé.
        $codes = [];
        for ($i = 0; $i < 50; $i++) {
            $codes[] = $this->generateur->generate();
        }
        $this->assertCount(50, array_unique($codes));
    }
}
