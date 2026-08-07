import { type Page } from '@playwright/test';
import { test, expect, register, uniqueEmail, getToken, API_URL } from './fixtures';

// Fiche imprimable (`/characters/:id/print`) : lecture seule, dérivée du même hook que
// l'écran. Ce que ces tests gardent, c'est qu'elle reste COMPLÈTE et que le coût des
// sorts y tienne compte de l'armure portée (COF2 chap. 9) — invisible d'un test unitaire.

async function loadProfiles(page: Page) {
    const profs = await (await page.request.get(`${API_URL}/profiles?pagination=false`, {
        headers: { Accept: 'application/ld+json' },
    })).json();
    const members: Array<{ name: string; '@id': string; voies?: Array<{ name: string; '@id': string }> }> =
        profs.member || profs['hydra:member'];
    const profileIri = (name: string) => members.find(p => p.name === name)!['@id'];
    const voieIri = (profileName: string, voieName: string) =>
        members.find(p => p.name === profileName)!.voies!.find(v => v.name === voieName)!['@id'];
    return { profileIri, voieIri };
}

async function createCharacter(page: Page, token: string, body: Record<string, unknown>) {
    const res = await page.request.post(`${API_URL}/characters`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/ld+json', Accept: 'application/ld+json' },
        data: body,
    });
    expect(res.status()).toBe(201);
    return (await res.json())['@id'].split('/').pop();
}

// Un magicien de rang 1 dans une voie de sorts, en armure de cuir (DEF +2) — que son
// profil n'autorise pas : c'est exactement le cas chiffré du livre.
async function magicienEnCuir(page: Page): Promise<string> {
    await register(page, uniqueEmail('print'));
    const token = (await getToken(page))!;
    const { profileIri, voieIri } = await loadProfiles(page);

    return createCharacter(page, token, {
        name: 'Aldwin le Prudent',
        level: 1,
        profile: profileIri('Magicien'),
        caracs: { FOR: -1, AGI: 1, CON: 0, INT: 3, PER: 1, CHA: 0, VOL: 2 },
        characterVoies: [{ voie: voieIri('Magicien', 'Voie de la Magie Destructrice'), rank: 1, source: 'profil' }],
        playState: {
            hp: { current: 6 }, mana: { current: 3 }, luck: { current: 2 }, recovery: { used: 0 },
            money: { pa: 20 }, equipment: ['Grimoire'], rp: { ideal: '', flaw: '' }, languages: [],
            protection: { armor: { name: 'Armure de cuir', def: 2 }, shield: { name: '', def: 0 } },
            weapons: [],
        },
    });
}

test('la fiche imprimable rend toutes ses sections', async ({ page }) => {
    const id = await magicienEnCuir(page);
    await page.goto(`/characters/${id}/print`);

    await expect(page.getByRole('heading', { name: 'Aldwin le Prudent' })).toBeVisible();
    for (const titre of ['Caractéristiques', 'Combat', 'Ressources', 'Voies & capacités', 'Équipement', 'Notes']) {
        await expect(page.getByRole('heading', { name: titre, exact: true })).toBeVisible();
    }
    // Les actions ne doivent pas partir sur le papier.
    await expect(page.locator('.no-print')).toHaveCount(1);
});

test('le coût imprimé d’un sort tient compte de l’armure portée', async ({ page }) => {
    const id = await magicienEnCuir(page);
    await page.goto(`/characters/${id}/print`);

    // Un magicien n'a droit à aucune armure : le supplément vaut la DEF entière (+2).
    await expect(page.getByText(/Sous cette armure/)).toBeVisible();
    await expect(page.getByText(/Magicien.*sorts \+2 PM/)).toBeVisible();
    // Un sort de rang 1 coûte donc 3 PM, pas 1 — c'est ce chiffre que le joueur lit à table.
    await expect(page.getByText(/Sort · 3 PM \(1 \+ 2 d’armure\)/)).toBeVisible();
});

test('sans armure, la fiche imprimée n’annonce aucun supplément', async ({ page }) => {
    await register(page, uniqueEmail('print'));
    const token = (await getToken(page))!;
    const { profileIri, voieIri } = await loadProfiles(page);

    const id = await createCharacter(page, token, {
        name: 'Aldwin le Nu',
        level: 1,
        profile: profileIri('Magicien'),
        caracs: { FOR: -1, AGI: 1, CON: 0, INT: 3, PER: 1, CHA: 0, VOL: 2 },
        characterVoies: [{ voie: voieIri('Magicien', 'Voie de la Magie Destructrice'), rank: 1, source: 'profil' }],
    });

    await page.goto(`/characters/${id}/print`);
    await expect(page.getByRole('heading', { name: 'Aldwin le Nu' })).toBeVisible();
    await expect(page.getByText(/Sous cette armure/)).toHaveCount(0);
    await expect(page.getByText(/Sort · 1 PM/).first()).toBeVisible();
});
