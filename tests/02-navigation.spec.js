import { test, expect } from "@playwright/test";
import { fullSetup, navTo } from "./helpers.js";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
  });

  test("home affiche CTA principal", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Posez votre question/ })).toBeVisible({ timeout: 10000 });
  });

  test("home affiche outils et astuce", async ({ page }) => {
    await expect(page.getByText("Aides 2026")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("ASTUCE DU JOUR")).toBeVisible();
  });

  test("urgence présente sur la page", async ({ page }) => {
    await expect(page.getByText("Urgence").first()).toBeTruthy();
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
    await page.getByText("Devis").first().click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("Analyser le devis")).toBeVisible();
  });
});
