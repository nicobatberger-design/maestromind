#!/usr/bin/env node
/**
 * MAESTROMIND — Build Feature Script
 * Lancez avec : npm run build-feature
 *
 * Ce script lit features-manifest.json, affiche le menu interactif,
 * et applique les patches automatiques pour les features marquées autoPatch:true.
 */

const readline = require("readline");
const fs = require("fs");
const path = require("path");

// ── Couleurs ANSI ────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  gold: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgDark: "\x1b[40m",
  yellow: "\x1b[93m",
};
const g = (t) => c.gold + c.bold + t + c.reset;
const G = (t) => c.green + t + c.reset;
const R = (t) => c.red + t + c.reset;
const B = (t) => c.blue + t + c.reset;
const D = (t) => c.dim + t + c.reset;
const W = (t) => c.white + c.bold + t + c.reset;
const Y = (t) => c.yellow + t + c.reset;

// ── Chemins ──────────────────────────────────────────────────────
const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(ROOT, "features-manifest.json");
const APP_JSX = path.join(ROOT, "src", "App.jsx");
const ENV_EXAMPLE = path.join(ROOT, ".env.example");
const GITIGNORE = path.join(ROOT, ".gitignore");

// ── Chargement manifest ──────────────────────────────────────────
function loadManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
}

function saveManifest(data) {
  fs.writeFileSync(MANIFEST, JSON.stringify(data, null, 2));
}

// ── Affichage header ─────────────────────────────────────────────
function printHeader() {
  console.clear();
  console.log("\n" + g("  ╔══════════════════════════════════════════╗"));
  console.log(g("  ║") + W("        MAESTROMIND  BUILD FEATURE        ") + g("║"));
  console.log(g("  ║") + D("      Système d'amélioration automatique   ") + g("║"));
  console.log(g("  ╚══════════════════════════════════════════╝") + "\n");
}

// ── Icônes ───────────────────────────────────────────────────────
function statusIcon(status) {
  if (status === "done") return G("✓");
  if (status === "in_progress") return Y("◐");
  return D("○");
}

function complexityIcon(c) {
  if (c === "facile") return G("⚡");
  if (c === "moyen") return Y("🔧");
  return R("🏗");
}

function impactIcon(i) {
  if (i === "critique") return R("🔴");
  if (i === "fort") return Y("💰");
  if (i === "moyen") return B("📈");
  return D("🎨");
}

function patchIcon(auto) {
  return auto ? G("[AUTO]") : D("[MANUEL]");
}

// ── Listing features par sprint ──────────────────────────────────
function printFeatureList(manifest) {
  const features = manifest.features;
  const sprints = [...new Set(features.map((f) => f.sprint))].sort((a, b) => a - b);
  const total = features.length;
  const done = features.filter((f) => f.status === "done").length;
  const pending = features.filter((f) => f.status === "pending").length;
  const inProgress = features.filter((f) => f.status === "in_progress").length;

  console.log(
    `  ${G("✓ " + done + " terminées")}  ${Y("◐ " + inProgress + " en cours")}  ${D("○ " + pending + " à faire")}  ${W("/" + total + " total")}\n`
  );

  sprints.forEach((sprint) => {
    const sprintFeatures = features.filter((f) => f.sprint === sprint);
    const sprintDone = sprintFeatures.filter((f) => f.status === "done").length;
    const label = sprint <= 2 ? R(" P0") : sprint <= 4 ? Y(" P1") : sprint <= 6 ? B(" P2") : D(" P3");
    console.log(
      `  ${g("Sprint " + sprint)} ${label}  ${D("(" + sprintDone + "/" + sprintFeatures.length + " faites)")}`
    );

    sprintFeatures.forEach((f, i) => {
      const idx = features.indexOf(f);
      const num = String(idx + 1).padStart(2, " ");
      console.log(
        `   ${D(num + ".")} ${statusIcon(f.status)} ${complexityIcon(f.complexity)} ${impactIcon(f.impact)} ${
          f.status === "done" ? D(f.title) : W(f.title)
        } ${f.autoPatch ? G("[AUTO]") : ""}`
      );
    });
    console.log();
  });
}

