import { type Page } from '@playwright/test';
import { test, expect, register, uniqueEmail, getToken, API_URL, nettoyerDonnees } from './fixtures';

test.afterEach(async ({ page }) => {
    await nettoyerDonnees(page, await getToken(page));
});

// Le mode jeu (`/play/:id`) n'avait AUCUN test : une régression de hooks l'a rendu
// entièrement blanc sans que la suite ne bronche. Ces tests gardent d'abord qu'il s'affiche.

async function magicien(page: Page): Promise<string> {
    await register(page, uniqueEmail('play'));
    const token = (await getToken(page))!;
    const profs = await (await page.request.get(`${API_URL}/profiles?pagination=false`, {
        headers: { Accept: 'application/ld+json' },
    })).json();
    const membres: Array<{ name: string; '@id': string; voies?: Array<{ name: string; '@id': string }> }> =
        profs.member || profs['hydra:member'];
    const mage = membres.find(p => p.name === 'Magicien')!;

    const res = await page.request.post(`${API_URL}/characters`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: {
            name: 'Ionas', level: 9, profile: mage['@id'],
            caracs: { FOR: -1, AGI: 1, CON: 1, INT: 3, PER: 1, CHA: 0, VOL: 2 },
            characterVoies: mage.voies!.slice(0, 5).map(v => ({ voie: v['@id'], rank: 5, source: 'profil' })),
        },
    });
    expect(res.status()).toBe(201);
    return (await res.json())['@id'].split('/').pop();
}

test('le mode jeu s’affiche et porte ses compteurs', async ({ page }) => {
    const id = await magicien(page);
    await page.goto(`/play/${id}`);

    await expect(page.getByText('Points de Vie')).toBeVisible({ timeout: 20_000 });
    // « Mana » apparaît aussi dans les capacités : viser le compteur, pas le mot.
    await expect(page.getByText('Mana', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Chance', { exact: true }).first()).toBeVisible();
});

// Brûlure de mana (COF2) : « pour chaque PM dépensé, il subit des DM égaux à son dé de
// récupération », et aucune RD ne s'y applique.
test('brûler du mana sacrifie des PV et rend des points de mana', async ({ page }) => {
    const id = await magicien(page);
    await page.goto(`/play/${id}`);
    await expect(page.getByText('Mana', { exact: true }).first()).toBeVisible({ timeout: 20_000 });

    page.on('dialog', d => d.accept('2'));
    await page.click('button:has-text("Brûler du mana")');

    // Deux PM brûlés : deux dés jetés, et le dé de récupération est nommé.
    await expect(page.getByText(/Brûlure : 2 PM ·/)).toBeVisible();
    await expect(page.getByText(/PV sacrifiés \(d\d+\)/)).toBeVisible();
});
