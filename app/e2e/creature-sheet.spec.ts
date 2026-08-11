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

// Le type d'une créature n'est pas qu'une étiquette : le livre y attache des immunités
// précises (Opposition, § « Type de créature »). La fiche affichait « Non-vivante » et
// s'arrêtait là.
test('la fiche d’une créature non vivante énonce ses immunités', async ({ page }) => {
    await register(page, uniqueEmail('type'));
    await page.goto('/bestiary');
    await page.getByPlaceholder(/Rechercher/).fill('Squelette');
    await page.locator('a[href^="/bestiary/"]').first().click();
    await page.waitForURL(/\/bestiary\/\d+/);

    await expect(page.getByText('Non-vivante').first()).toBeVisible();
    await expect(page.getByText(/immunisée aux maladies et aux poisons/i)).toBeVisible();
    await expect(page.getByText(/attaques qui demandent un test de CON/i)).toBeVisible();
    // L'immunité mentale reste sous condition : le livre la réserve aux créatures
    // dépourvues d'intelligence, et le profil ne dit pas à partir de quelle INT elles le sont.
    await expect(page.getByText(/Si elle est dépourvue d’intelligence/)).toBeVisible();
});

test('une créature vivante n’hérite d’aucune immunité', async ({ page }) => {
    await register(page, uniqueEmail('type'));
    await page.goto('/bestiary');
    await page.getByPlaceholder(/Rechercher/).fill('Loup');
    await page.locator('a[href^="/bestiary/"]').first().click();
    await page.waitForURL(/\/bestiary\/\d+/);
    await expect(page.getByText(/immunisée aux maladies/i)).toHaveCount(0);
});

// L'import du bestiaire avait perdu les caractéristiques négatives du livre : le squelette
// était servi avec PER 0 et INT 0 au lieu de ‑1 et ‑4. Le MJ lançait quatre points trop haut.
test('les caractéristiques négatives du livre sont bien servies', async ({ page }) => {
    await register(page, uniqueEmail('caracs'));
    await page.goto('/bestiary');
    await page.getByPlaceholder(/Rechercher/).fill('Squelette de base');
    await page.locator('a[href^="/bestiary/"]').first().click();
    await page.waitForURL(/\/bestiary\/\d+/);

    // Par le label plutôt que par le voisinage : l'intitulé et la valeur sont deux blocs
    // distincts, et les relier par la structure du DOM rendait ce test intermittent.
    await expect(page.getByLabel('INT -4')).toBeVisible();
    await expect(page.getByLabel('CHA -4')).toBeVisible();
    await expect(page.getByLabel('PER -1')).toBeVisible();
});

// COF2 note ½ le NC de ses adversaires les plus faibles ; la colonne étant entière, ils
// étaient servis NC 1 — le double de leur puissance dans le budget d'une rencontre.
test('un NC ½ est servi et écrit comme le livre l’écrit', async ({ page }) => {
    await register(page, uniqueEmail('nc'));
    await page.goto('/bestiary');
    await page.getByPlaceholder(/Rechercher/).fill('Bandit de base');

    // Sur la carte de la liste comme sur la fiche : « NC ½ », jamais « NC 0.5 ».
    await expect(page.getByText('NC ½').first()).toBeVisible();
    await expect(page.getByText('NC 0.5')).toHaveCount(0);

    await page.locator('a[href^="/bestiary/"]').first().click();
    await page.waitForURL(/\/bestiary\/\d+/);
    await expect(page.getByText('NC ½')).toBeVisible();
});

// L'astérisque du livre — « un dé bonus à tous les tests de cette caractéristique » — n'avait
// aucun champ où se poser : 101 d'entre eux étaient perdus, et le MJ lançait un seul dé.
test('une caractéristique supérieure porte son astérisque et sa portée', async ({ page }) => {
    await register(page, uniqueEmail('sup'));
    await page.goto('/bestiary');
    await page.getByPlaceholder(/Rechercher/).fill('Basilic');
    await page.locator('a[href^="/bestiary/"]').first().click();
    await page.waitForURL(/\/bestiary\/\d+/);

    // Basilic : FOR +3* dans le livre, seule caractéristique à porter l'astérisque.
    await expect(page.getByLabel('FOR 3 (supérieure : dé bonus)')).toBeVisible();
    await expect(page.getByLabel('CON 3', { exact: true })).toBeVisible();

    // La légende dit ce que l'astérisque accorde ET où il s'arrête : sans elle, c'est un
    // signe muet.
    await expect(page.getByText(/dé bonus à tous les tests de cette caractéristique/)).toBeVisible();
    await expect(page.getByText(/sauf les tests d’attaque/)).toBeVisible();
});

test('une créature sans caractéristique supérieure n’affiche pas la légende', async ({ page }) => {
    await register(page, uniqueEmail('sup'));
    await page.goto('/bestiary');
    await page.getByPlaceholder(/Rechercher/).fill('Squelette de base');
    await page.locator('a[href^="/bestiary/"]').first().click();
    await page.waitForURL(/\/bestiary\/\d+/);
    await expect(page.getByText(/caractéristique supérieure/)).toHaveCount(0);
});
