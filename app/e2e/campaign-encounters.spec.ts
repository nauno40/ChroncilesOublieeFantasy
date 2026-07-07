import { test, expect, login } from './fixtures';

// Fonctionnalité Rencontre (MJ) : créer une rencontre sur une campagne, puis la
// lancer dans le Suivi de Combat. Compte de démo nauno40@gmail.com / chroniques.
test.describe('Campagne — Rencontres', () => {
    test.beforeEach(async ({ page }) => {
        // Accepte les éventuelles confirmations (écrasement d'un combat en cours).
        page.on('dialog', d => d.accept());
        await login(page, 'nauno40@gmail.com', 'chroniques');
    });

    test('créer une rencontre puis la lancer dans le Suivi de Combat', async ({ page }) => {
        const name = `Embuscade ${Date.now()}`;

        await page.goto('/campaign');
        await page.locator('a[href^="/campaign/"]').first().click();
        await expect(page.getByRole('heading', { level: 3, name: 'Rencontres' })).toBeVisible({ timeout: 15_000 });

        // Ouvrir la modale de création.
        await page.getByRole('button', { name: /créer une rencontre/i }).click();
        const modal = page.locator('div.fixed.inset-0', { hasText: 'Créer une rencontre' });

        await modal.getByPlaceholder(/embuscade/i).fill(name);
        // Un monstre custom du MJ (fixtures) : « Loup des Glaces », en 2 exemplaires.
        // Le sélecteur de créature est celui qui contient l'option (≠ select d'environnement du générateur).
        const creatureSelect = modal.locator('select', { has: page.getByRole('option', { name: 'Loup des Glaces' }) });
        await creatureSelect.selectOption({ label: 'Loup des Glaces' });
        // La quantité du picker manuel est le dernier input number (après taille/niveau du générateur).
        await modal.locator('input[type="number"]').last().fill('2');
        await modal.getByRole('button', { name: /ajouter/i }).click();

        // Le roster affiche l'entrée avec sa quantité (le « 2× » distingue du <option>).
        await expect(modal.getByText(/2× Loup des Glaces/)).toBeVisible();

        await modal.getByRole('button', { name: /^enregistrer$/i }).click();

        // La rencontre apparaît dans le panneau.
        await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });

        // La lancer → redirection vers le tracker avec les combattants développés.
        await page.getByTitle('Lancer dans le Suivi de Combat').first().click();
        await expect(page).toHaveURL(/\/tools\/tracker/);
        await expect(page.getByText('Loup des Glaces 1')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText('Loup des Glaces 2')).toBeVisible();
    });

    test('le générateur compose un roster selon l’environnement et la difficulté', async ({ page }) => {
        await page.goto('/campaign');
        await page.locator('a[href^="/campaign/"]').first().click();
        await expect(page.getByRole('heading', { level: 3, name: 'Rencontres' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('button', { name: /créer une rencontre/i }).click();
        const modal = page.locator('div.fixed.inset-0', { hasText: 'Créer une rencontre' });

        await modal.getByRole('button', { name: /^difficile$/i }).click();
        await modal.getByRole('button', { name: /^générer/i }).click();

        // Le nom est auto-rempli et au moins une créature est ajoutée au roster.
        await expect(modal.getByPlaceholder(/embuscade/i)).toHaveValue(/Rencontre —/);
        await expect(modal.getByLabel('Retirer').first()).toBeVisible();
    });
});
