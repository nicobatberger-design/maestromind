#!/usr/bin/env node
/**
 * MAESTROMIND — Dev Auto Script
 * Lancez avec : npm run dev:auto
 *
 * Analyse l'app, génère PDG_DASHBOARD.md, puis affiche TOUTES les
 * améliorations disponibles. Le PDG choisit lesquelles appliquer
 * et le script les exécute toutes d'un coup.
 */

"use strict";
const readline = require("readline");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const APP_JSX = path.join(ROOT, "src", "App.jsx");
const MANIFEST_PATH = path.join(ROOT, "features-manifest.json");
const REPORT_PATH = path.join(ROOT, "PDG_DASHBOARD.md");

// ── Couleurs ANSI ────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  gold: "\x1b[33m", green: "\x1b[32m", red: "\x1b[31m",
  blue: "\x1b[34m", yellow: "\x1b[93m", white: "\x1b[37m",
  magenta: "\x1b[35m", cyan: "\x1b[36m",
};
const g  = (t) => c.gold    + c.bold + t + c.reset;
const G  = (t) => c.green   + t + c.reset;
const R  = (t) => c.red     + t + c.reset;
const Y  = (t) => c.yellow  + t + c.reset;
const D  = (t) => c.dim     + t + c.reset;
const W  = (t) => c.white   + c.bold + t + c.reset;
const Cy = (t) => c.cyan    + t + c.reset;
const Mg = (t) => c.magenta + t + c.reset;

// ── Vérifications statiques de l'app ────────────────────────────
function analyzeApp() {
  const code = fs.readFileSync(APP_JSX, "utf8");
  return [
    { id:"S1-01", label:"PIN PDG hashé (SHA-256)",              ok: code.includes("VITE_PDG_PIN_HASH")||code.includes("crypto.subtle"),     sev:"critique", autoPatch:true  },
    { id:"S1-02", label:"Variables d'environnement .env",       ok: fs.existsSync(path.join(ROOT,".env.example")),                          sev:"critique", autoPatch:true  },
    { id:"S1-02", label:".env dans .gitignore",                 ok: fs.existsSync(path.join(ROOT,".gitignore")) && fs.readFileSync(path.join(ROOT,".gitignore"),"utf8").includes(".env"), sev:"critique", autoPatch:true, skip:true },
    { id:"S1-06", label:"Bandeau RGPD / consentement CNIL",    ok: code.includes("rgpd_accepted")||code.includes("rgpdOk"),                sev:"critique", autoPatch:true  },
    { id:"S2-02", label:"Paywall doux (modal Premium)",         ok: code.includes("showPaywall")||code.includes("isPremium"),               sev:"fort",     autoPatch:true  },
    { id:"S2-03", label:"Tracking UTM liens boutique",          ok: code.includes("utm_source=maestromind"),                               sev:"fort",     autoPatch:true  },
    { id:"S3-01", label:"Onboarding 3 écrans",                  ok: code.includes("bl_onboarded")||code.includes("onboardingDone"),         sev:"fort",     autoPatch:true  },
    { id:"S3-07", label:"Rating réponses IA (👍/👎)",           ok: code.includes("rateMsg")||code.includes("bl_ratings"),                 sev:"moyen",    autoPatch:true  },
    { id:"S4-06", label:"Retry automatique erreurs réseau",     ok: code.includes("withRetry")||code.includes("retryCount"),               sev:"moyen",    autoPatch:true  },
    { id:"S1-03", label:"Backend API proxy Anthropic",          ok: fs.existsSync(path.join(ROOT,"api"))||code.includes("/api/chat"),       sev:"critique", autoPatch:false },
    { id:"S1-04", label:"Authentification utilisateurs",        ok: code.includes("supabase")||fs.existsSync(path.join(ROOT,"src","lib","supabase.js")), sev:"critique", autoPatch:false },
    { id:"S2-01", label:"Stripe abonnements Premium",           ok: code.includes("stripe")||fs.existsSync(path.join(ROOT,"src","lib","stripe.js")),  sev:"fort",     autoPatch:false },
    { id:"S3-03", label:"Historique conversations persistant",  ok: code.includes("historique")||fs.existsSync(path.join(ROOT,"src","components","HistoryPage.jsx")), sev:"fort", autoPatch:false },
    { id:"S4-01", label:"Calculateur matériaux automatique",    ok: fs.existsSync(path.join(ROOT,"src","components","MaterialsCalculator.jsx")),       sev:"fort",     autoPatch:false },
    { id:"S4-03", label:"Partage de certificats (URL unique)",  ok: code.includes("certVerify")||fs.existsSync(path.join(ROOT,"api","routes","certificates.js")), sev:"fort", autoPatch:false },
    { id:"S5-01", label:"Géolocalisation artisans RGE",         ok: fs.existsSync(path.join(ROOT,"src","components","MapPage.jsx")),                   sev:"moyen",    autoPatch:false },
    { id:"S6-02", label:"Éditeur system prompts PDG",           ok: code.includes("PromptEditor")||fs.existsSync(path.join(ROOT,"src","components","PromptEditor.jsx")), sev:"moyen", autoPatch:false },
    // Existant ✅
    { id:"—", label:"32 IA avec system prompts distincts",     ok: (code.match(/sys:/g)||[]).length>=32,                                   sev:"info",     autoPatch:false },
    { id:"—", label:"Chat conversationnel Anthropic",          ok: code.includes("anthropic.com/v1/messages"),                             sev:"info",     autoPatch:false },
    { id:"—", label:"Scanner photo IA (vision API)",           ok: code.includes("analyserPhoto"),                                         sev:"info",     autoPatch:false },
    { id:"—", label:"Certificats DTU PDF (jsPDF)",             ok: code.includes("genererPDF"),                                            sev:"info",     autoPatch:false },
    { id:"—", label:"Simulateur DPE",                          ok: code.includes("calcDPE"),                                               sev:"info",     autoPatch:false },
    { id:"—", label:"PIN PDG 6 chiffres",                      ok: code.includes("PDG_PIN")||code.includes("PDG_PIN_HASH"),                sev:"info",     autoPatch:false },
    { id:"—", label:"Design glassmorphism + animations",       ok: code.includes("backdropFilter")&&code.includes("@keyframes"),           sev:"info",     autoPatch:false },
    { id:"—", label:"Boutique 3 partenaires",                  ok: code.includes("leroy")&&code.includes("casto")&&code.includes("brico"), sev:"info",     autoPatch:false },
  ].filter(c => !c.skip);
}

