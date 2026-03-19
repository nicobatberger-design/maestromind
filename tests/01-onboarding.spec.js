import { test, expect } from "@playwright/test";

test.describe("Onboarding & PIN", () => {
  test("affiche l'écran d'onboarding au premier lancement", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await expect(page.getByText("Bienvenue sur")).toBeVisible();
    await expect(page.getByText("Continuer")).toBeVisible();
  });

  test("PIN correct déverrouille l'app", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("bl_onboarded", "1");
      localStorage.setItem("rgpd_accepted", "1");
      localStorage.setItem("bl_user_type", "Particulier");
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Entrer PIN 123456
    for (const d of ["1", "2", "3", "4", "5", "6"]) {
      await page.locator("button.bl-pin").filter({ hasText: new RegExp(`^${d}$`) }).click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(2000);

    await expect(page.getByRole("button", { name: /Quel est votre projet/ })).toBeVisible();
  });

  test("PIN incorrect affiche erreur", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("bl_onboarded", "1");
      localStorage.setItem("rgpd_accepted", "1");
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    for (const d of ["9", "9", "9", "9", "9", "9"]) {
      await page.locator("button.bl-pin").filter({ hasText: new RegExp(`^${d}$`) }).click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1000);

    await expect(page.getByText("Code incorrect")).toBeVisible();
  });
});
