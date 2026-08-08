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
    const toutes: Array<{ id: number; name: string; characters?: unknown[] }> = body.member || body['hydra:member'];
    // Une campagne PEUPLÉE : le générateur de rencontre compose selon la taille du groupe,
    // et une campagne vide ne lui donne rien à composer.
    const campagnes = toutes.filter(c => (c.characters?.length ?? 0) > 0).length > 0
        ? toutes.filter(c => (c.characters?.length ?? 0) > 0)
        : toutes;
    expect(campagnes.length, 'le MJ de démo doit avoir au moins une campagne').toBeGreaterThan(0);
    // On y va par son identifiant plutôt qu'en cliquant son nom : le nom apparaît deux fois
    // sur la page (carte et rappel), et `.first()` tombait parfois sur l'occurrence qui ne
    // navigue pas — le test échouait alors sur le panneau, pas sur ce qu'il vérifie.
    await page.goto(`/campaign/${campagnes[0].id}`);
}


// Vérifie le bouton « Ajouter un PJ » (menu créer / rattacher) sur la page de campagne.
// Se connecte comme le MJ de démo (nauno40@gmail.com / chroniques, fixtures chargées).
test.describe('Campagne — Ajouter un PJ', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'nauno40@gmail.com', 'chroniques');
    });

    test('modale créer / rattacher, et rattachement d’un perso existant', async ({ page }) => {
        const token = await getToken(page);
        const charName = `PJ Test ${Date.now()}`;

        // Un perso du MJ, non rattaché à une campagne, via l'API (candidat au rattachement).
        const res = await page.request.post(`${API_URL}/characters`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            data: { name: charName, level: 1 },
        });
        expect(res.ok()).toBeTruthy();

        // Ouvrir la 1re campagne du MJ.
        await ouvrirPremiereCampagne(page, token);
        await expect(page.getByRole('heading', { level: 3, name: 'Personnages' })).toBeVisible({ timeout: 15_000 });

        // La modale propose « Créer un nouveau » + la liste des persos à rattacher.
        await page.getByRole('button', { name: /ajouter un pj/i }).click();
        await expect(page.getByRole('button', { name: /créer un nouveau personnage/i })).toBeVisible();

        // Rattacher le perso créé → il apparaît dans la liste du panneau.
        await page.getByRole('button', { name: new RegExp(charName) }).click();
        await expect(page.getByRole('link', { name: new RegExp(charName) })).toBeVisible({ timeout: 15_000 });
    });

    test('« Créer un nouveau » redirige vers la fiche pré-liée à la campagne', async ({ page }) => {
        const token = await getToken(page);
        await ouvrirPremiereCampagne(page, token);
        await expect(page.getByRole('heading', { level: 3, name: 'Personnages' })).toBeVisible({ timeout: 15_000 });

        await page.getByRole('button', { name: /ajouter un pj/i }).click();
        await page.getByRole('button', { name: /créer un nouveau personnage/i }).click();
        await expect(page).toHaveURL(/\/characters\/new\?campaign=\d+/);
    });
});
