import { test, expect } from "@playwright/test";
import { fullSetup } from "./helpers.js";

test.describe("Recherche", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
  });

  test("overlay recherche s'ouvre", async ({ page }) => {
    await page.click('button[title="Rechercher"]');
    await page.waitForTimeout(500);
    const overlay = page.locator('input[placeholder*="Rechercher IA"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });
  });

  test("recherche filtre les résultats", async ({ page }) => {
    await page.click('button[title="Rechercher"]');
    await page.waitForTimeout(500);
    const input = page.locator('input[placeholder*="Rechercher IA"]');
    await input.fill("carrelage");
    await page.waitForTimeout(500);
    // Au moins 1 résultat affiché (chaque résultat a un titre en fontSize 13)
    const results = page.locator('div >> text=/carrelage/i');
    await expect(results.first()).toBeVisible({ timeout: 5000 });
  });

  test("bouton annuler ferme la recherche", async ({ page }) => {
    await page.click('button[title="Rechercher"]');
    await page.waitForTimeout(500);
    const input = page.locator('input[placeholder*="Rechercher IA"]');
    await expect(input).toBeVisible();
    // Cliquer sur Annuler
    await page.getByText("Annuler").click();
    await page.waitForTimeout(500);
    // L'overlay doit être fermé
    await expect(input).not.toBeVisible({ timeout: 5000 });
  });

  test("suggestions visibles quand vide", async ({ page }) => {
    await page.click('button[title="Rechercher"]');
    await page.waitForTimeout(500);
    // Section suggestions visible (texte "Suggestions" en uppercase)
    const suggestions = page.locator('text=Suggestions');
    await expect(suggestions).toBeVisible({ timeout: 5000 });
  });
});
