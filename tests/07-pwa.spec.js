import { test, expect } from "@playwright/test";

test.describe("PWA & Performance", () => {
  test("manifest accessible et correct", async ({ page }) => {
    const response = await page.goto("/maestromind/manifest.webmanifest");
    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest.name).toContain("MAESTROMIND");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#C9A84C");
  });

  test("service worker enregistré", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    const swReady = await page.evaluate(() => {
      return navigator.serviceWorker?.ready !== undefined;
    });
    expect(swReady).toBeTruthy();
  });

  test("meta tags SEO présents", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title).toContain("MAESTROMIND");
  });

  test("pas d'erreurs console critiques", async ({ page }) => {
    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        errors.push(msg.text());
      }
    });
    await page.goto("/");
    await page.waitForTimeout(3000);
    const criticalErrors = errors.filter(
      (e) => !e.includes("net::") && !e.includes("Failed to load") && !e.includes("404") && !e.includes("service-worker")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("viewport mobile correct", async ({ page }) => {
    await page.goto("/");
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(390);
    expect(viewport.height).toBe(844);
  });
});
