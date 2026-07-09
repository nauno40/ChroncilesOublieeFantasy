import { test, expect, register, uniqueEmail, getToken } from './fixtures';

// Régression : le nom et la description d'une campagne sont modifiables depuis
// la fiche de campagne (ils n'étaient qu'affichés auparavant) et la modification
// persiste après rechargement.
test('renommer une campagne depuis sa fiche persiste', async ({ page }) => {
    await register(page, uniqueEmail('camp'));
    const token = await getToken(page);

    const res = await page.request.post('http://localhost:8000/api/campaigns', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: { name: 'Nom Erroné', description: 'desc' },
    });
    const id = (await res.json())['@id'].split('/').pop();

    await page.goto(`/campaign/${id}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Nom Erroné' })).toBeVisible();

    // Ouvrir l'édition (bouton crayon), corriger le nom, enregistrer.
    await page.getByTitle(/modifier le nom/i).click();
    const nameInput = page.getByPlaceholder('Nom de la campagne');
    await nameInput.fill('Nom Corrigé');
    await expect(nameInput).toHaveValue('Nom Corrigé');
    await page.getByRole('button', { name: /enregistrer/i }).click();

    await expect(page.getByRole('heading', { name: 'Nom Corrigé' })).toBeVisible({ timeout: 15_000 });

    // Persiste après rechargement complet.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Nom Corrigé' })).toBeVisible({ timeout: 15_000 });
});

// Régression : une quête peut être éditée après création (et pas seulement cochée/supprimée).
test('modifier le texte d’une quête persiste', async ({ page }) => {
    await register(page, uniqueEmail('quest'));
    const token = await getToken(page);
    const res = await page.request.post('http://localhost:8000/api/campaigns', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: { name: 'Campagne Quêtes', description: '' },
    });
    const id = (await res.json())['@id'].split('/').pop();

    await page.goto(`/campaign/${id}`);
    await page.waitForLoadState('networkidle');

    // Ajouter une quête avec une faute.
    await page.getByTitle('Ajouter une quête').click();
    await page.getByPlaceholder('Nouvel objectif...').fill('Truver le trésor');
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click();
    await expect(page.getByText('Truver le trésor')).toBeVisible({ timeout: 15_000 });

    // La corriger via le bouton Modifier.
    await page.getByTitle('Modifier', { exact: true }).first().click();
    const input = page.locator('input:focus');
    await expect(input).toHaveValue('Truver le trésor');
    await input.fill('Trouver le trésor');
    await page.getByTitle('Enregistrer', { exact: true }).click();

    await expect(page.getByText('Trouver le trésor')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Truver le trésor')).toHaveCount(0);

    // Persiste après rechargement.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Trouver le trésor')).toBeVisible({ timeout: 15_000 });
});
