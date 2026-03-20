import { test, expect } from "@playwright/test";
import { fullSetup } from "./helpers.js";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await fullSetup(page);
    // Naviguer directement au dashboard via la route
    await page.goto("/#/dashboard");
    await page.waitForTimeout(2000);
  });

  test("dashboard affiche état vide", async ({ page }) => {
    // Sans données dans localStorage, le dashboard affiche le message vide
    await expect(page.getByText("Dashboard PDG")).toBeVisible();
    await expect(page.getByText("Commencez à utiliser MAESTROMIND")).toBeVisible();
  });

  test("dashboard affiche stats avec données", async ({ page }) => {
    // Injecter des données de chat et ratings dans localStorage
    await page.evaluate(() => {
      // Compteur messages obfusqué base64 (comme le fait l'app)
      localStorage.setItem("bl_mc_v2", btoa("42"));
      localStorage.setItem("bl_ratings", JSON.stringify([
        { ia: "coach", rating: 1 },
        { ia: "coach", rating: 1 },
        { ia: "diag", rating: 1 },
        { ia: "diag", rating: -1 },
        { ia: "normes", rating: 1 }
      ]));
      localStorage.setItem("bl_chat_coach", JSON.stringify([
        { role: "user", text: "Bonjour" },
        { role: "ai", text: "Comment puis-je vous aider ?" }
      ]));
      localStorage.setItem("bl_projets", JSON.stringify([
        { id: "p1", nom: "Réno cuisine", createdAt: Date.now() }
      ]));
    });
    // Recharger la page pour relire les données
    await page.reload({ waitUntil: "networkidle" });
    await page.goto("/#/dashboard");
    await page.waitForTimeout(2000);

    // Vérifier que les cartes de stats apparaissent
    await expect(page.getByText("Messages envoyés")).toBeVisible();
    await expect(page.getByText("Satisfaction")).toBeVisible();
    await expect(page.getByText("Conversations")).toBeVisible();
    await expect(page.getByText("Projets actifs")).toBeVisible();
  });

  test("sections dashboard visibles", async ({ page }) => {
    // Injecter des données pour déclencher la section top IAs
    await page.evaluate(() => {
      localStorage.setItem("bl_msg_count", "10");
      localStorage.setItem("bl_ratings", JSON.stringify([
        { ia: "coach", rating: 1 },
        { ia: "coach", rating: 1 },
        { ia: "coach", rating: 1 },
        { ia: "diag", rating: 1 },
        { ia: "normes", rating: -1 }
      ]));
      localStorage.setItem("mm_chat_coach", JSON.stringify([
        { role: "user", text: "Question test", ts: Date.now() - 3000 },
        { role: "assistant", text: "Réponse test", ts: Date.now() }
      ]));
    });
    await page.goto("/#/dashboard");
    await page.waitForTimeout(2000);

    // Section principale
    await expect(page.getByText("Dashboard PDG")).toBeVisible();
    // Section IA les plus utilisées
    await expect(page.getByText("IA les plus utilisées")).toBeVisible();
    // Section Divisions
    await expect(page.getByText("Divisions")).toBeVisible();
    // Section Éditeur IA
    await expect(page.getByText("Éditeur IA")).toBeVisible();
  });
});
