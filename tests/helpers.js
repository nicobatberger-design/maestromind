/**
 * MAESTROMIND — Helpers de test Playwright
 * PIN supprimé comme écran bloquant — l'app s'ouvre directement après onboarding
 */

/** Bypass onboarding + RGPD via localStorage */
export async function setupLocalStorage(page) {
  await page.evaluate(() => {
    localStorage.setItem("bl_onboarded", "1");
    localStorage.setItem("rgpd_accepted", "1");
    localStorage.setItem("bl_user_type", "Particulier");
    // Dismiss all tooltips
    ["mm_tooltip_coach-divisions", "mm_tooltip_outils-tabs", "mm_tooltip_scanner-photo"].forEach(k =>
      localStorage.setItem(k, "1")
    );
  });
}

/** Setup complet : localStorage + reload → home directe (plus de PIN) */
export async function fullSetup(page) {
  await setupLocalStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  // Vérifier qu'on est bien sur la home (lazy loading terminé)
  await page.waitForSelector("text=MAESTROMIND", { timeout: 10000 });
  await page.waitForTimeout(500);
}

/** Naviguer via la navbar */
export async function navTo(page, label) {
  // Les labels navbar : Accueil, 32 IA, Scanner, Outils, Projets
  const navLabel = page.locator("div").filter({ hasText: new RegExp("^" + label + "$", "i") }).last();
  await navLabel.click({ timeout: 5000 });
  await page.waitForTimeout(2000);
}