// ── Détail d'une feature ─────────────────────────────────────────
function printFeatureDetail(f) {
  console.log("\n" + g("  ┌─ " + f.id + " ─────────────────────────────────"));
  console.log(g("  │ ") + W(f.title));
  console.log(g("  │"));
  console.log(g("  │ ") + D("Description : ") + f.description);
  console.log(g("  │ ") + D("Complexité  : ") + complexityIcon(f.complexity) + " " + f.complexity);
  console.log(g("  │ ") + D("Impact      : ") + impactIcon(f.impact) + " " + f.impact);
  console.log(g("  │ ") + D("Sprint      : ") + f.sprint + " · " + f.priority);
  console.log(g("  │ ") + D("Statut      : ") + statusIcon(f.status) + " " + f.status);
  console.log(g("  │ ") + D("Auto-patch  : ") + patchIcon(f.autoPatch));
  if (f.files.length > 0) {
    console.log(g("  │ ") + D("Fichiers    : ") + f.files.join(", "));
  }
  console.log(g("  └────────────────────────────────────────────") + "\n");
}

// ── PATCHES AUTOMATIQUES ─────────────────────────────────────────

const patches = {

  "S1-01": function patchPinHash() {
    console.log(Y("\n  Application du patch S1-01 — Hachage PIN PDG...\n"));
    let code = fs.readFileSync(APP_JSX, "utf8");

    if (code.includes("VITE_PDG_PIN_HASH")) {
      console.log(G("  ✓ Patch déjà appliqué (VITE_PDG_PIN_HASH présent)"));
      return true;
    }

    // Remplacer PDG_PIN en dur par une vérification hash
    const oldConst = `const PDG_PIN = "123456"; // Modifier ici pour changer le code PDG`;
    const newConst = `// PIN PDG sécurisé via hash SHA-256 (défini dans .env: VITE_PDG_PIN_HASH)
const PDG_PIN_HASH = import.meta.env.VITE_PDG_PIN_HASH || "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"; // hash par défaut de "123456"
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}`;

    code = code.replace(oldConst, newConst);

    // Adapter la validation du PIN
    const oldValidation = `      if (np === PDG_PIN) {
        setPdgUnlocked(true);
      } else {
        setTimeout(() => { setPinInput(""); setPinError("Code incorrect — réessayez"); }, 400);
      }`;
    const newValidation = `      hashPin(np).then(hash => {
        if (hash === PDG_PIN_HASH) {
          setPdgUnlocked(true);
        } else {
          setTimeout(() => { setPinInput(""); setPinError("Code incorrect — réessayez"); }, 400);
        }
      });`;

    code = code.replace(oldValidation, newValidation);

    fs.writeFileSync(APP_JSX, code);

    // Créer .env.example
    const envContent = `# MAESTROMIND — Variables d'environnement
# Copier ce fichier en .env et remplir les valeurs

# Hash SHA-256 du PIN PDG (par défaut: hash de "123456")
# Générer votre hash : echo -n "VOTRE_PIN" | sha256sum
VITE_PDG_PIN_HASH=8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92

# Clé API Anthropic (optionnel si backend API activé)
VITE_ANTHROPIC_KEY=sk-ant-votre-cle-ici

# Supabase (Sprint 1 - Auth)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme

# Stripe (Sprint 2 - Paiements)
VITE_STRIPE_PUBLIC_KEY=pk_live_votre-clé-publique
`;
    fs.writeFileSync(ENV_EXAMPLE, envContent);

    console.log(G("  ✓ src/App.jsx patché — PIN vérifié via SHA-256"));
    console.log(G("  ✓ .env.example créé"));
    console.log(Y("\n  → Créez votre .env avec votre hash PIN personnalisé"));
    console.log(D("  → Générez votre hash : echo -n 'VOTRE_PIN' | sha256sum\n"));
    return true;
  },

  "S1-02": function patchEnvSetup() {
    console.log(Y("\n  Application du patch S1-02 — Variables d'environnement...\n"));

    const envContent = `# MAESTROMIND — Variables d'environnement
# Copier ce fichier en .env et remplir les valeurs

# Hash SHA-256 du PIN PDG (par défaut: hash de "123456")
VITE_PDG_PIN_HASH=8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92

# Clé API Anthropic
VITE_ANTHROPIC_KEY=sk-ant-votre-cle-ici

# Supabase (Auth + DB)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme

# Stripe (Paiements)
VITE_STRIPE_PUBLIC_KEY=pk_live_votre-clé-publique
`;
    fs.writeFileSync(ENV_EXAMPLE, envContent);

    // Vérifier/créer .gitignore
    let gitignore = "";
    if (fs.existsSync(GITIGNORE)) {
      gitignore = fs.readFileSync(GITIGNORE, "utf8");
    }
    if (!gitignore.includes(".env")) {
      gitignore += "\n# Variables d'environnement — NE JAMAIS COMMITTER\n.env\n.env.local\n.env.production\n";
      fs.writeFileSync(GITIGNORE, gitignore);
      console.log(G("  ✓ .gitignore mis à jour — .env exclu du git"));
    } else {
      console.log(G("  ✓ .gitignore déjà configuré correctement"));
    }

    console.log(G("  ✓ .env.example créé avec toutes les variables nécessaires"));
    console.log(Y("\n  → Copiez .env.example en .env et remplissez vos vraies valeurs\n"));
    return true;
  },

  "S1-06": function patchRGPD() {
    console.log(Y("\n  Application du patch S1-06 — Mentions légales RGPD...\n"));
    let code = fs.readFileSync(APP_JSX, "utf8");

    if (code.includes('"rgpd_accepted"')) {
      console.log(G("  ✓ Patch RGPD déjà appliqué"));
      return true;
    }

    // Ajouter état consentement
    const oldState = `  const [pdgUnlocked, setPdgUnlocked] = useState(false);`;
    const newState = `  const [rgpdOk, setRgpdOk] = useState(() => localStorage.getItem("rgpd_accepted") === "1");
  const [pdgUnlocked, setPdgUnlocked] = useState(false);`;
    code = code.replace(oldState, newState);

    // Ajouter le bandeau RGPD dans le return principal (avant la fermeture du div app)
    const oldClosing = `      </div>\n    </>\n  );\n}`;
    const newClosing = `      </div>

      {/* Bandeau RGPD */}
      {!rgpdOk && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(10,14,22,0.97)", backdropFilter:"blur(20px)", borderTop:"0.5px solid rgba(201,168,76,0.2)", padding:"14px 16px", zIndex:9999, boxShadow:"0 -8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize:11, color:"rgba(240,237,230,0.6)", marginBottom:10, lineHeight:1.6 }}>
            MAESTROMIND utilise des cookies essentiels. En continuant, vous acceptez notre{" "}
            <span style={{ color:"#C9A84C", cursor:"pointer" }}>politique de confidentialité</span>.
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { localStorage.setItem("rgpd_accepted","1"); setRgpdOk(true); }} style={{ flex:1, background:"linear-gradient(135deg,#EDD060,#C9A84C)", border:"none", borderRadius:10, padding:"10px", fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:"#06080D", cursor:"pointer" }}>
              Accepter
            </button>
            <button onClick={() => { localStorage.setItem("rgpd_accepted","1"); setRgpdOk(true); }} style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px", fontSize:12, color:"rgba(240,237,230,0.5)", cursor:"pointer" }}>
              Essentiels uniquement
            </button>
          </div>
        </div>
      )}
    </>
  );
}`;
    code = code.replace(oldClosing, newClosing);
    fs.writeFileSync(APP_JSX, code);
    console.log(G("  ✓ Bandeau RGPD ajouté (consentement CNIL)"));
    console.log(G("  ✓ localStorage 'rgpd_accepted' géré"));
    return true;
  },

  "S2-02": function patchPaywall() {
    console.log(Y("\n  Application du patch S2-02 — Paywall doux...\n"));
    let code = fs.readFileSync(APP_JSX, "utf8");

    if (code.includes("msgCount") && code.includes("showPaywall")) {
      console.log(G("  ✓ Paywall déjà appliqué"));
      return true;
    }

    // Ajouter états
    const oldState = `  const [pdgUnlocked, setPdgUnlocked] = useState(false);`;
    const newState = `  const [msgCount, setMsgCount] = useState(() => parseInt(localStorage.getItem("bl_msg_count") || "0"));
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPremium] = useState(() => localStorage.getItem("bl_premium") === "1");
  const [pdgUnlocked, setPdgUnlocked] = useState(false);`;
    code = code.replace(oldState, newState);

    // Incrémenter compteur dans send()
    const oldSend = `    setLoading(true);`;
    const newSend = `    const newCount = msgCount + 1;
    setMsgCount(newCount);
    localStorage.setItem("bl_msg_count", newCount);
    if (!isPremium && newCount > 0 && newCount % 5 === 0) { setShowPaywall(true); return; }
    setLoading(true);`;
    code = code.replace(oldSend, newSend);

    // Ajouter modal paywall dans le return (avant fermeture app div)
    const oldClosing = `      </div>\n    </>\n  );\n}`;
    const newClosing = `      </div>

      {/* Modal Paywall */}
      {showPaywall && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(16px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:9998, maxWidth:430, margin:"0 auto", left:"50%", transform:"translateX(-50%)", width:"100%" }}>
          <div style={{ width:"100%", background:"rgba(10,14,22,0.98)", border:"0.5px solid rgba(201,168,76,0.3)", borderRadius:"20px 20px 0 0", padding:"28px 24px 40px", boxShadow:"0 -20px 60px rgba(201,168,76,0.1)" }}>
            <div style={{ width:48, height:4, background:"rgba(255,255,255,0.1)", borderRadius:2, margin:"0 auto 24px" }} />
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, marginBottom:8 }}>Passez <span style={{ color:"#C9A84C" }}>Premium</span></div>
            <div style={{ fontSize:12, color:"rgba(240,237,230,0.5)", marginBottom:24, lineHeight:1.7 }}>Vous avez utilisé vos messages gratuits. Premium débloque les 32 IA, le scanner illimité et les rapports PDF.</div>
            {[["32 IA spécialisées","illimitées"],["Scanner photo","illimité"],["Certificats PDF","illimités"],["Historique","conservé"]].map(([a,b]) => (
              <div key={a} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:12 }}>
                <span style={{ color:"rgba(240,237,230,0.7)" }}>{a}</span>
                <span style={{ color:"#52C37A", fontWeight:700 }}>{b}</span>
              </div>
            ))}
            <button onClick={() => { alert("Redirection Stripe — configurez VITE_STRIPE_PUBLIC_KEY dans .env"); setShowPaywall(false); }} style={{ width:"100%", background:"linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border:"none", borderRadius:14, padding:"15px", fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:"#06080D", cursor:"pointer", marginTop:16, boxShadow:"0 4px 24px rgba(201,168,76,0.4)" }}>
              9,99€ / mois — Commencer
            </button>
            <button onClick={() => setShowPaywall(false)} style={{ width:"100%", background:"transparent", border:"none", marginTop:12, fontSize:12, color:"rgba(240,237,230,0.3)", cursor:"pointer" }}>
              Continuer gratuitement (limité)
            </button>
          </div>
        </div>
      )}
    </>
  );
}`;
    code = code.replace(oldClosing, newClosing);
    fs.writeFileSync(APP_JSX, code);
    console.log(G("  ✓ Modal paywall ajouté (déclenché tous les 5 messages)"));
    console.log(G("  ✓ Compteur messages localStorage"));
    console.log(Y("  → Connectez Stripe avec VITE_STRIPE_PUBLIC_KEY dans .env\n"));
    return true;
  },

  "S2-03": function patchAffiliation() {
    console.log(Y("\n  Application du patch S2-03 — Liens d'affiliation...\n"));
    let code = fs.readFileSync(APP_JSX, "utf8");

    if (code.includes("utm_source=maestromind")) {
      console.log(G("  ✓ UTM tracking déjà appliqué"));
      return true;
    }

    const oldLink = `window.open("https://www."+p.s+"/recherche?q="+encodeURIComponent(p.n),"_blank")`;
    const newLink = `window.open("https://www."+p.s+"/recherche?q="+encodeURIComponent(p.n)+"&utm_source=maestromind&utm_medium=app&utm_campaign=shop","_blank")`;
    code = code.replace(oldLink, newLink);
    fs.writeFileSync(APP_JSX, code);
    console.log(G("  ✓ Paramètres UTM ajoutés sur tous les liens boutique"));
    console.log(D("  → Remplacez les URLs par vos vraies URLs d'affiliation Affilae/Leroy\n"));
    return true;
  },

  "S3-01": function patchOnboarding() {
    console.log(Y("\n  Application du patch S3-01 — Onboarding 3 écrans...\n"));
    let code = fs.readFileSync(APP_JSX, "utf8");

    if (code.includes("onboardingDone") || code.includes("bl_onboarded")) {
      console.log(G("  ✓ Onboarding déjà appliqué"));
      return true;
    }

    const oldState = `  const [pdgUnlocked, setPdgUnlocked] = useState(false);`;
    const newState = `  const [onboardingDone, setOnboardingDone] = useState(() => localStorage.getItem("bl_onboarded") === "1");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userType, setUserType] = useState("Particulier");
  const [pdgUnlocked, setPdgUnlocked] = useState(false);`;
    code = code.replace(oldState, newState);

    const onboardingJSX = `
  if (pdgUnlocked && !onboardingDone) {
    const steps = [
      { title: "Bienvenue sur", highlight: "MAESTROMIND", sub: "32 IA expertes du bâtiment à votre service, disponibles 24h/24.", icon: "🏗" },
      { title: "Quel est votre profil ?", highlight: "", sub: "Cela personnalise vos conseils IA.", icon: "👷", choices: ["Particulier","Artisan Pro","Architecte","Investisseur"] },
      { title: "Vous êtes prêt !", highlight: "", sub: "Activez les notifications pour ne rater aucun rappel chantier.", icon: "🔔" },
    ];
    const step = steps[onboardingStep];
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
        <div style={{ display:"flex", flexDirection:"column", height:"100vh", maxWidth:430, margin:"0 auto", background:"#06080D", color:"#F0EDE6", fontFamily:"'DM Sans',sans-serif", alignItems:"center", justifyContent:"center", padding:"0 32px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-80, left:"50%", transform:"translateX(-50%)", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)", pointerEvents:"none" }} />
          <div style={{ fontSize:56, marginBottom:24 }}>{step.icon}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, textAlign:"center", lineHeight:1.2, marginBottom:8 }}>
            {step.title} {step.highlight && <span style={{ color:"#C9A84C" }}>{step.highlight}</span>}
          </div>
          <div style={{ fontSize:13, color:"rgba(240,237,230,0.5)", textAlign:"center", lineHeight:1.7, marginBottom:36 }}>{step.sub}</div>
          {step.choices && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, width:"100%", marginBottom:24 }}>
              {step.choices.map(ch => (
                <button key={ch} onClick={() => setUserType(ch)} style={{ padding:"12px", borderRadius:12, border:"0.5px solid "+(userType===ch?"#C9A84C":"rgba(255,255,255,0.08)"), background:userType===ch?"rgba(201,168,76,0.12)":"rgba(15,19,28,0.6)", color:userType===ch?"#C9A84C":"rgba(240,237,230,0.6)", fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:500, cursor:"pointer" }}>{ch}</button>
              ))}
            </div>
          )}
          <div style={{ display:"flex", gap:8, marginBottom:32 }}>
            {steps.map((_,i) => <div key={i} style={{ width:i===onboardingStep?24:8, height:8, borderRadius:4, background:i===onboardingStep?"#C9A84C":"rgba(255,255,255,0.1)", transition:"all 0.3s" }} />)}
          </div>
          <button onClick={() => { if (onboardingStep < steps.length-1) { setOnboardingStep(s=>s+1); } else { localStorage.setItem("bl_onboarded","1"); localStorage.setItem("bl_user_type",userType); setOnboardingDone(true); } }} style={{ width:"100%", background:"linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border:"none", borderRadius:14, padding:"15px", fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:"#06080D", cursor:"pointer", boxShadow:"0 4px 24px rgba(201,168,76,0.35)" }}>
            {onboardingStep < steps.length-1 ? "Continuer →" : "Commencer maintenant"}
          </button>
          {onboardingStep > 0 && <button onClick={() => setOnboardingStep(s=>s-1)} style={{ background:"transparent", border:"none", marginTop:12, fontSize:12, color:"rgba(240,237,230,0.3)", cursor:"pointer" }}>← Retour</button>}
        </div>
      </>
    );
  }

`;

    // Insérer avant le return principal
    code = code.replace(
      `  const handlePin = (d) => {`,
      onboardingJSX + `  const handlePin = (d) => {`
    );

    fs.writeFileSync(APP_JSX, code);
    console.log(G("  ✓ Onboarding 3 étapes ajouté (Bienvenue, Profil, Notifications)"));
    console.log(G("  ✓ Type utilisateur sauvegardé en localStorage (bl_user_type)"));
    console.log(G("  ✓ Indicateurs de progression animés\n"));
    return true;
  },

  "S3-07": function patchRating() {
    console.log(Y("\n  Application du patch S3-07 — Rating réponses IA...\n"));
    let code = fs.readFileSync(APP_JSX, "utf8");

    if (code.includes("rateMsg") || code.includes("bl_ratings")) {
      console.log(G("  ✓ Rating déjà appliqué"));
      return true;
    }

    // Ajouter fonction rating
    const oldCalcDPE = `  const calcDPE = () => {`;
    const ratingFn = `  const rateMsg = (msgIdx, rating) => {
    const ratings = JSON.parse(localStorage.getItem("bl_ratings") || "[]");
    ratings.push({ ia: curIA, rating, timestamp: Date.now(), msgIdx });
    localStorage.setItem("bl_ratings", JSON.stringify(ratings));
    setMsgs(prev => prev.map((m, i) => i === msgIdx ? { ...m, rated: rating } : m));
  };

  `;
    code = code.replace(oldCalcDPE, ratingFn + oldCalcDPE);

    // Ajouter boutons rating sous les messages IA
    const oldBubble = `                    <div style={m.role==="ai"?s.bubA:s.bubU} dangerouslySetInnerHTML={{__html: m.text==="..."?"<span>...</span>":m.text.replace(/\\*\\*(.*?)\\*\\*/g,"<strong>$1</strong>").replace(/\\n/g,"<br/>")}}/>`;
    const newBubble = `                    <div style={{ maxWidth:"78%" }}>
                      <div style={m.role==="ai"?s.bubA:s.bubU} dangerouslySetInnerHTML={{__html: m.text==="..."?"<span>...</span>":m.text.replace(/\\*\\*(.*?)\\*\\*/g,"<strong>$1</strong>").replace(/\\n/g,"<br/>")}}/>
                      {m.role==="ai" && m.text !== "..." && (
                        <div style={{ display:"flex", gap:6, marginTop:5, paddingLeft:2 }}>
                          <button onClick={() => rateMsg(i, 1)} style={{ background:m.rated===1?"rgba(82,195,122,0.15)":"transparent", border:"0.5px solid "+(m.rated===1?"#52C37A":"rgba(255,255,255,0.07)"), borderRadius:20, padding:"2px 8px", fontSize:11, color:m.rated===1?"#52C37A":"rgba(240,237,230,0.3)", cursor:"pointer" }}>👍</button>
                          <button onClick={() => rateMsg(i, -1)} style={{ background:m.rated===-1?"rgba(224,82,82,0.12)":"transparent", border:"0.5px solid "+(m.rated===-1?"#E05252":"rgba(255,255,255,0.07)"), borderRadius:20, padding:"2px 8px", fontSize:11, color:m.rated===-1?"#E05252":"rgba(240,237,230,0.3)", cursor:"pointer" }}>👎</button>
                        </div>
                      )}
                    </div>`;
    code = code.replace(oldBubble, newBubble);

    fs.writeFileSync(APP_JSX, code);
    console.log(G("  ✓ Boutons 👍/👎 ajoutés sous chaque réponse IA"));
    console.log(G("  ✓ Feedbacks sauvegardés en localStorage (bl_ratings)"));
    console.log(G("  ✓ État visuel du vote conservé\n"));
    return true;
  },

  "S4-06": function patchRetry() {
    console.log(Y("\n  Application du patch S4-06 — Gestion erreurs réseau...\n"));
    let code = fs.readFileSync(APP_JSX, "utf8");

    if (code.includes("retryCount") || code.includes("withRetry")) {
      console.log(G("  ✓ Retry déjà appliqué"));
      return true;
    }

    // Ajouter helper withRetry
    const oldCalcDPE = `  const calcDPE = () => {`;
    const retryFn = `  const withRetry = async (fn, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try { return await fn(); }
      catch (e) {
        if (i === retries - 1) throw e;
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  };

  `;
    code = code.replace(oldCalcDPE, retryFn + oldCalcDPE);

    // Wrapper le fetch dans send()
    const oldFetch = `      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: IAS[curIA].sys, messages: newHist.slice(-10) }),
      });`;
    const newFetch = `      const r = await withRetry(() => fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: IAS[curIA].sys, messages: newHist.slice(-10) }),
      }));`;
    code = code.replace(oldFetch, newFetch);

    fs.writeFileSync(APP_JSX, code);
    console.log(G("  ✓ withRetry helper ajouté (3 tentatives, backoff exponentiel)"));
    console.log(G("  ✓ Appels API chat protégés contre les erreurs réseau transitoires\n"));
    return true;
  },
};

