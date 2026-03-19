/**
 * MAESTROMIND — Test automatique de l'app
 * Lance : node scripts/test-app.mjs
 * Prend des screenshots de chaque page et vérifie les fonctionnalités
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'https://nicobatberger-design.github.io/maestromind/';
const SCREENSHOTS_DIR = 'test-results';
const TIMEOUT = 15000;

let browser, page;
const results = [];

function log(status, test, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${test}${detail ? ' — ' + detail : ''}`);
  results.push({ status, test, detail });
}

async function screenshot(name) {
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${name}.png`, fullPage: false });
}

async function run() {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 }, // iPhone 14 Pro Max
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    locale: 'fr-FR',
  });
  page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT);

  console.log('\n🏗 MAESTROMIND — Tests automatiques\n');
  console.log('URL:', BASE);
  console.log('Viewport: 430×932 (iPhone 14 Pro Max)\n');

  // ── TEST 1 : Page charge ──
  try {
    const res = await page.goto(BASE, { waitUntil: 'networkidle' });
    log(res.status() === 200 ? 'PASS' : 'FAIL', 'Page charge', `HTTP ${res.status()}`);
    await screenshot('01-initial-load');
  } catch (e) {
    log('FAIL', 'Page charge', e.message);
  }

  // ── TEST 2 : Onboarding visible ──
  try {
    const onboarding = await page.locator('text=Bienvenue sur').isVisible();
    if (onboarding) {
      log('PASS', 'Onboarding visible');
      await screenshot('02-onboarding');

      // Click Particulier
      const particulier = page.locator('button:has-text("Particulier")');
      if (await particulier.isVisible()) {
        await particulier.click();
        log('PASS', 'Profil Particulier sélectionné');
      }

      // Click Continuer 3 fois
      for (let i = 0; i < 3; i++) {
        const continuer = page.locator('button:has-text("Continuer"), button:has-text("Commencer")').first();
        if (await continuer.isVisible()) {
          await continuer.click();
          await page.waitForTimeout(300);
        }
      }
      await screenshot('03-after-onboarding');
    } else {
      log('WARN', 'Onboarding non visible', 'peut-être déjà complété (localStorage)');
    }
  } catch (e) {
    log('WARN', 'Onboarding', e.message);
  }

  // ── TEST 3 : PIN screen ──
  try {
    const pinScreen = await page.locator('text=Interface PDG').isVisible();
    if (pinScreen) {
      log('PASS', 'PIN screen visible');
      await screenshot('04-pin-screen');

      // Enter PIN 123456 (default hash)
      const digits = ['1', '2', '3', '4', '5', '6'];
      for (const d of digits) {
        const btn = page.locator(`button.bl-pin:has-text("${d}")`).first();
        if (await btn.isVisible()) await btn.click();
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(1000);
      await screenshot('05-after-pin');
    } else {
      log('WARN', 'PIN screen non visible', 'peut-être déjà déverrouillé');
    }
  } catch (e) {
    log('WARN', 'PIN screen', e.message);
  }

  // ── TEST 3.5 : Accepter RGPD si présent ──
  try {
    const rgpdBtn = page.locator('button:has-text("Accepter")').first();
    if (await rgpdBtn.isVisible({ timeout: 2000 })) {
      await rgpdBtn.click({ force: true });
      await page.waitForTimeout(500);
      log('PASS', 'RGPD banner accepté');
    }
  } catch (e) {
    // RGPD may not be visible, that's ok
  }

  // ── TEST 4 : Page d'accueil ──
  try {
    await page.waitForTimeout(1000);
    const maestro = await page.locator('text=MAESTRO').first().isVisible();
    log(maestro ? 'PASS' : 'WARN', 'App principale visible');
    await screenshot('06-home');
  } catch (e) {
    log('WARN', 'App principale', e.message);
  }

  // ── TEST 5 : Navigation — chaque onglet ──
  const tabs = [
    { label: '32 IA', id: 'coach' },
    { label: 'Scanner', id: 'scanner' },
    { label: 'Outils', id: 'outils' },
    { label: 'Projets', id: 'projets' },
    { label: 'Accueil', id: 'home' },
  ];

  for (const tab of tabs) {
    try {
      const navBtn = page.locator(`text=${tab.label}`).last();
      if (await navBtn.isVisible()) {
        await navBtn.click();
        await page.waitForTimeout(500);
        await screenshot(`07-nav-${tab.id}`);
        log('PASS', `Navigation → ${tab.label}`);
      } else {
        log('FAIL', `Navigation → ${tab.label}`, 'bouton non trouvé');
      }
    } catch (e) {
      log('FAIL', `Navigation → ${tab.label}`, e.message);
    }
  }

  // ── TEST 6 : Chat IA — envoyer un message ──
  try {
    // Go to coach
    await page.locator('text=32 IA').last().click();
    await page.waitForTimeout(500);

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('Bonjour, test automatique');
      await screenshot('08-chat-input');
      log('PASS', 'Chat — input message');

      // Don't actually send (would use API credits)
      // Just verify the send button exists
      const sendBtn = page.locator('button svg polygon').first();
      log(await sendBtn.isVisible() ? 'PASS' : 'FAIL', 'Chat — bouton envoi visible');
    }
  } catch (e) {
    log('FAIL', 'Chat IA', e.message);
  }

  // ── TEST 7 : Scanner — tabs visibles ──
  try {
    await page.locator('text=Scanner').last().click();
    await page.waitForTimeout(500);

    const diagTab = await page.locator('text=Diagnostic IA').isVisible();
    const mesureTab = await page.locator('text=Mesurer').isVisible();
    log(diagTab ? 'PASS' : 'FAIL', 'Scanner — tab Diagnostic');
    log(mesureTab ? 'PASS' : 'FAIL', 'Scanner — tab Mesurer');
    await screenshot('09-scanner');
  } catch (e) {
    log('FAIL', 'Scanner', e.message);
  }

  // ── TEST 8 : Outils — tabs visibles ──
  try {
    await page.locator('text=Outils').last().click();
    await page.waitForTimeout(500);

    const devisTab = await page.locator('text=Devis').first().isVisible();
    const matTab = await page.locator('text=Matériaux').first().isVisible();
    log(devisTab ? 'PASS' : 'FAIL', 'Outils — tab Devis');
    log(matTab ? 'PASS' : 'FAIL', 'Outils — tab Matériaux');
    await screenshot('10-outils');
  } catch (e) {
    log('FAIL', 'Outils', e.message);
  }

  // ── TEST 9 : Thème clair ──
  try {
    const themeBtn = page.locator('button[title="Thème"]').or(page.locator('button:has-text("☀")').or(page.locator('button:has-text("🌙")'))).first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      await screenshot('11-theme-clair');
      log('PASS', 'Thème clair activé');
      // Switch back
      await themeBtn.click();
    } else {
      log('WARN', 'Thème clair', 'bouton non trouvé');
    }
  } catch (e) {
    log('WARN', 'Thème clair', e.message);
  }

  // ── TEST 10 : Bouton photo Coach ──
  try {
    await page.locator('text=32 IA').last().click();
    await page.waitForTimeout(300);
    const photoBtn = page.locator('input[type="file"][accept="image/*"]').first();
    log(await photoBtn.count() > 0 ? 'PASS' : 'FAIL', 'Coach — bouton photo présent');
  } catch (e) {
    log('FAIL', 'Coach photo', e.message);
  }

  // ── TEST 11 : Vérifier pas d'erreurs console ──
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  log(errors.length === 0 ? 'PASS' : 'FAIL', 'Console sans erreurs JS', errors.length > 0 ? errors.join('; ') : '');

  // ── RÉSUMÉ ──
  console.log('\n' + '═'.repeat(50));
  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  const warn = results.filter(r => r.status === 'WARN').length;
  console.log(`\n📊 Résultats : ${pass} PASS | ${fail} FAIL | ${warn} WARN`);
  console.log(`📸 Screenshots dans ./${SCREENSHOTS_DIR}/\n`);

  if (fail > 0) {
    console.log('❌ Tests échoués :');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`   - ${r.test}: ${r.detail}`));
  }

  await browser.close();

  // Write JSON report
  writeFileSync(`${SCREENSHOTS_DIR}/report.json`, JSON.stringify({ date: new Date().toISOString(), results, summary: { pass, fail, warn } }, null, 2));
  console.log(`\n📄 Rapport : ${SCREENSHOTS_DIR}/report.json`);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