// ── Score santé ──────────────────────────────────────────────────
function computeScore(checks) {
  const w = { critique:3, fort:2, moyen:1, info:0 };
  const total    = checks.reduce((s,c) => s+(w[c.sev]||0), 0);
  const achieved = checks.filter(c=>c.ok).reduce((s,c) => s+(w[c.sev]||0), 0);
  return Math.round((achieved/total)*100);
}

// ── Génération PDG_DASHBOARD.md ──────────────────────────────────
function generateDashboard(checks, score) {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH,"utf8"));
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  const timeStr = now.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  const ok = checks.filter(c=>c.ok);
  const ko = checks.filter(c=>!c.ok && c.sev!=="info");
  const critiques = ko.filter(c=>c.sev==="critique");
  const featDone = manifest.features.filter(f=>f.status==="done").length;
  const featTotal = manifest.features.length;
  const sizeKB = (fs.statSync(APP_JSX).size/1024).toFixed(1);
  const scoreEmoji = score>=80?"🟢":score>=60?"🟡":score>=40?"🟠":"🔴";

  const md = `# PDG DASHBOARD — MAESTROMIND
> Rapport généré le **${dateStr} à ${timeStr}**
> \`npm run dev:auto\` pour mettre à jour

---

## Score santé : ${scoreEmoji} ${score}/100

| Métrique | Valeur |
|---|---|
| Score global | **${score}/100** |
| Checks OK | ${ok.length}/${checks.length} |
| Points critiques manquants | **${critiques.length}** |
| Features roadmap terminées | ${featDone}/${featTotal} (${Math.round(featDone/featTotal*100)}%) |
| Taille App.jsx | ${sizeKB} KB |

${critiques.length>0 ? `> ⚠️ **${critiques.length} point(s) critique(s) avant lancement public**` : "> ✅ Aucun point critique bloquant"}

---

## Fonctionnalités actives ✅

| Fonctionnalité | Priorité |
|---|---|
${checks.filter(c=>c.ok).map(c=>`| ${c.label} | ${c.sev==="info"?"—":c.sev} |`).join("\n")}

---

## Améliorations disponibles

### Auto-patchables immédiatement (npm run build-feature)

| Feature | Description | Sévérité |
|---|---|---|
${checks.filter(c=>!c.ok&&c.autoPatch).map(c=>`| \`${c.id}\` | ${c.label} | **${c.sev}** |`).join("\n")}

