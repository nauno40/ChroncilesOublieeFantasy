import { test, expect } from '@playwright/test';
import { register, uniqueEmail } from './fixtures';

// Le lanceur ne savait faire que des `xdy+z` : ni dé malus, ni difficulté, alors que les
// états préjudiciables du compendium DÉCLARENT un dé malus. On vérifie ici le câblage —
// la règle elle-même est couverte par `domain/rules/test.test.ts`.
test('le lanceur jette un test COF2 avec dé malus et difficulté', async ({ page }) => {
    await register(page, uniqueEmail('des'));
    await page.goto('/tools/dice');

    await page.fill('input[aria-label="Valeur de caractéristique"]', '3');
    await page.selectOption('select[aria-label="Difficulté"]', '15');
    await page.click('[role=radio]:has-text("Dé malus")');
    await page.click('button:has-text("Tester")');

    const jet = page.locator('.glass-panel.p-2').first();
    await expect(jet).toContainText('DIF 15');
    // Un dé malus fait lancer DEUX d20 : le détail les montre tous les deux.
    await expect(jet).toContainText(/\(\d+ \/ \d+\)/);
    await expect(jet).toContainText(/Réussi|Échoué/);
});

// Le test d'attaque ne suit pas les mêmes règles que le test de caractéristique : c'est la
// DEF de la cible qui sert de difficulté, et un 1 n'y est pas un échec automatique.
test('le lanceur jette un test d’attaque contre la DEF de la cible', async ({ page }) => {
    await register(page, uniqueEmail('atk'));
    await page.goto('/tools/dice');

    await page.click('[role=radio]:has-text("Attaque")');
    await page.fill('input[aria-label="Valeur d\'attaque"]', '5');
    await page.fill('input[aria-label="DEF de la cible"]', '16');
    await page.click('button:has-text("Tester")');

    const jet = page.locator('.glass-panel.p-2').first();
    await expect(jet).toContainText('Attaque d20+5');
    await expect(jet).toContainText('DEF 16');
    await expect(jet).toContainText(/Réussi|Échoué/);
});

// Les malus de tir dépendent de la situation, pas de la feuille : ils n'étaient rappelés
// nulle part. On vérifie qu'une condition chiffrée et une condition à dé malus se combinent.
test('les conditions de tir s’appliquent au test d’attaque', async ({ page }) => {
    await register(page, uniqueEmail('tir'));
    await page.goto('/tools/dice');

    await page.click('[role=radio]:has-text("Attaque")');
    await page.fill('input[aria-label="Valeur d\'attaque"]', '5');
    await page.fill('input[aria-label="DEF de la cible"]', '16');
    await page.click('button:has-text("Conditions de tir")');
    await page.click('label:has-text("Cible à couvert — fortement") input');
    await page.click('label:has-text("Longue portée") input');
    await page.click('button:has-text("Tester")');

    const jet = page.locator('.glass-panel.p-2').first();
    // La valeur d'attaque et le malus de situation restent lisibles séparément.
    await expect(jet).toContainText('Attaque d20+5');
    await expect(jet).toContainText('tir -5');
    // La longue portée impose un dé malus : deux d20 sont lancés.
    await expect(jet).toContainText(/\(\d+ \/ \d+\)/);
});

// Les options tactiques n'étaient ni listées ni jouables. Deux natures à distinguer :
// une option ordinaire se compare à la DEF, une manœuvre se joue en test OPPOSÉ.
test('les options tactiques modifient l’attaque, les manœuvres sont des tests opposés', async ({ page }) => {
    await register(page, uniqueEmail('tac'));
    await page.goto('/tools/dice');

    await page.click('[role=radio]:has-text("Attaque")');
    await page.fill('input[aria-label="Valeur d\'attaque"]', '5');
    await page.fill('input[aria-label="DEF de la cible"]', '16');

    await page.selectOption('select[aria-label="Option tactique"]', 'assuree');
    await page.click('button:has-text("Tester")');
    const assuree = page.locator('.glass-panel.p-2').first();
    await expect(assuree).toContainText('Attaque assurée');
    await expect(assuree).toContainText('option +5');
    await expect(assuree).toContainText('DM divisés par 2');
    await expect(assuree).toContainText('DEF 16');

    await page.selectOption('select[aria-label="Option tactique"]', 'etourdir');
    await page.click('button:has-text("Tester")');
    const manoeuvre = page.locator('.glass-panel.p-2').first();
    await expect(manoeuvre).toContainText('test opposé');
    await expect(manoeuvre).toContainText('option -10');
    // Pas de DEF ni de verdict : c'est le jet de la cible qui tranchera.
    await expect(manoeuvre).not.toContainText('DEF 16');
    await expect(manoeuvre).not.toContainText(/Réussi|Échoué/);
});