// ── Menu interactif ──────────────────────────────────────────────
async function askQuestion(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function applyPatch(featureId, manifest) {
  const patch = patches[featureId];
  if (!patch) {
    console.log(R("\n  ✗ Aucun patch automatique disponible pour " + featureId));
    console.log(D("  → Consultez ROADMAP.md pour les instructions manuelles\n"));
    return false;
  }
  try {
    const success = await patch();
    if (success) {
      const idx = manifest.features.findIndex((f) => f.id === featureId);
      if (idx !== -1) {
        manifest.features[idx].status = "done";
        manifest.features[idx].appliedAt = new Date().toISOString();
        saveManifest(manifest);
        console.log(G("  ✓ Statut mis à jour dans features-manifest.json\n"));
      }
    }
    return success;
  } catch (e) {
    console.log(R("\n  ✗ Erreur lors de l'application du patch : " + e.message));
    console.log(D("  → Vérifiez que src/App.jsx n'a pas déjà été modifié manuellement\n"));
    return false;
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  printHeader();
  const manifest = loadManifest();

  while (true) {
    printFeatureList(manifest);

    console.log(g("  Commandes :"));
    console.log(`   ${W("1-" + manifest.features.length)} → Sélectionner une feature`);
    console.log(`   ${W("a")}       → Appliquer tous les patches automatiques (AUTO)`);
    console.log(`   ${W("q")}       → Quitter\n`);

    const answer = await askQuestion(rl, g("  → ") + " Votre choix : ");

    if (answer.toLowerCase() === "q") {
      console.log("\n" + g("  Au revoir ! Bonne dev. 🚀") + "\n");
      rl.close();
      process.exit(0);
    }

    if (answer.toLowerCase() === "a") {
      console.log(Y("\n  Lancement de tous les patches automatiques...\n"));
      const autoPatchable = manifest.features.filter((f) => f.autoPatch && f.status === "pending");
      if (autoPatchable.length === 0) {
        console.log(G("  ✓ Tous les patches automatiques ont déjà été appliqués !\n"));
      } else {
        for (const f of autoPatchable) {
          console.log(g("  ─── " + f.id + " : " + f.title + " ───"));
          await applyPatch(f.id, manifest);
        }
        console.log(G("  ✓ Tous les patches automatiques appliqués !\n"));
      }
      await askQuestion(rl, D("  Appuyez sur Entrée pour continuer..."));
      printHeader();
      continue;
    }

    const idx = parseInt(answer) - 1;
    if (isNaN(idx) || idx < 0 || idx >= manifest.features.length) {
      continue;
    }

    const feature = manifest.features[idx];
    printHeader();
    printFeatureDetail(feature);

    if (feature.status === "done") {
      console.log(G("  ✓ Cette feature est déjà terminée.\n"));
      await askQuestion(rl, D("  Appuyez sur Entrée pour revenir..."));
      printHeader();
      continue;
    }

    console.log(g("  Actions :"));
    if (feature.autoPatch) {
      console.log(`   ${W("1")} → Appliquer le patch automatique`);
    }
    console.log(`   ${W("2")} → Marquer comme en cours`);
    console.log(`   ${W("3")} → Marquer comme terminée`);
    console.log(`   ${W("4")} → Afficher instructions manuelles`);
    console.log(`   ${W("0")} → Retour\n`);

    const action = await askQuestion(rl, g("  → ") + " Action : ");

    if (action === "1" && feature.autoPatch) {
      await applyPatch(feature.id, manifest);
      await askQuestion(rl, D("  Appuyez sur Entrée pour continuer..."));
    } else if (action === "2") {
      feature.status = "in_progress";
      saveManifest(manifest);
      console.log(Y("  ◐ Marquée en cours\n"));
    } else if (action === "3") {
      feature.status = "done";
      feature.appliedAt = new Date().toISOString();
      saveManifest(manifest);
      console.log(G("  ✓ Marquée comme terminée\n"));
      await askQuestion(rl, D("  Appuyez sur Entrée pour continuer..."));
    } else if (action === "4") {
      console.log("\n" + Y("  Instructions manuelles pour " + feature.id + ":"));
      console.log(D("  ─────────────────────────────────────────────"));
      console.log("  " + feature.description);
      if (feature.files.length > 0) {
        console.log("\n" + D("  Fichiers à créer/modifier :"));
        feature.files.forEach((f) => console.log("    · " + W(f)));
      }
      console.log("\n" + D("  Consultez ROADMAP.md pour les détails complets.\n"));
      await askQuestion(rl, D("  Appuyez sur Entrée pour continuer..."));
    }

    printHeader();
  }
}

main().catch((e) => {
  console.error(R("\n  Erreur fatale : " + e.message));
  process.exit(1);
});
