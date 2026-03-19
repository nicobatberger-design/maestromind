import { test, expect } from "@playwright/test";
import { fullSetup, navTo } from "./helpers.js";

test.describe("Projets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
    await navTo(page, "Projets");
  });

  test("formulaire nouveau projet visible", async ({ page }) => {
    await expect(page.getByText("Mes Projets")).toBeVisible();
    await expect(page.getByText("NOUVEAU PROJET")).toBeVisible();
  });

  test("créer un projet", async ({ page }) => {
    // Cibler l'input par placeholder
    const nomInput = page.getByPlaceholder(/Réno salle de bain/i);
    await nomInput.fill("Réno cuisine");
    await page.waitForTimeout(300);
    await page.getByText("Créer le projet").click();
    await page.waitForTimeout(500);
    await expect(page.getByText("Réno cuisine")).toBeVisible();
  });

  test("message si aucun projet", async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem("bl_projets"));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    for (const d of ["1", "2", "3", "4", "5", "6"]) {
      await page.locator("button.bl-pin").filter({ hasText: new RegExp(`^${d}$`) }).click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(2000);
    await navTo(page, "Projets");
    await expect(page.getByText("Aucun projet")).toBeVisible();
  });

  test("section rappels chantier", async ({ page }) => {
    await expect(page.getByText("Rappels Chantier")).toBeVisible();
  });
});
