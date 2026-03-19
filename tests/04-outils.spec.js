import { test, expect } from "@playwright/test";
import { fullSetup, navTo } from "./helpers.js";

test.describe("Outils IA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
    await navTo(page, "Outils");
  });

  test("affiche le titre Outils IA", async ({ page }) => {
    await expect(page.getByText("Outils IA")).toBeVisible();
  });

  test("onglets outils présents", async ({ page }) => {
    for (const tab of ["Devis", "Matériaux", "Primes", "DPE"]) {
      await expect(page.getByRole("button", { name: tab }).first()).toBeVisible();
    }
  });

  test("onglet Devis — textarea et bouton", async ({ page }) => {
    await expect(page.getByText("Analyser le devis")).toBeVisible();
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible();
    await textarea.fill("Carrelage 8m² : 1200€");
    await expect(textarea).toHaveValue(/Carrelage/);
  });

  test("onglet Matériaux cliquable", async ({ page }) => {
    await page.getByRole("button", { name: "Matériaux" }).first().click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Calculer", { exact: false }).first()).toBeVisible();
  });

  test("onglet Primes cliquable", async ({ page }) => {
    await page.getByRole("button", { name: "Primes" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Calculer mes aides", { exact: false }).first()).toBeVisible();
  });

  test("onglet Artisan RGE cliquable", async ({ page }) => {
    await page.getByRole("button", { name: "Artisan RGE" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Vérifier", { exact: false }).first()).toBeVisible();
  });
});
