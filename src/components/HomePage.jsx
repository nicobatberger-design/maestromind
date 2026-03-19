import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { DIVISIONS, PROFILS } from "../data/constants";
import s from "../styles/index";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getAnalysisCount() {
  try {
    let count = parseInt(localStorage.getItem("mm_analysis_count") || "0");
    return count;
  } catch { return 0; }
}

function incrementAnalysisCount() {
  try {
    const c = getAnalysisCount() + 1;
    localStorage.setItem("mm_analysis_count", String(c));
    return c;
  } catch { return 0; }
}

function getLastProject() {
  try {
    const projets = JSON.parse(localStorage.getItem("bl_projets") || "[]");
    if (projets.length === 0) return null;
    // Return the most recently modified/created project
    return projets[projets.length - 1];
  } catch { return null; }
}

export default function HomePage() {
  const { page, goPage, switchDiv, userType, startUrgence, setToolTab, projets, crJournalierResult, crJournalierLoading, showCRJournalier, setShowCRJournalier, genererCRJournalier } = useApp();
  const [analysisCount, setAnalysisCount] = useState(getAnalysisCount);
  const [lastProject, setLastProject] = useState(getLastProject);

  // Update analysis count on page focus (in case it was updated elsewhere)
  useEffect(() => {
    if (page === "home") {
      setAnalysisCount(getAnalysisCount());
      setLastProject(getLastProject());
    }
  }, [page]);

  // Track analysis count from msgCount (obfusqué base64)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bl_mc_v2");
      const count = raw ? parseInt(atob(raw), 10) || 0 : 0;
      if (count > analysisCount) {
        localStorage.setItem("mm_analysis_count", String(count));
        setAnalysisCount(count);
      }
    } catch {}
  }, []);

  return (
    <div style={{ ...s.page, ...(page === "home" ? s.pageActive : {}) }}>
      <div style={s.hero}>
        <div style={{ color: "rgba(240,237,230,0.5)", fontSize: 12, marginBottom: 4 }}>{PROFILS[userType]?.icon} {getGreeting()}, {userType}</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, lineHeight: 1.15, marginBottom: 5 }}>MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span></div>
        <div style={{ color: "rgba(240,237,230,0.5)", fontSize: 11, marginBottom: 18 }}>33 IA spécialisées — Normes DTU — 11 divisions</div>

        {/* Last project quick access */}
        {lastProject && (
          <div onClick={() => goPage("projets")} style={{ background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.18)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.2s" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Dernier projet</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#C9A84C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastProject.nom || lastProject.type || "Projet"}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        )}

        <button style={s.cta} onClick={() => goPage("coach")}>
          <span>Quel est votre projet ?</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </button>
        <button onClick={genererCRJournalier} disabled={crJournalierLoading} style={{ width: "100%", background: "rgba(232,135,58,0.12)", border: "0.5px solid rgba(232,135,58,0.5)", borderRadius: 14, padding: "13px 18px", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#E8873A", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: crJournalierLoading ? 0.6 : 1 }}>
          {crJournalierLoading ? "Génération en cours..." : "\u{1F4CB} Fin de journée — CR IA"}
        </button>
        {showCRJournalier && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowCRJournalier(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "rgba(15,19,28,0.95)", border: "0.5px solid rgba(232,135,58,0.3)", borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#E8873A", marginBottom: 14 }}>{"\u{1F4CB}"} Compte-rendu de journée</div>
            <div style={{ fontSize: 12, color: "rgba(240,237,230,0.7)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{crJournalierResult || "Chargement..."}</div>
            <button onClick={() => setShowCRJournalier(false)} style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(240,237,230,0.5)", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Fermer</button>
          </div>
        </div>}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#E05252", marginBottom: 8 }}>{"\u{1F6A8}"} Urgence</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
            {[["\u{1F534}", "GAZ", "rgba(224,82,82,0.12)", "rgba(224,82,82,0.5)", "#E05252"], ["\u{1F535}", "EAU", "rgba(82,144,224,0.12)", "rgba(82,144,224,0.5)", "#5290E0"], ["\u26A1", "\u00C9LECTRICIT\u00C9", "rgba(232,135,58,0.12)", "rgba(232,135,58,0.5)", "#E8873A"]].map(([icon, label, bg, border, color]) => (
              <button key={label} onClick={() => startUrgence(label)} style={{ background: bg, border: "0.5px solid " + border, borderRadius: 12, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 1 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={s.stats3}>
        {[["33", "IA actives"], ["11", "Divisions"], [String(analysisCount), "Analyses"]].map(([v, l]) => (
          <div key={l} style={s.sc}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "#C9A84C" }}>{v}</div>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={s.secLbl}>Outils rapides</div>
      <div style={s.featGrid}>
        {(() => {
          const allTools = {
            devisPro: { label: "Devis Pro", sub: "Devis professionnel", color: "#E8873A", icon: "\u{1F4C4}", action: () => { goPage("outils"); setToolTab("devis_pro"); } },
            rentabilite: { label: "Rentabilité", sub: "Calcul marge artisan", color: "#52C37A", icon: "\u{1F4CA}", action: () => { goPage("outils"); setToolTab("rentabilite"); } },
            devis: { label: "Vérifier un devis", sub: "Prix justes ?", color: "#E8873A", icon: "\u{1F4CB}", action: () => { goPage("outils"); setToolTab("devis"); } },
            mat: { label: "Calculer matériaux", sub: "Quantités exactes", color: "#52C37A", icon: "\u{1F4D0}", action: () => { goPage("outils"); setToolTab("mat"); } },
            primes: { label: "Aides 2026", sub: "MaPrimeRénov' CEE", color: "#52C37A", icon: "\u{1F4B0}", action: () => { goPage("outils"); setToolTab("primes"); } },
            rge: { label: "Vérifier artisan", sub: "RGE & légitimité", color: "#5290E0", icon: "\u{1F6E1}\uFE0F", action: () => { goPage("outils"); setToolTab("rge"); } },
            shop: { label: "Boutique", sub: "Matériaux partenaires", color: "#C9A84C", icon: "\u{1F6D2}", action: () => { goPage("shop"); } },
            cert: { label: "Certificat DTU", sub: "Validation conformité", color: "#C9A84C", icon: "\u{1F3C5}", action: () => { goPage("cert"); } },
            planning: { label: "Planning", sub: "Planifier chantier", color: "#8B5CF6", icon: "\u{1F4C5}", action: () => { goPage("outils"); setToolTab("planning"); } },
          };
          const PROFIL_ORDER = {
            "Artisan Pro": ["devisPro", "rentabilite", "mat", "planning", "devis", "cert"],
            "Architecte": ["cert", "rge", "planning", "primes", "mat", "shop"],
            "Investisseur": ["primes", "rge", "devis", "shop", "mat", "cert"],
            "Particulier": ["devis", "mat", "primes", "rge", "shop", "cert"],
          };
          const order = PROFIL_ORDER[userType] || PROFIL_ORDER["Particulier"];
          return order.map(k => allTools[k]).filter(Boolean);
        })().map((t, i) => (
          <div key={i} className="bl-fc" style={s.fc} onClick={t.action}>
            <div style={{ ...s.fi, background: t.color + "18", border: "0.5px solid " + t.color + "44" }}>
              <span style={{ fontSize: 18 }}>{t.icon}</span>
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{t.sub}</div>
          </div>
        ))}
      </div>
      <div style={s.secLbl}>Divisions IA</div>
      <div style={s.featGrid}>
        {Object.entries(DIVISIONS).map(([div, info], i) => (
          <div key={div} className="bl-fc" style={i === 0 ? s.fcHi : s.fc} onClick={() => { goPage("coach"); switchDiv(div); }}>
            <div style={{ ...s.fi, background: info.color + "18", border: "0.5px solid " + info.color + "44" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{div}</div>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{info.ias.length} IA</div>
          </div>
        ))}
      </div>
    </div>
  );
}
