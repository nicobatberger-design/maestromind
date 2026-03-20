/**
 * MAESTROMIND — Tests page Réglages
 * Vérifie l'accès, les toggles et la sauvegarde profil
 */

import { test, expect } from "@playwright/test";
import { fullSetup } from "./helpers.js";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
    // Naviguer vers les réglages via le bouton engrenage du header
    await page.click('button[title="Réglages"]');
    await page.waitForTimeout(1000);
  });

  test("page réglages accessible", async ({ page }) => {
    // Vérifier le titre principal
    await expect(page.locator("text=Réglages")).toBeVisible();
    // Vérifier les sections
    await expect(page.locator("text=Compte")).toBeVisible();
    await expect(page.locator("text=Apparence")).toBeVisible();
    await expect(page.locator("text=Accessibilité")).toBeVisible();
    await expect(page.locator("text=Profil IA")).toBeVisible();
  });

  test("toggle mode chantier", async ({ page }) => {
    // Vérifier état initial (désactivé)
    const initial = await page.evaluate(() => localStorage.getItem("mm_mode_chantier"));
    expect(initial).not.toBe("1");

    // Cliquer sur le toggle Mode Chantier (dans la ligne qui contient ce texte)
    const row = page.locator("div").filter({ hasText: /^Mode Chantier$/ }).first();
    const toggle = row.locator("..").locator("..").locator("div[style*='width: 44']").first();
    await toggle.click();
    await page.waitForTimeout(300);

    // Vérifier que localStorage a changé
    const after = await page.evaluate(() => localStorage.getItem("mm_mode_chantier"));
    expect(after).toBe("1");
  });

  test("toggle lecture vocale auto", async ({ page }) => {
    // Vérifier état initial (désactivé)
    const initial = await page.evaluate(() => localStorage.getItem("mm_auto_voice"));
    expect(initial).not.toBe("1");

    // Cliquer sur le toggle Lecture vocale auto
    const row = page.locator("div").filter({ hasText: /^Lecture vocale auto$/ }).first();
    const toggle = row.locator("..").locator("..").locator("div[style*='width: 44']").first();
    await toggle.click();
    await page.waitForTimeout(300);

    // Vérifier que localStorage a changé
    const after = await page.evaluate(() => localStorage.getItem("mm_auto_voice"));
    expect(after).toBe("1");
  });

  test("profil nom sauvegardé", async ({ page }) => {
    // Trouver l'input nom dans la section Profil IA
    const input = page.locator('input[placeholder="Votre nom"]');
    await expect(input).toBeVisible();

    // Remplir le nom
    await input.fill("Nico Test");
    await page.waitForTimeout(500);

    // Vérifier la sauvegarde dans localStorage
    const saved = await page.evaluate(() => localStorage.getItem("bl_profil_nom"));
    expect(saved).toBe("Nico Test");
  });

  test("type utilisateur modifiable", async ({ page }) => {
    // Vérifier état initial (Particulier défini dans helpers)
    const initial = await page.evaluate(() => localStorage.getItem("bl_user_type"));
    expect(initial).toBe("Particulier");

    // Cliquer sur "Artisan Pro" dans le PillSelector
    const artisanBtn = page.locator("button").filter({ hasText: "Artisan Pro" });
    await artisanBtn.click();
    await page.waitForTimeout(300);

    // Vérifier que localStorage a changé
    const after = await page.evaluate(() => localStorage.getItem("bl_user_type"));
    expect(after).toBe("Artisan Pro");
  });
});
