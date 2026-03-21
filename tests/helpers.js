/**
 * MAESTROMIND — Helpers de test Playwright
 * PIN supprimé comme écran bloquant — l'app s'ouvre directement après onboarding
 */

/** Bypass onboarding + RGPD + splash via localStorage */
export async function setupLocalStorage(page) {
  await page.evaluate(() => {
    localStorage.setItem("bl_onboarded", "1");
    localStorage.setItem("rgpd_accepted", "1");
    localStorage.setItem("bl_user_type", "Particulier");
    localStorage.setItem("maestromind_key", "sk-ant-test-key-for-playwright");
    sessionStorage.setItem("mm_splash_done", "1");
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
  // Les labels navbar : Accueil, XX IA (dynamique), Scanner, Outils, Projets
  // Support "XX IA" pattern pour matcher n'importe quel nombre
  const pattern = label.match(/\d+ IA/i) ? /^\d+ IA$/i : new RegExp("^" + label + "$", "i");
  const navLabel = page.locator("div").filter({ hasText: pattern }).last();
  await navLabel.click({ timeout: 5000 });
  await page.waitForTimeout(2000);
}
