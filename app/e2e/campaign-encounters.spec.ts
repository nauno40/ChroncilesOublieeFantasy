import { type Page } from '@playwright/test';
import { test, expect, login, getToken, API_URL } from './fixtures';

// La liste des campagnes est rendue en cartes cliquables (`ContentCard`, refonte UI/UX) :
// il n'y a plus d'ancre `href` à viser. On ouvre la première campagne du MJ par son nom,
// lu depuis l'API — le test ne dépend donc d'aucun libellé écrit en dur.
async function ouvrirPremiereCampagne(page: Page, token: string): Promise<void> {
    const res = await page.request.get(`${API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/ld+json' },
    });
    const body = await res.json();
    const campagnes: Array<{ name: string }> = body.member || body['hydra:member'];
    expect(campagnes.length, 'le MJ de démo doit avoir au moins une campagne').toBeGreaterThan(0);
    await page.goto('/campaign');
    await page.getByText(campagnes[0].name, { exact: true }).first().click();
}


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

        await ouvrirPremiereCampagne(page, (await getToken(page))!);
        await expect(page.getByRole('heading', { level: 3, name: 'Rencontres' })).toBeVisible({ timeout: 15_000 });

        // Un monstre du MJ, choisi dans SES données plutôt qu'écrit en dur : les fixtures
        // de démonstration changent de bestiaire au fil des versions, et un nom figé fait
        // échouer le test pour une raison qui n'a rien à voir avec la rencontre.
        const monstres = await (await page.request.get(`${API_URL}/custom_creatures?pagination=false`, {
            headers: { Authorization: `Bearer ${(await getToken(page))!}`, Accept: 'application/ld+json' },
        })).json();
        const membres: Array<{ name: string }> = monstres.member || monstres['hydra:member'];
        expect(membres.length, 'le MJ de démo doit avoir au moins un monstre').toBeGreaterThan(0);
        const monstre = membres[0].name;

        // Ouvrir la modale de création.
        await page.getByRole('button', { name: /créer une rencontre/i }).click();
        const modal = page.locator('div.fixed.inset-0', { hasText: 'Créer une rencontre' });

        await modal.getByPlaceholder(/embuscade/i).fill(name);
        // Le sélecteur de créature est celui qui contient l'option (≠ select d'environnement du générateur).
        const creatureSelect = modal.locator('select', { has: page.getByRole('option', { name: monstre, exact: true }) });
        await creatureSelect.selectOption({ label: monstre });
        // La quantité du picker manuel est le dernier input number (après taille/niveau du générateur).
        await modal.locator('input[type="number"]').last().fill('2');
        await modal.getByRole('button', { name: /ajouter/i }).click();

        // Le roster affiche l'entrée avec sa quantité (le « 2× » distingue du <option>).
        await expect(modal.getByText(new RegExp(`2× ${monstre}`))).toBeVisible();

        await modal.getByRole('button', { name: /^enregistrer$/i }).click();

        // La rencontre apparaît dans le panneau.
        await expect(page.getByText(name)).toBeVisible({ timeout: 15_000 });

        // La lancer → redirection vers le tracker avec les combattants développés.
        // Viser la rencontre qu'on vient de créer : `.first()` lançait la première du
        // panneau — une rencontre préexistante de la campagne de démonstration.
        await page.locator('li', { hasText: name }).getByTitle('Lancer dans le Suivi de Combat').click();
        await expect(page).toHaveURL(/\/tools\/tracker/);
        await expect(page.getByText(`${monstre} 1`)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(`${monstre} 2`)).toBeVisible();
    });

    test('le générateur compose un roster selon l’environnement et la difficulté', async ({ page }) => {
        await ouvrirPremiereCampagne(page, (await getToken(page))!);
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
