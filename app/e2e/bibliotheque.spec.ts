import { type Page } from '@playwright/test';
import { test, expect, register, uniqueEmail, getToken, API_URL } from './fixtures';

// Bibliothèque communautaire : une voie porte ses capacités comme des entrées à part
// entière (`parent`), la fiche communautaire rend la même feuille que l'officielle, et
// les déclarations d'états y sont cliquables. Le contenu est posé par l'API — ce que ces
// tests gardent, c'est le RENDU, là où les tests unitaires ne voient rien.

async function createEntry(page: Page, token: string, body: Record<string, unknown>) {
    const res = await page.request.post(`${API_URL}/homebrew_entries`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: body,
    });
    expect(res.status()).toBe(201);
    return (await res.json())['@id'] as string;
}

test('une voie communautaire affiche ses capacités imbriquées', async ({ page }) => {
    await register(page, uniqueEmail('biblio'));
    const token = (await getToken(page))!;

    const voieIri = await createEntry(page, token, {
        category: 'voie',
        name: 'Voie du Guetteur',
        description: 'Surveiller, prévenir, disparaître.',
        visibility: 'private',
        data: { category: 'profil', maxRank: 5 },
    });

    await createEntry(page, token, {
        category: 'capacite',
        name: 'Œil du guetteur',
        visibility: 'private',
        parent: voieIri,
        data: { rank: 1, actionType: 'Libre', effect: ['+2 en Perception'], details: [] },
    });

    await page.goto(`/homebrew/${voieIri.split('/').pop()}`);

    await expect(page.getByRole('heading', { name: 'Voie du Guetteur' })).toBeVisible();
    // La capacité vient d'une AUTRE entrée : si l'imbrication ne se recharge pas, la voie
    // s'affiche en coquille vide sans que rien n'échoue par ailleurs.
    await expect(page.getByText('Œil du guetteur')).toBeVisible();
    await expect(page.getByText('+2 en Perception')).toBeVisible();
});

test('un état déclaré par une capacité communautaire mène à sa fiche', async ({ page }) => {
    await register(page, uniqueEmail('biblio'));
    const token = (await getToken(page))!;

    const capIri = await createEntry(page, token, {
        category: 'capacite',
        name: 'Coup de bouclier',
        visibility: 'private',
        data: { rank: 2, actionType: 'Attaque', effect: ['1d6 DM'], details: [], states: ['Renversé'] },
    });

    await page.goto(`/homebrew/${capIri.split('/').pop()}`);

    // Le compendium n'a pas de fiche d'état : le lien vise la liste filtrée.
    const lien = page.locator('a[href*="/states?q="]').first();
    await expect(lien).toBeVisible();
    await expect(lien).toContainText('Renversé');
});

test('le retour d’une fiche ouverte depuis la Bibliothèque y ramène', async ({ page }) => {
    await register(page, uniqueEmail('biblio'));
    const token = (await getToken(page))!;

    await createEntry(page, token, {
        category: 'race',
        name: 'Peuple des Brumes',
        description: 'Nés du brouillard des marches.',
        visibility: 'private',
        data: { modifiers: { PER: 1, CON: -1 }, speed: '10 m', abilities: 'Vision brumeuse' },
    });

    await page.goto('/bibliotheque');
    await page.getByText('Peuple des Brumes').first().click();

    await expect(page.getByRole('heading', { name: 'Peuple des Brumes' })).toBeVisible();
    // Sans provenance, le retour renverrait vers /races — pas là d'où l'on vient.
    const retour = page.getByRole('link', { name: /Retour à la Biblioth/i });
    await expect(retour).toBeVisible();
    await retour.click();
    await expect(page).toHaveURL(/\/bibliotheque/);
});
