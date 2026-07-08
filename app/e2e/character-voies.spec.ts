import { test, expect, register, uniqueEmail, getToken } from './fixtures';

// Régression : en rouvrant un personnage de niveau ≥ 1 dont seule une partie des
// voies de profil avait été sauvegardée, les 5 voies du profil doivent toujours
// s'afficher (les emplacements manquants sont reconstruits depuis le profil).
test('rouvrir un perso niveau ≥ 1 recharge les 5 voies de profil', async ({ page }) => {
    await register(page, uniqueEmail('voies'));
    const token = await getToken(page);

    // IRI du profil Guerrier
    const profs = await (await page.request.get('http://localhost:8000/api/profiles?pagination=false', {
        headers: { Accept: 'application/ld+json' },
    })).json();
    const members: Array<{ name: string; '@id': string }> = profs.member || profs['hydra:member'];
    const guerrier = members.find((p) => p.name === 'Guerrier')!['@id'];

    // Perso niveau 1 avec seulement 2 voies de profil sauvegardées.
    const res = await page.request.post('http://localhost:8000/api/characters', {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: {
            name: 'Vétéran', level: 1, profile: guerrier,
            data: {
                voies: {
                    profile: [
                        { name: 'Voie du Bouclier', ranks: [true, true, false, false, false] },
                        { name: 'Voie du Combat', ranks: [true, false, false, false, false] },
                    ],
                    racial: { name: '', ranks: [false, false, false, false, false] },
                },
            },
        },
    });
    const id = (await res.json())['@id'].split('/').pop();

    await page.goto(`/characters/${id}`);
    await page.waitForLoadState('networkidle');

    // Les 5 voies du Guerrier doivent être présentes, y compris celles non sauvegardées.
    for (const name of ['Voie du Bouclier', 'Voie du Combat', "Voie du Maître d'Armes", 'Voie de la Résistance', 'Voie du Soldat']) {
        await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    }
    // Aucun emplacement de voie de profil vide (« ... »).
    await expect(page.locator('h3', { hasText: /Voie de Profil/i })).toHaveCount(5);
    const emptySlots = await page.locator('h3:has-text("Voie de Profil") ~ * >> text="..."').count().catch(() => 0);
    expect(emptySlots).toBe(0);
});
