import { test, expect, register, uniqueEmail, getToken, API_URL } from './fixtures';

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
        // Le sélecteur est CONTRÔLÉ : la valeur ne tient que lorsque l'état du parent est
        // remonté, ce qui peut prendre un tour de rendu. Une lecture unique passait ici et
        // échouait sur une machine lente — le seul test que l'intégration continue a vu
        // tomber. Attendre distingue une valeur qui met du temps à s'établir d'une valeur
        // qui ne s'établit jamais : si le sélecteur se vidait pour de bon, ceci échouerait.
        await expect.poll(() => raceSelect.inputValue(), { timeout: 10_000 }).not.toBe('');
    });
});

// Le badge « N PM » d'un sort ne s'est JAMAIS affiché : le résolveur de capacité perdait
// `isSpell`, et la condition du badge était donc toujours fausse. Un magicien à 25 sorts
// n'en voyait aucun.
test('la fiche affiche le coût en PM des sorts, et le coût réduit par concentration', async ({ page }) => {
    await register(page, uniqueEmail('pm'));
    const token = (await getToken(page))!;
    const profs = await (await page.request.get(`${API_URL}/profiles?pagination=false`, {
        headers: { Accept: 'application/ld+json' },
    })).json();
    const membres: Array<{ name: string; '@id': string; voies?: Array<{ '@id': string }> }> =
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
    const id = (await res.json())['@id'].split('/').pop();

    await page.goto(`/characters/${id}`);
    await expect(page.getByText(/^\d+ PM/).first()).toBeVisible({ timeout: 20_000 });

    // Concentration accrue : un sort de rang 3 en action d'attaque coûte 1 PM de moins.
    await expect(page.getByText(/PM · \d+ concentré/).first()).toBeVisible();
    // Jamais « 0 concentré » : le livre ne dit pas qu'un sort de rang 1 devient gratuit.
    await expect(page.getByText(/· 0 concentré/)).toHaveCount(0);
});
