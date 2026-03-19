import { test, expect } from "@playwright/test";
import { fullSetup, navTo } from "./helpers.js";

test.describe("Scanner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
    await navTo(page, "Scanner");
  });

  test("onglets Diagnostic IA et Mesurer", async ({ page }) => {
    await expect(page.getByText("Diagnostic IA")).toBeVisible();
    await expect(page.getByText("Mesurer")).toBeVisible();
  });

  test("boutons photo visibles", async ({ page }) => {
    await expect(page.getByText("Prendre photo")).toBeVisible();
    await expect(page.getByText("Galerie")).toBeVisible();
  });

  test("sélecteur IA analyste", async ({ page }) => {
    await expect(page.getByText("Diagnostic", { exact: true }).first()).toBeVisible();
  });
});