// La RD était calculée sur la fiche depuis longtemps, mais ne s'appliquait à aucun jet :
// ni résistance, ni minimum d'un point, ni DM temporaires n'existaient nulle part.
test('le jet de dommages applique la RD avant la résistance, et le minimum d’un point', async ({ page }) => {
    await register(page, uniqueEmail('dm'));
    await page.goto('/tools/dice');

    // Une RD écrasante : l'attaque qui touche inflige tout de même 1 DM.
    await page.fill('input[aria-label="Formule de dommages"]', '1d8+3');
    await page.fill('input[aria-label="Réduction des dommages de la cible"]', '40');
    await page.click('button:has-text("DM")');

    const jet = page.locator('.glass-panel.p-2').first();
    await expect(jet).toContainText('minimum 1 DM');
    await expect(jet).toContainText('RD 40');

    // L'ordre imposé par le livre est visible dans le détail : la RD, puis la division.
    await page.fill('input[aria-label="Réduction des dommages de la cible"]', '2');
    await page.click('label:has-text("Résistance") input');
    await page.click('button:has-text("DM")');

    const avecResistance = page.locator('.glass-panel.p-2').first();
    await expect(avecResistance).toContainText(/RD 2 → \d+ · résistance ÷2/);
});

// Dangers & obstacles : ces calculs (chute, saut, feu, températures) étaient dans le livre
// et nulle part dans l'application — le MJ les refaisait de tête en pleine partie.
test('la page Dangers calcule la chute, la chaleur et le froid', async ({ page }) => {
    await register(page, uniqueEmail('dang'));
    await page.goto('/tools/dangers');

    // 12 m par défaut : quatre tranches de 3 m, au dé évolutif d'un niveau 1.
    await expect(page.getByText('4d4', { exact: true })).toBeVisible({ timeout: 20_000 });

    // Un test d'AGI réussi ignore les TROIS PREMIERS mètres : 9 m, soit trois dés.
    await page.locator('input[type=checkbox]').first().check();
    await expect(page.getByText('3d4', { exact: true })).toBeVisible();

    // Le dé suit le niveau du personnage : d6 à partir du niveau 6.
    await page.fill('input[aria-label="Niveau du personnage"]', '6');
    await expect(page.getByText('3d6', { exact: true })).toBeVisible();

    // Froid : l'exemple du livre — difficulté 15 pour ‑15 °C.
    await expect(page.getByText('Froid — test de CON difficulté 15')).toBeVisible();
    // Chaleur : « la difficulté est égale à la température ‑ 30 ».
    await page.fill('input[aria-label="Température"]', '45');
    await expect(page.getByText('Chaleur — test de CON difficulté 15')).toBeVisible();
});

// Voyage : « [12 + CON ‑ pénalité d'armure] km par période », le terrain divisant la
// distance. Ces calculs n'existaient nulle part.
test('la page Voyage & dangers calcule les distances de déplacement', async ({ page }) => {
    await register(page, uniqueEmail('voy'));
    await page.goto('/tools/dangers');

    // CON +2, sans armure : 14 km par période, deux périodes par jour.
    await expect(page.getByText('14 km par période · 28 km par jour')).toBeVisible({ timeout: 20_000 });

    // Cotte de mailles (DEF 5) : la pénalité d'armure est sa DEF.
    await page.fill('input[aria-label="DEF de l’armure portée"]', '5');
    await expect(page.getByText('9 km par période · 18 km par jour')).toBeVisible();

    // « Si l'armure est dans le sac, sa pénalité est réduite de moitié » : 5 → 2.
    await page.locator('label:has-text("Armure dans le sac") input').check();
    await expect(page.getByText('12 km par période · 24 km par jour')).toBeVisible();

    // Hors piste ET terrain difficile : divisé par quatre.
    await page.locator('label:has-text("Hors piste") input').check();
    await page.locator('label:has-text("Terrain difficile") input').check();
    await expect(page.getByText('3 km par période · 6 km par jour')).toBeVisible();
});

// Poisons : les tables étaient au compendium, mais ni la difficulté d'enduire une arme ni
// celle de résister n'apparaissaient nulle part — et la note de la page les résumait mal.
test('les jets de poison distinguent la dose gaspillée de l’auto-empoisonnement', async ({ page }) => {
    await register(page, uniqueEmail('poi'));
    await page.goto('/tools/dangers');

    await page.locator('input[aria-label="INT du porteur"]').fill('3');
    await page.click('button:has-text("Test d’INT")');
    await expect(page.getByText(/Enduire : \(\d+\) \+ 3 =/)).toBeVisible({ timeout: 20_000 });

    // La virulence se règle : le livre dit que la difficulté « peut être modifiée ».
    await page.locator('input[aria-label="Difficulté du poison"]').fill('15');
    await page.click('button:has-text("Test de CON")');
    await expect(page.getByText(/contre 15 — (résisté|subi)/)).toBeVisible();
});

// La page du compendium annonçait « un test de CON réussi réduit ou annule l'effet » sans
// donner la moindre difficulté.
test('la page Poisons rappelle les deux difficultés du livre', async ({ page }) => {
    await register(page, uniqueEmail('poinote'));
    await page.goto('/poisons');

    await expect(page.getByText(/test de CON difficulté 10/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/test d’INT difficulté 10/)).toBeVisible();
    await expect(page.getByText(/échec critique empoisonne le porteur/)).toBeVisible();
});
