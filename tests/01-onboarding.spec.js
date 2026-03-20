import { test, expect } from "@playwright/test";

test.describe("Onboarding", () => {
  test("affiche l'écran d'onboarding au premier lancement", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await expect(page.getByText("MAESTROMIND")).toBeVisible();
    await expect(page.getByText("Continuer")).toBeVisible();
  });

  test("onboarding → home directe (plus de PIN)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("bl_onboarded", "1");
      localStorage.setItem("rgpd_accepted", "1");
      localStorage.setItem("bl_user_type", "Particulier");
      sessionStorage.setItem("mm_splash_done", "1");
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Doit arriver directement sur la home (plus de PIN bloquant)
    await expect(page.getByRole("button", { name: /Posez votre question/ })).toBeVisible();
  });

  test("4 écrans d'onboarding complets", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000); // Attendre fin du splash screen
    // Écran 1 — Bienvenue
    await expect(page.getByText("MAESTROMIND")).toBeVisible();
    await page.getByText("Continuer").click();
    await page.waitForTimeout(500);
    // Écran 2 — profil
    await expect(page.getByText("Votre profil")).toBeVisible();
    await page.getByText("Continuer").click();
    await page.waitForTimeout(500);
    // Écran 3 — Features
    await expect(page.getByText("superpouvoirs")).toBeVisible();
    await page.getByText("Continuer").click();
    await page.waitForTimeout(500);
    // Écran 4 — C'est parti
    await expect(page.getByText("prêt")).toBeVisible();
  });
});
