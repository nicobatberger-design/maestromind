import { test, expect } from "@playwright/test";
import { fullSetup, navTo } from "./helpers.js";

test.describe("Coach / Chat IA", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
    await navTo(page, "32 IA");
  });

  test("affiche le message de bienvenue", async ({ page }) => {
    await expect(page.getByText("Bonjour", { exact: false }).first()).toBeVisible();
  });

  test("divisions IA visibles", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Métier" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Diagnostic" }).first()).toBeVisible();
  });

  test("chips suggestions présentes", async ({ page }) => {
    const chips = page.locator(".bl-chip");
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);
  });

  test("textarea coach fonctionne", async ({ page }) => {
    // Cibler spécifiquement le textarea du coach par placeholder
    const textarea = page.getByRole("textbox", { name: /Demandez à/ });
    await textarea.fill("Comment poser du carrelage ?");
    await expect(textarea).toHaveValue("Comment poser du carrelage ?");
  });

  test("chip remplit le textarea", async ({ page }) => {
    const firstChip = page.locator(".bl-chip").first();
    const chipText = await firstChip.textContent();
    await firstChip.click();
    const textarea = page.getByRole("textbox", { name: /Demandez à/ });
    await expect(textarea).toHaveValue(chipText);
  });

  test("input photo attaché", async ({ page }) => {
    const photoInput = page.locator("input[type=file][accept='image/*']").first();
    await expect(photoInput).toBeAttached();
  });

  test("badge rang IA visible", async ({ page }) => {
    const badges = page.locator("text=/Colonel|Capitaine|Général/");
    await expect(badges.first()).toBeVisible();
  });

  test("switch IA Normes DTU", async ({ page }) => {
    await page.getByRole("button", { name: "Normes DTU" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Normes DTU", { exact: false }).first()).toBeVisible();
  });
});