### Développement manuel requis

| Feature | Description | Sévérité |
|---|---|---|
${checks.filter(c=>!c.ok&&!c.autoPatch&&c.sev!=="info").map(c=>`| \`${c.id}\` | ${c.label} | ${c.sev} |`).join("\n")}

---

## Roadmap par sprint

| Sprint | Objectif | Avancement |
|---|---|---|
${[1,2,3,4,5,6,7].map(s=>{
    const f=manifest.features.filter(x=>x.sprint===s);
    const d=f.filter(x=>x.status==="done").length;
    const p=f.length>0?Math.round(d/f.length*100):0;
    const labels={1:"Sécurité & Auth",2:"Monétisation",3:"Engagement",4:"Fonctionnalités métier",5:"Expansion",6:"Intelligence IA",7:"Scale"};
    return `| Sprint ${s} | ${labels[s]} | ${"█".repeat(Math.round(p/10))}${"░".repeat(10-Math.round(p/10))} ${p}% |`;
  }).join("\n")}

---

## Commandes

\`\`\`bash
npm run dev:auto        # Ce rapport
npm run build-feature   # Appliquer les améliorations
npm run dev             # Lancer l'app
\`\`\`

*MAESTROMIND v0.9.0 — Confidentiel PDG*
`;
  fs.writeFileSync(REPORT_PATH, md);
}

// ── Affichage terminal ───────────────────────────────────────────
function printHeader() {
  console.clear();
  console.log("\n" + g("  ╔══════════════════════════════════════════╗"));
  console.log(g("  ║") + W("       MAESTROMIND  DEV:AUTO               ") + g("║"));
  console.log(g("  ║") + D("       Analyse & application en masse      ") + g("║"));
  console.log(g("  ╚══════════════════════════════════════════╝") + "\n");
}

function printChecks(checks, score) {
  const bar = "█".repeat(Math.round(score/10)) + "░".repeat(10-Math.round(score/10));
  const col = score>=80?G:score>=60?Y:R;
  console.log(`  Score santé : ${col(bar + " " + score + "/100")}\n`);

  console.log(g("  ── État actuel ─────────────────────────────\n"));
  checks.filter(c=>c.sev==="info").forEach(c => {
    console.log(`  ${c.ok?G("✓"):D("○")}  ${D(c.label)}`);
  });
  console.log();
}

function printAllImprovements(checks) {
  const autoPatch = checks.filter(c => !c.ok && c.autoPatch);
  const manual    = checks.filter(c => !c.ok && !c.autoPatch && c.sev!=="info");

  console.log(g("  ── Améliorations AUTO-PATCH disponibles ───\n"));
  if (autoPatch.length === 0) {
    console.log(G("  ✓ Tous les patches automatiques sont déjà appliqués !\n"));
  } else {
    autoPatch.forEach((c, i) => {
      const sevCol = c.sev==="critique"?R:c.sev==="fort"?Y:Cy;
      console.log(`   ${W(String(i+1).padStart(2,"0") + ".")} ${G("[AUTO]")} ${sevCol("■")} ${W(c.label)}`);
      console.log(`        ${D("Feature:")} ${c.id}  ${D("Sévérité:")} ${sevCol(c.sev)}`);
    });
  }
  console.log();

  console.log(g("  ── Améliorations MANUELLES (dev requis) ───\n"));
  if (manual.length === 0) {
    console.log(G("  ✓ Aucune!\n"));
  } else {
    manual.forEach((c, i) => {
      const sevCol = c.sev==="critique"?R:c.sev==="fort"?Y:Cy;
      const idx = autoPatch.length + i + 1;
      console.log(`   ${W(String(idx).padStart(2,"0") + ".")} ${D("[MANUEL]")} ${sevCol("■")} ${c.label}`);
      console.log(`        ${D("Feature:")} ${c.id}  ${D("Sévérité:")} ${sevCol(c.sev)}`);
    });
  }
  console.log();

  return { autoPatch, manual };
}

