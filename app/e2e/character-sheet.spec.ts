import { test, expect, register, uniqueEmail } from './fixtures';

test.describe('Fiche personnage', () => {
    test.beforeEach(async ({ page }) => {
        await register(page, uniqueEmail('sheet'));
    });

    test('la fiche de création affiche ses sections et valeurs dérivées', async ({ page }) => {
        await page.goto('/characters/new');

        // Sections clés de l'orchestrateur refactorisé (texte du DOM, insensible à la casse).
        await expect(page.getByText(/caractéristiques/i).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/points de vie/i).first()).toBeVisible();
        await expect(page.getByText('Initiative').first()).toBeVisible();
        await expect(page.getByText('Défense').first()).toBeVisible();
        await expect(page.getByText(/voies/i).first()).toBeVisible();
    });

    test('les races du compendium alimentent le sélecteur de race', async ({ page }) => {
        await page.goto('/characters/new');

        // IdentityBlock est rendu avant ProtectionSection → le 1er <select> est la race.
        const raceSelect = page.locator('select').first();
        await expect(raceSelect).toBeVisible({ timeout: 15_000 });

        // Placeholder + une option par race seedée (>= 8).
        await expect
            .poll(() => raceSelect.locator('option').count(), { timeout: 15_000 })
            .toBeGreaterThanOrEqual(9);

        // Sélectionner une race renseigne une IRI non vide (flux données → fiche).
        await raceSelect.selectOption({ index: 1 });
        expect(await raceSelect.inputValue()).not.toBe('');
    });
});
