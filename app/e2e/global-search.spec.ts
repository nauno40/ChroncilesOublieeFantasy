import { test, expect, login } from './fixtures';

// La recherche globale agrège dix collections du compendium. Le bloc des créatures est
// resté muet pendant des mois après la normalisation de l'API (il lisait encore la forme
// d'export Drupal) sans qu'aucune erreur ne le signale : un try/catch par entrée avalait
// le reste. Ce test existe pour que ce silence ne se reproduise pas.

const ouvrir = async (page: Parameters<Parameters<typeof test>[1]>[0]['page']) => {
    await page.keyboard.press('Escape');
    await page.locator('button[title*="Rechercher"]').first().click();
    await page.locator('input[type="text"]').first().waitFor();
};

test.describe('Recherche globale', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'nauno40@gmail.com', 'chroniques');
        await page.goto('/dashboard');
    });

    // Un terme par famille de contenu : si l'une cesse d'être indexée, elle tombe seule.
    for (const [famille, terme] of [
        ['créature', 'Troll'],
        ['capacité', 'Projectile de mana'],
        ['classe', 'Magicien'],
        ['peuple', 'Elfe sylvain'],
        ['voie', 'Magie Destructrice'],
        ['état', 'Renversé'],
        ['arme', 'Épée longue'],
        ['matériel', 'Torche'],
    ] as const) {
        test(`indexe les ${famille}s`, async ({ page }) => {
            await ouvrir(page);
            await page.locator('input[type="text"]').first().fill(terme);
            await expect(page.getByText(terme, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
        });
    }

    test('valider un résultat ouvre sa fiche', async ({ page }) => {
        await ouvrir(page);
        await page.locator('input[type="text"]').first().fill('Troll');
        await expect(page.getByText('Troll').first()).toBeVisible({ timeout: 10_000 });
        // On clique le résultat plutôt que de valider au clavier : l'écouteur clavier vit
        // sur `window` et se réabonne à chaque changement de résultats, ce qui rend
        // l'instant de la validation dépendant du rendu. Le clic teste la même destination
        // sans cette dépendance.
        await page.getByRole('button', { name: /Troll/ }).first().click();
        await expect(page).toHaveURL(/\/bestiary\/\d+/);
        await expect(page.getByText('Troll').first()).toBeVisible();
    });
});