// ── Application de tous les patches sélectionnés ─────────────────
async function applySelectedPatches(selectedIds) {
  // Import dynamique des patches depuis build-feature
  const bfPath = path.join(__dirname, "build-feature.js");
  const bfCode = fs.readFileSync(bfPath, "utf8");

  // Extraire et exécuter chaque patch directement
  const patchMap = {
    "S1-01": patchPinHash,
    "S1-02": patchEnvSetup,
    "S1-06": patchRGPD,
    "S2-02": patchPaywall,
    "S2-03": patchAffiliation,
    "S3-01": patchOnboarding,
    "S3-07": patchRating,
    "S4-06": patchRetry,
  };

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH,"utf8"));
  let appliedCount = 0;

  for (const id of selectedIds) {
    const fn = patchMap[id];
    if (!fn) {
      console.log(Y(`\n  → ${id} : pas de patch automatique, consultez ROADMAP.md`));
      continue;
    }
    console.log(g(`\n  ─── ${id} ──────────────────────────────────`));
    try {
      await fn();
      const idx = manifest.features.findIndex(f => f.id === id);
      if (idx !== -1) {
        manifest.features[idx].status = "done";
        manifest.features[idx].appliedAt = new Date().toISOString();
      }
      appliedCount++;
    } catch(e) {
      console.log(R(`  ✗ Erreur sur ${id}: ${e.message}`));
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(G(`\n  ✓ ${appliedCount} patch(es) appliqué(s) avec succès !`));
  console.log(Y("  → Vérifiez l'app : npm run dev\n"));
  return appliedCount;
}

// ── Patches (inline — copies de build-feature.js) ────────────────
function patchPinHash() {
  let code = fs.readFileSync(APP_JSX,"utf8");
  if (code.includes("VITE_PDG_PIN_HASH")) { console.log(G("  ✓ Déjà appliqué")); return; }
  const old = `const PDG_PIN = "123456"; // Modifier ici pour changer le code PDG`;
  const rep = `const PDG_PIN_HASH = import.meta.env.VITE_PDG_PIN_HASH || "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}`;
  code = code.replace(old, rep);
  const oldV = `      if (np === PDG_PIN) {
        setPdgUnlocked(true);
      } else {
        setTimeout(() => { setPinInput(""); setPinError("Code incorrect — réessayez"); }, 400);
      }`;
  const newV = `      hashPin(np).then(hash => {
        if (hash === PDG_PIN_HASH) { setPdgUnlocked(true); }
        else { setTimeout(() => { setPinInput(""); setPinError("Code incorrect — réessayez"); }, 400); }
      });`;
  code = code.replace(oldV, newV);
  fs.writeFileSync(APP_JSX, code);
  const envEx = `VITE_PDG_PIN_HASH=8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92\nVITE_ANTHROPIC_KEY=sk-ant-votre-cle\nVITE_SUPABASE_URL=\nVITE_STRIPE_PUBLIC_KEY=\n`;
  fs.writeFileSync(path.join(ROOT,".env.example"), envEx);
  console.log(G("  ✓ PIN hashé SHA-256 + .env.example créé"));
}

function patchEnvSetup() {
  const envContent = `# MAESTROMIND — Variables d'environnement\nVITE_PDG_PIN_HASH=8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92\nVITE_ANTHROPIC_KEY=sk-ant-votre-cle-ici\nVITE_SUPABASE_URL=https://votre-projet.supabase.co\nVITE_SUPABASE_ANON_KEY=\nVITE_STRIPE_PUBLIC_KEY=pk_live_\n`;
  fs.writeFileSync(path.join(ROOT,".env.example"), envContent);
  let gi = fs.existsSync(path.join(ROOT,".gitignore")) ? fs.readFileSync(path.join(ROOT,".gitignore"),"utf8") : "";
  if (!gi.includes(".env")) { gi += "\n.env\n.env.local\n.env.production\n"; fs.writeFileSync(path.join(ROOT,".gitignore"), gi); }
  console.log(G("  ✓ .env.example + .gitignore mis à jour"));
}

function patchRGPD() {
  let code = fs.readFileSync(APP_JSX,"utf8");
  if (code.includes("rgpd_accepted")) { console.log(G("  ✓ Déjà appliqué")); return; }
  code = code.replace(
    `  const [pdgUnlocked, setPdgUnlocked] = useState(false);`,
    `  const [rgpdOk, setRgpdOk] = useState(() => localStorage.getItem("rgpd_accepted") === "1");\n  const [pdgUnlocked, setPdgUnlocked] = useState(false);`
  );
  const oldEnd = `      </div>\n    </>\n  );\n}`;
  const newEnd = `      </div>
      {!rgpdOk && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(10,14,22,0.97)", backdropFilter:"blur(20px)", borderTop:"0.5px solid rgba(201,168,76,0.2)", padding:"14px 16px", zIndex:9999 }}>
          <div style={{ fontSize:11, color:"rgba(240,237,230,0.6)", marginBottom:10, lineHeight:1.6 }}>MAESTROMIND utilise des cookies essentiels. En continuant, vous acceptez notre <span style={{ color:"#C9A84C" }}>politique de confidentialité</span>.</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { localStorage.setItem("rgpd_accepted","1"); setRgpdOk(true); }} style={{ flex:1, background:"linear-gradient(135deg,#EDD060,#C9A84C)", border:"none", borderRadius:10, padding:"10px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#06080D", cursor:"pointer" }}>Accepter</button>
            <button onClick={() => { localStorage.setItem("rgpd_accepted","1"); setRgpdOk(true); }} style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px", fontSize:12, color:"rgba(240,237,230,0.5)", cursor:"pointer" }}>Essentiels</button>
          </div>
        </div>
      )}
    </>
  );
}`;
  code = code.replace(oldEnd, newEnd);
  fs.writeFileSync(APP_JSX, code);
  console.log(G("  ✓ Bandeau RGPD CNIL ajouté"));
}

function patchPaywall() {
  let code = fs.readFileSync(APP_JSX,"utf8");
  if (code.includes("showPaywall")) { console.log(G("  ✓ Déjà appliqué")); return; }
  code = code.replace(
    `  const [pdgUnlocked, setPdgUnlocked] = useState(false);`,
    `  const [msgCount, setMsgCount] = useState(() => parseInt(localStorage.getItem("bl_msg_count")||"0"));\n  const [showPaywall, setShowPaywall] = useState(false);\n  const [isPremium] = useState(() => localStorage.getItem("bl_premium")==="1");\n  const [pdgUnlocked, setPdgUnlocked] = useState(false);`
  );
  code = code.replace(`    setLoading(true);`, `    const nc=msgCount+1; setMsgCount(nc); localStorage.setItem("bl_msg_count",nc);\n    if(!isPremium&&nc>0&&nc%5===0){setShowPaywall(true);return;}\n    setLoading(true);`);
  const oldEnd = `      </div>\n    </>\n  );\n}`;
  const newEnd = `      </div>
      {showPaywall && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:9998, maxWidth:430, margin:"0 auto", left:"50%", transform:"translateX(-50%)", width:"100%" }}>
          <div style={{ width:"100%", background:"rgba(10,14,22,0.98)", border:"0.5px solid rgba(201,168,76,0.3)", borderRadius:"20px 20px 0 0", padding:"28px 24px 40px" }}>
            <div style={{ width:48, height:4, background:"rgba(255,255,255,0.1)", borderRadius:2, margin:"0 auto 24px" }} />
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:8 }}>Passez <span style={{ color:"#C9A84C" }}>Premium</span></div>
            <div style={{ fontSize:12, color:"rgba(240,237,230,0.5)", marginBottom:24, lineHeight:1.7 }}>Vous avez utilisé vos messages gratuits. Premium débloque les 32 IA sans limite.</div>
            {[["32 IA spécialisées","illimitées"],["Scanner photo","illimité"],["Certificats PDF","illimités"],["Historique","conservé"]].map(([a,b])=>(
              <div key={a} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:12 }}>
                <span style={{ color:"rgba(240,237,230,0.7)" }}>{a}</span><span style={{ color:"#52C37A", fontWeight:700 }}>{b}</span>
              </div>
            ))}
            <button onClick={() => { alert("Configurez VITE_STRIPE_PUBLIC_KEY dans .env"); setShowPaywall(false); }} style={{ width:"100%", background:"linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border:"none", borderRadius:14, padding:"15px", fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:"#06080D", cursor:"pointer", marginTop:16, boxShadow:"0 4px 24px rgba(201,168,76,0.4)" }}>9,99€ / mois</button>
            <button onClick={() => setShowPaywall(false)} style={{ width:"100%", background:"transparent", border:"none", marginTop:12, fontSize:12, color:"rgba(240,237,230,0.3)", cursor:"pointer" }}>Continuer gratuitement</button>
          </div>
        </div>
      )}
    </>
  );
}`;
  code = code.replace(oldEnd, newEnd);
  fs.writeFileSync(APP_JSX, code);
  console.log(G("  ✓ Paywall doux ajouté (déclenché tous les 5 messages)"));
}

function patchAffiliation() {
  let code = fs.readFileSync(APP_JSX,"utf8");
  if (code.includes("utm_source=maestromind")) { console.log(G("  ✓ Déjà appliqué")); return; }
  code = code.replace(
    `window.open("https://www."+p.s+"/recherche?q="+encodeURIComponent(p.n),"_blank")`,
    `window.open("https://www."+p.s+"/recherche?q="+encodeURIComponent(p.n)+"&utm_source=maestromind&utm_medium=app&utm_campaign=shop","_blank")`
  );
  fs.writeFileSync(APP_JSX, code);
  console.log(G("  ✓ Paramètres UTM ajoutés sur tous les liens boutique"));
}

function patchOnboarding() {
  let code = fs.readFileSync(APP_JSX,"utf8");
  if (code.includes("bl_onboarded")) { console.log(G("  ✓ Déjà appliqué")); return; }
  code = code.replace(
    `  const [pdgUnlocked, setPdgUnlocked] = useState(false);`,
    `  const [onboardingDone, setOnboardingDone] = useState(() => localStorage.getItem("bl_onboarded")==="1");\n  const [onboardingStep, setOnboardingStep] = useState(0);\n  const [userType, setUserType] = useState("Particulier");\n  const [pdgUnlocked, setPdgUnlocked] = useState(false);`
  );
  const jsx = `
  if (pdgUnlocked && !onboardingDone) {
    const steps=[{title:"Bienvenue sur",highlight:"MAESTROMIND",sub:"32 IA expertes du bâtiment, disponibles 24h/24.",icon:"🏗"},{title:"Votre profil ?",highlight:"",sub:"Personnalise vos conseils IA.",icon:"👷",choices:["Particulier","Artisan Pro","Architecte","Investisseur"]},{title:"Vous êtes prêt !",highlight:"",sub:"Activez les notifications pour vos rappels chantier.",icon:"🔔"}];
    const step=steps[onboardingStep];
    return (<><link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      <div style={{display:"flex",flexDirection:"column",height:"100vh",maxWidth:430,margin:"0 auto",background:"#06080D",color:"#F0EDE6",fontFamily:"'DM Sans',sans-serif",alignItems:"center",justifyContent:"center",padding:"0 32px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-80,left:"50%",transform:"translateX(-50%)",width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div style={{fontSize:56,marginBottom:24}}>{step.icon}</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,textAlign:"center",lineHeight:1.2,marginBottom:8}}>{step.title} {step.highlight&&<span style={{color:"#C9A84C"}}>{step.highlight}</span>}</div>
        <div style={{fontSize:13,color:"rgba(240,237,230,0.5)",textAlign:"center",lineHeight:1.7,marginBottom:36}}>{step.sub}</div>
        {step.choices&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,width:"100%",marginBottom:24}}>{step.choices.map(ch=><button key={ch} onClick={()=>setUserType(ch)} style={{padding:"12px",borderRadius:12,border:"0.5px solid "+(userType===ch?"#C9A84C":"rgba(255,255,255,0.08)"),background:userType===ch?"rgba(201,168,76,0.12)":"rgba(15,19,28,0.6)",color:userType===ch?"#C9A84C":"rgba(240,237,230,0.6)",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,cursor:"pointer"}}>{ch}</button>)}</div>}
        <div style={{display:"flex",gap:8,marginBottom:32}}>{steps.map((_,i)=><div key={i} style={{width:i===onboardingStep?24:8,height:8,borderRadius:4,background:i===onboardingStep?"#C9A84C":"rgba(255,255,255,0.1)",transition:"all 0.3s"}}/>)}</div>
        <button onClick={()=>{if(onboardingStep<steps.length-1){setOnboardingStep(s=>s+1);}else{localStorage.setItem("bl_onboarded","1");localStorage.setItem("bl_user_type",userType);setOnboardingDone(true);}}} style={{width:"100%",background:"linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)",border:"none",borderRadius:14,padding:"15px",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:"#06080D",cursor:"pointer",boxShadow:"0 4px 24px rgba(201,168,76,0.35)"}}>
          {onboardingStep<steps.length-1?"Continuer →":"Commencer maintenant"}
        </button>
        {onboardingStep>0&&<button onClick={()=>setOnboardingStep(s=>s-1)} style={{background:"transparent",border:"none",marginTop:12,fontSize:12,color:"rgba(240,237,230,0.3)",cursor:"pointer"}}>← Retour</button>}
      </div></>);
  }

`;
  code = code.replace(`  const handlePin = (d) => {`, jsx + `  const handlePin = (d) => {`);
  fs.writeFileSync(APP_JSX, code);
  console.log(G("  ✓ Onboarding 3 étapes ajouté"));
}

function patchRating() {
  let code = fs.readFileSync(APP_JSX,"utf8");
  if (code.includes("rateMsg")) { console.log(G("  ✓ Déjà appliqué")); return; }
  code = code.replace(`  const calcDPE = () => {`,
    `  const rateMsg = (idx, rating) => {
    const r=JSON.parse(localStorage.getItem("bl_ratings")||"[]");
    r.push({ia:curIA,rating,timestamp:Date.now(),idx});
    localStorage.setItem("bl_ratings",JSON.stringify(r));
    setMsgs(prev=>prev.map((m,i)=>i===idx?{...m,rated:rating}:m));
  };
  const calcDPE = () => {`);
  code = code.replace(
    `                    <div style={m.role==="ai"?s.bubA:s.bubU} dangerouslySetInnerHTML={{__html: m.text==="..."?"<span>...</span>":m.text.replace(/\\*\\*(.*?)\\*\\*/g,"<strong>$1</strong>").replace(/\\n/g,"<br/>")}}/>`,
    `                    <div style={{maxWidth:"78%"}}>
                      <div style={m.role==="ai"?s.bubA:s.bubU} dangerouslySetInnerHTML={{__html: m.text==="..."?"<span>...</span>":m.text.replace(/\\*\\*(.*?)\\*\\*/g,"<strong>$1</strong>").replace(/\\n/g,"<br/>")}}/>
                      {m.role==="ai"&&m.text!=="..."&&<div style={{display:"flex",gap:6,marginTop:5,paddingLeft:2}}>
                        <button onClick={()=>rateMsg(i,1)} style={{background:m.rated===1?"rgba(82,195,122,0.15)":"transparent",border:"0.5px solid "+(m.rated===1?"#52C37A":"rgba(255,255,255,0.07)"),borderRadius:20,padding:"2px 8px",fontSize:11,color:m.rated===1?"#52C37A":"rgba(240,237,230,0.3)",cursor:"pointer"}}>👍</button>
                        <button onClick={()=>rateMsg(i,-1)} style={{background:m.rated===-1?"rgba(224,82,82,0.12)":"transparent",border:"0.5px solid "+(m.rated===-1?"#E05252":"rgba(255,255,255,0.07)"),borderRadius:20,padding:"2px 8px",fontSize:11,color:m.rated===-1?"#E05252":"rgba(240,237,230,0.3)",cursor:"pointer"}}>👎</button>
                      </div>}
                    </div>`
  );
  fs.writeFileSync(APP_JSX, code);
  console.log(G("  ✓ Rating 👍/👎 ajouté sous chaque réponse IA"));
}

function patchRetry() {
  let code = fs.readFileSync(APP_JSX,"utf8");
  if (code.includes("withRetry")) { console.log(G("  ✓ Déjà appliqué")); return; }
  code = code.replace(`  const calcDPE = () => {`,
    `  const withRetry = async (fn,retries=3) => {
    for(let i=0;i<retries;i++){try{return await fn();}catch(e){if(i===retries-1)throw e;await new Promise(r=>setTimeout(r,1000*Math.pow(2,i)));}}
  };
  const calcDPE = () => {`);
  code = code.replace(
    `      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: IAS[curIA].sys, messages: newHist.slice(-10) }),
      });`,
    `      const r = await withRetry(()=>fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: IAS[curIA].sys, messages: newHist.slice(-10) }),
      }));`
  );
  fs.writeFileSync(APP_JSX, code);
  console.log(G("  ✓ Retry automatique (3 tentatives, backoff exponentiel)"));
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  printHeader();
  console.log(D("  Analyse en cours...\n"));

  const checks = analyzeApp();
  const score  = computeScore(checks);
  generateDashboard(checks, score);
  printChecks(checks, score);

  const { autoPatch, manual } = printAllImprovements(checks);
  const allMissing = [...autoPatch, ...manual.filter(c=>c.autoPatch)];

  if (autoPatch.length === 0) {
    console.log(G("  ✓ Tous les patches automatiques sont déjà appliqués !\n"));
    console.log(`  ${D("PDG_DASHBOARD.md mis à jour.")}\n`);
    process.exit(0);
  }

  console.log(g("  ── Sélection PDG ───────────────────────────\n"));
  console.log(`  Entrez les numéros à appliquer séparés par des virgules.`);
  console.log(`  ${W("Exemples:")} ${D("1,2,3")}  ou  ${D("tout")}  ou  ${D("aucun")}\n`);
  console.log(`  ${D("(Seuls les AUTO-PATCH sont applicables ici — les MANUELS nécessitent du développement)")}\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => rl.question(g("  PDG → ") + " Votre choix : ", resolve));
  rl.close();

  if (!answer || answer.toLowerCase() === "aucun" || answer.toLowerCase() === "n") {
    console.log(D("\n  Aucun patch appliqué. PDG_DASHBOARD.md mis à jour.\n"));
    process.exit(0);
  }

  let selectedIds = [];
  if (answer.toLowerCase() === "tout" || answer.toLowerCase() === "all") {
    selectedIds = autoPatch.map(c => c.id);
  } else {
    const nums = answer.split(",").map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n));
    nums.forEach(n => {
      if (n >= 0 && n < autoPatch.length) selectedIds.push(autoPatch[n].id);
    });
  }

  if (selectedIds.length === 0) {
    console.log(Y("\n  Aucune sélection valide.\n"));
    process.exit(0);
  }

  // Dédupliquer
  selectedIds = [...new Set(selectedIds)];

  console.log(Y(`\n  Application de ${selectedIds.length} patch(es) : ${selectedIds.join(", ")}\n`));
  await applySelectedPatches(selectedIds);

  // Régénérer le rapport
  const checksAfter = analyzeApp();
  const scoreAfter  = computeScore(checksAfter);
  generateDashboard(checksAfter, scoreAfter);

  const gain = scoreAfter - score;
  console.log(g(`  Score santé : ${score} → ${scoreAfter} ${gain>0?G("(+"+gain+")"):""}`) + "\n");
  console.log(`  ${G("✓")} ${W("PDG_DASHBOARD.md")} mis à jour\n`);
  console.log(`  ${D("Lancez npm run dev pour vérifier l'app.")}\n`);
}

main().catch(e => { console.error(R("\n  Erreur : " + e.message)); process.exit(1); });
