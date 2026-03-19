/**
 * MAESTROMIND — Helpers de test Playwright
 */

/** Bypass onboarding + RGPD via localStorage */
export async function setupLocalStorage(page) {
  await page.evaluate(() => {
    localStorage.setItem("bl_onboarded", "1");
    localStorage.setItem("rgpd_accepted", "1");
    localStorage.setItem("bl_user_type", "Particulier");
  });
}

/** Entrer le PIN PDG (123456) */
export async function enterPin(page) {
  for (const d of ["1", "2", "3", "4", "5", "6"]) {
    await page.locator("button.bl-pin").filter({ hasText: new RegExp(`^${d}$`) }).click();
    await page.waitForTimeout(150);
  }
  // Attendre que la home s'affiche
  await page.waitForTimeout(2000);
}

/** Setup complet : localStorage + reload + PIN → home */
export async function fullSetup(page) {
  await setupLocalStorage(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await enterPin(page);
  // Vérifier qu'on est bien sur la home
  await page.waitForSelector("text=MAESTROMIND", { timeout: 5000 });
}

/** Naviguer via la navbar (utilise les labels exacts en minuscules de la navbar) */
export async function navTo(page, navLabel) {
  // Les labels navbar sont en uppercase CSS, le texte DOM est en minuscule
  // On clique sur le parent du label
  await page.evaluate((lbl) => {
    const items = document.querySelectorAll("div");
    for (const d of items) {
      if (d.textContent.trim().toLowerCase() === lbl.toLowerCase() && d.offsetHeight < 20) {
        d.closest("div[style]")?.click();
        return;
      }
    }
  }, navLabel);
  await page.waitForTimeout(1000);
}
