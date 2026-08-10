import { test, expect } from '@playwright/test';
import { register, uniqueEmail } from './fixtures';

// Les états d'un combattant étaient listés mais jamais cumulés : le suivi de combat
// affichait la DEF de la fiche, à charge du MJ de faire la somme à chaque attaque.
test('le suivi de combat cumule les états sur la DEF', async ({ page }) => {
    await register(page, uniqueEmail('tracker'));
    await page.goto('/tools/tracker');

    await page.fill('input[placeholder="Nom du combattant"]', 'Ogre');
    const nombres = page.locator('input[type=number]');
    await nombres.nth(0).fill('12');
    await nombres.nth(1).fill('30');
    await nombres.nth(2).fill('15');
    await page.click('button:has-text("Ajouter")');

    await expect(page.getByText('DEF 15')).toBeVisible();

    // Aveuglé et Renversé retirent 5 de DEF chacun : ce sont deux pénalités distinctes.
    for (const etat of ['Aveuglé', 'Renversé']) {
        await page.selectOption('select:has(option:text-is("+ État"))', etat);
    }

    await expect(page.getByText('DEF 5')).toBeVisible();
    await expect(page.getByText('(15 -10)')).toBeVisible();
    // Les deux états retirent aussi 5 en attaque chacun.
    await expect(page.getByText('ATT -10')).toBeVisible();
});

// Un état qui interdit d'agir doit se voir sans lire la fiche de l'état.
test('le suivi de combat annonce qu’un combattant ne peut pas agir', async ({ page }) => {
    await register(page, uniqueEmail('etourdi'));
    await page.goto('/tools/tracker');

    await page.fill('input[placeholder="Nom du combattant"]', 'Gobelin');
    const nombres = page.locator('input[type=number]');
    await nombres.nth(0).fill('10');
    await nombres.nth(1).fill('8');
    await nombres.nth(2).fill('13');
    await page.click('button:has-text("Ajouter")');

    await page.selectOption('select:has(option:text-is("+ État"))', 'Étourdi');
    await expect(page.getByText('Ne peut pas agir')).toBeVisible();
});

// La RD est calculée sur la fiche depuis longtemps et jetable au lanceur depuis #197, mais
// le champ « Dég. » du suivi retranchait les PV bruts, sans réduction ni minimum.
test('les dégâts appliqués dans le suivi passent par la RD de la cible', async ({ page }) => {
    await register(page, uniqueEmail('rd'));
    await page.goto('/tools/tracker');

    await page.fill('input[placeholder="Nom du combattant"]', 'Troll');
    const champs = page.locator('.glass-panel input[type=number]');
    await champs.nth(0).fill('10');  // Init
    await champs.nth(1).fill('40');  // PV
    await champs.nth(2).fill('14');  // DEF
    await champs.nth(3).fill('2');   // RD
    await page.click('button:has-text("Ajouter")');

    const saisie = page.locator('input[type=number]').last();
    // Le compteur de PV porte une étiquette accessible : viser la ligne entière attrapait
    // aussi le sélecteur de créatures, qui contient un « Troll des tourbières ».
    const ligne = page.getByLabel('Points de vie de Troll');
    await expect(ligne).toContainText('40');

    // 10 DM bruts contre RD 2 : 8 PV perdus.
    await saisie.fill('10');
    await page.click('button:has-text("Dég.")');
    await expect(ligne).toContainText('32');

    // 1 DM brut contre RD 2 : le minimum d'un point s'applique quand même.
    await saisie.fill('1');
    await page.click('button:has-text("Dég.")');
    await expect(ligne).toContainText('31');

    // Un soin ne passe pas par la RD : +5 PV pleins.
    await saisie.fill('5');
    await page.click('button:has-text("Soin")');
    await expect(ligne).toContainText('36');
});

// Tout existait séparément — la règle d'attaque (#194), la DEF effective (#198), la RD
// (#199) — sans qu'aucun geste ne les relie. L'attaquant est le combattant dont c'est le
// tour ; la difficulté est la DEF EFFECTIVE de la cible, états compris.
test('attaquer une cible depuis sa ligne utilise sa DEF effective', async ({ page }) => {
    await register(page, uniqueEmail('atq'));
    await page.goto('/tools/tracker');

    const ajoute = async (nom: string, init: string, pv: string, def: string) => {
        await page.fill('input[placeholder="Nom du combattant"]', nom);
        const n = page.locator('.glass-panel input[type=number]');
        await n.nth(0).fill(init);
        await n.nth(1).fill(pv);
        await n.nth(2).fill(def);
        await page.click('button:has-text("Ajouter")');
    };
    await ajoute('Lhagva', '14', '25', '16');
    await ajoute('Ogre', '10', '30', '14');

    await page.fill('input[aria-label="Valeur d\'attaque de Lhagva"]', '5');
    // L'ogre aveuglé perd 5 de DEF : la difficulté doit être 9, pas 14.
    await page.locator('select:has(option:text-is("+ État"))').last().selectOption('Aveuglé');

    // Le tour passe à Lhagva, qui a la meilleure initiative.
    await page.click('button:has-text("Tour Suivant")');
    await page.locator('button:has-text("Attaquer")').last().click();

    const jet = page.locator('p.font-mono').first();
    await expect(jet).toContainText('Lhagva attaque Ogre');
    await expect(jet).toContainText('contre DEF 9');
    await expect(jet).toContainText(/TOUCHÉ|raté/);
});

// Fermer le round : le jet d'attaque enchaîne sur les dommages, qui appliquent la RD de la
// cible et retirent les PV. Le critique doit doubler les DM — d'où la mémoire du jet.
test('infliger les dommages depuis le jet d’attaque retire les PV, RD comprise', async ({ page }) => {
    await register(page, uniqueEmail('round'));
    await page.goto('/tools/tracker');

    const ajoute = async (nom: string, init: string, pv: string, def: string, rd?: string) => {
        await page.fill('input[placeholder="Nom du combattant"]', nom);
        const n = page.locator('.glass-panel input[type=number]');
        await n.nth(0).fill(init);
        await n.nth(1).fill(pv);
        await n.nth(2).fill(def);
        if (rd) await n.nth(3).fill(rd);
        await page.click('button:has-text("Ajouter")');
    };
    await ajoute('Lhagva', '14', '25', '16');
    // DEF 2 : l'attaque touche à coup sûr, le test porte sur l'enchaînement.
    await ajoute('Troll', '10', '40', '2', '2');

    await page.fill('input[aria-label="Valeur d\'attaque de Lhagva"]', '5');
    await page.click('button:has-text("Tour Suivant")');
    await page.locator('button:has-text("Attaquer")').last().click();

    // 2d1+10 : une formule déterministe, donc 12 bruts, moins la RD 2 ⇒ 10 PV.
    await page.fill('input[aria-label="Formule de dommages"]', '2d1+10');
    await page.click('button:has-text("Infliger")');

    await expect(page.locator('p.font-mono').first()).toContainText('RD 2 → 10 PV');
    await expect(page.getByLabel('Points de vie de Troll')).toContainText('30');
});
