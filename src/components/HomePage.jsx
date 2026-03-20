import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { DIVISIONS, PROFILS } from "../data/constants";
import s from "../styles/index";

function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

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

function AnimatedStats({ analysisCount }) {
  const iaCount = useCountUp(33, 1000);
  const divCount = useCountUp(11, 1000);
  const analCount = useCountUp(analysisCount, 1000);
  return (
    <div style={s.stats3}>
      {[[iaCount, "IA actives"], [divCount, "Divisions"], [analysisCount === 0 ? "\u2014" : analCount, analysisCount === 0 ? "Lancez-vous !" : "Analyses"]].map(([v, l]) => (
        <div key={l} className="stat-card-hover" style={s.sc}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "#C9A84C" }}>{v}</div>
          <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{l}</div>
        </div>
      ))}
    </div>
  );
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
        <div style={{ color: "rgba(240,237,230,0.5)", fontSize: 12, marginBottom: 4 }}>{PROFILS[userType]?.icon} {userType === "Particulier" ? `${getGreeting()} !` : `${getGreeting()}, ${userType}`}</div>
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
      <AnimatedStats analysisCount={analysisCount} />
      <div style={s.secLbl}>Outils rapides</div>
      <div style={s.featGrid}>
        {(() => {
          const svgIcon = (paths, color) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
          );
          const allTools = {
            devisPro: { label: "Devis Pro", sub: "Devis professionnel", color: "#E8873A", iconSvg: (c) => svgIcon(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>, c), action: () => { goPage("outils"); setToolTab("devis_pro"); } },
            rentabilite: { label: "Rentabilité", sub: "Calcul marge artisan", color: "#52C37A", iconSvg: (c) => svgIcon(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>, c), action: () => { goPage("outils"); setToolTab("rentabilite"); } },
            devis: { label: "Vérifier un devis", sub: "Prix justes ?", color: "#E8873A", iconSvg: (c) => svgIcon(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></>, c), action: () => { goPage("outils"); setToolTab("devis"); } },
            mat: { label: "Calculer matériaux", sub: "Quantités exactes", color: "#52C37A", iconSvg: (c) => svgIcon(<><path d="M21 3H3v7h18V3z" /><path d="M21 14H3v7h18v-7z" /><path d="M12 3v7" /><path d="M12 14v7" /><path d="M3 10l4-4" /><path d="M7 10l4-4" /></>, c), action: () => { goPage("outils"); setToolTab("mat"); } },
            primes: { label: "Aides 2026", sub: "MaPrimeRénov' CEE", color: "#52C37A", iconSvg: (c) => svgIcon(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>, c), action: () => { goPage("outils"); setToolTab("primes"); } },
            rge: { label: "Vérifier artisan", sub: "RGE & légitimité", color: "#5290E0", iconSvg: (c) => svgIcon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></>, c), action: () => { goPage("outils"); setToolTab("rge"); } },
            shop: { label: "Boutique", sub: "Matériaux partenaires", color: "#C9A84C", iconSvg: (c) => svgIcon(<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>, c), action: () => { goPage("shop"); } },
            cert: { label: "Certificat DTU", sub: "Validation conformité", color: "#C9A84C", iconSvg: (c) => svgIcon(<><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>, c), action: () => { goPage("cert"); } },
            planning: { label: "Planning", sub: "Planifier chantier", color: "#8B5CF6", iconSvg: (c) => svgIcon(<><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>, c), action: () => { goPage("outils"); setToolTab("planning"); } },
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
              {t.iconSvg ? t.iconSvg(t.color) : <span style={{ fontSize: 18 }}>{t.icon}</span>}
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{t.sub}</div>
          </div>
        ))}
      </div>
      <div onClick={genererCRJournalier} style={{ margin: "0 16px 14px", background: "rgba(232,135,58,0.06)", border: "0.5px solid rgba(232,135,58,0.2)", borderRadius: 10, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, opacity: crJournalierLoading ? 0.6 : 1 }}>
        <span style={{ fontSize: 14 }}>{"\u{1F4CB}"}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#E8873A" }}>{crJournalierLoading ? "Génération en cours..." : "Générer le CR de journée \u2192"}</span>
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
      <div style={s.secLbl}>Pas sûr par où commencer ?</div>
      <div style={{ padding: "0 16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { emoji: "\u{1F4F8}", title: "J'ai un problème", sub: "Photographiez-le \u2192 diagnostic IA instantané", action: () => goPage("scanner") },
          { emoji: "\u{1F4C4}", title: "J'ai un devis", sub: "Collez-le \u2192 analyse prix et anomalies", action: () => { goPage("outils"); setToolTab("devis"); } },
          { emoji: "\u{1F4AC}", title: "J'ai une question", sub: "Posez-la \u2192 33 IA spécialisées répondent", action: () => goPage("coach") },
        ].map((item, i) => (
          <div key={i} className="bl-fc" onClick={item.action} style={{ ...s.card, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "14px 16px" }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>{item.emoji}</div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{item.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginLeft: "auto" }}><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        ))}
      </div>
    </div>
  );
}
