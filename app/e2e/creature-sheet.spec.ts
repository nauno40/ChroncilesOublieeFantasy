import { test, expect } from '@playwright/test';
import { API_URL, register, uniqueEmail, getToken } from './fixtures';

// Régression : une créature maison n'avait aucune fiche — elle ne se consultait qu'en
// rouvrant son formulaire, et un visiteur qui n'en était pas l'auteur ne pouvait pas la
// lire du tout. Elle rend désormais la même feuille que le bestiaire officiel.
test('une créature maison se consulte comme une créature officielle', async ({ page }) => {
    await register(page, uniqueEmail('creature'));
    const token = await getToken(page);

    const reponse = await page.request.post(`${API_URL}/custom_creatures`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: {
            name: 'Veilleur des marais', description: 'Une silhouette voûtée.',
            nc: 4, hp: 32, def: 15, init: 11,
            stats: { AGI: 2, CON: 4, FOR: 3, PER: 2, CHA: -2, INT: -1, VOL: 1 },
            category: 'Aberration', environment: 'Marais', archetype: 'Embusqué', size: 'Grande',
            attacks: [{ name: 'Tentacule', atk: '+6', dm: '1d8+3', special: 'Agrippe sur 15+' }],
            capabilities: [{ name: 'Immersion', rank: 2, description: 'Disparaît sous l’eau.' }],
            visibility: 'public',
        },
    });
    const id = (await reponse.json())['@id'].split('/').pop();

    await page.goto(`/creatures/maison/${id}`);

    await expect(page.getByRole('heading', { name: 'Veilleur des marais' })).toBeVisible({ timeout: 20_000 });
    for (const attendu of ['NC 4', 'Aberration', 'Marais', 'Embusqué', 'Grande', 'Tentacule', '1d8+3', 'Immersion', 'Rang 2']) {
        await expect(page.getByText(attendu, { exact: false }).first()).toBeVisible();
    }
});

// La fiche doit être ATTEIGNABLE : posée sans lien, elle n'existerait pour personne.
test('la carte d’une créature maison mène à sa fiche', async ({ page }) => {
    await register(page, uniqueEmail('carte'));
    const token = await getToken(page);
    await page.request.post(`${API_URL}/custom_creatures`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: { name: 'Bête de test', nc: 1, hp: 10, def: 12, init: 10, visibility: 'private' },
    });

    await page.goto('/creatures');
    await page.click('button:has-text("Mes créations")');
    await page.click('text=Bête de test');

    await expect(page).toHaveURL(/\/creatures\/maison\/\d+$/);
    await expect(page.getByRole('heading', { name: 'Bête de test' })).toBeVisible();
});
