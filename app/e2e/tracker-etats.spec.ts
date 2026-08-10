import { test, expect } from '@playwright/test';
import { register, uniqueEmail } from './fixtures';

// Les états d'un combattant étaient listés mais jamais cumulés : le suivi de combat
// affichait la DEF de la fiche, à charge du MJ de faire la somme à chaque attaque.
test('le suivi de combat cumule les états sur la DEF', async ({ page }) => {
    await register(page, uniqueEmail('tracker'));
    await page.goto('/tools/tracker');

    await page.fill('input[placeholder="Nom du combattant"]', 'Ogre');
    const nombres = page.locator('input[type=number]');
    await nombres.nth(0).fill('12');
    await nombres.nth(1).fill('30');
    await nombres.nth(2).fill('15');
    await page.click('button:has-text("Ajouter")');

    await expect(page.getByText('DEF 15')).toBeVisible();

    // Aveuglé et Renversé retirent 5 de DEF chacun : ce sont deux pénalités distinctes.
    for (const etat of ['Aveuglé', 'Renversé']) {
        await page.selectOption('select:has(option:text-is("+ État"))', etat);
    }

    await expect(page.getByText('DEF 5')).toBeVisible();
    await expect(page.getByText('(15 -10)')).toBeVisible();
    // Les deux états retirent aussi 5 en attaque chacun.
    await expect(page.getByText('ATT -10')).toBeVisible();
});

// Un état qui interdit d'agir doit se voir sans lire la fiche de l'état.
test('le suivi de combat annonce qu’un combattant ne peut pas agir', async ({ page }) => {
    await register(page, uniqueEmail('etourdi'));
    await page.goto('/tools/tracker');

    await page.fill('input[placeholder="Nom du combattant"]', 'Gobelin');
    const nombres = page.locator('input[type=number]');
    await nombres.nth(0).fill('10');
    await nombres.nth(1).fill('8');
    await nombres.nth(2).fill('13');
    await page.click('button:has-text("Ajouter")');

    await page.selectOption('select:has(option:text-is("+ État"))', 'Étourdi');
    await expect(page.getByText('Ne peut pas agir')).toBeVisible();
});
