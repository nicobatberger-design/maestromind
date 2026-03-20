import { test, expect } from "@playwright/test";
import { fullSetup, navTo } from "./helpers.js";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
  });

  test("home affiche titre et sous-titre", async ({ page }) => {
    await expect(page.getByText("33 IA spécialisées").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /Quel est votre projet/ })).toBeVisible();
  });

  test("home affiche outils rapides et aides", async ({ page }) => {
    await expect(page.getByText("Outils rapides")).toBeVisible();
    await expect(page.getByText("Aides 2026")).toBeVisible();
  });

  test("boutons urgence visibles", async ({ page }) => {
    await expect(page.getByText("GAZ", { exact: true })).toBeVisible();
    await expect(page.getByText("EAU", { exact: true })).toBeVisible();
  });

  test("navigation vers Scanner", async ({ page }) => {
    await navTo(page, "Scanner");
    await expect(page.getByRole("button", { name: /Diagnostic IA/ })).toBeVisible({ timeout: 10000 });
  });

  test("navigation vers Projets", async ({ page }) => {
    await navTo(page, "Projets");
    await expect(page.getByText("Mes Projets")).toBeVisible();
  });

  test("outils rapides → devis", async ({ page }) => {
    await page.getByText("Vérifier un devis").click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Analyser le devis")).toBeVisible();
  });
});
