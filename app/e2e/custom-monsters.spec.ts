import { test, expect, register, uniqueEmail } from './fixtures';

// Compte MJ frais à chaque test (isolation : pas de dépendance à des données partagées).
test.describe('Monstres custom (MJ)', () => {
    test.beforeEach(async ({ page }) => {
        await register(page, uniqueEmail('mj'));
    });

    test('créer un monstre puis le retrouver dans le Suivi de Combat', async ({ page }) => {
        const monsterName = `Gobelin ${Date.now()}`;

        await page.goto('/tools/monsters');

        // Ouvre le formulaire de création.
        await page.getByRole('button', { name: /nouveau monstre/i }).first().click();

        // Renseigne le nom (les autres champs ont des valeurs par défaut valides).
        await page.getByPlaceholder(/gobelin/i).first().fill(monsterName);

        // Enregistre.
        await page.getByRole('button', { name: /^enregistrer/i }).click();

        // Le monstre apparaît dans la liste.
        await expect(page.getByRole('heading', { name: monsterName })).toBeVisible({ timeout: 15_000 });

        // Il est importable dans le Suivi de Combat via l'optgroup « Mes monstres ».
        await page.goto('/tools/tracker');
        const option = page.locator('optgroup[label="Mes monstres"] option', { hasText: monsterName });
        await expect(option).toHaveCount(1, { timeout: 15_000 });
    });
});
