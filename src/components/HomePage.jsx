import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { PROFILS } from "../data/constants";
import { getContexteLocal, resumeMeteo } from "../utils/geolocation";
import s from "../styles/index";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getLastProject() {
  try { const p = JSON.parse(localStorage.getItem("bl_projets") || "[]"); return p.length ? p[0] : null; } catch { return null; }
}

const TIPS = [
  { title: "Peinture : sous-couche d'abord", text: "Résultat meilleur, moins de couches, -20% de peinture." },
  { title: "Carrelage >30cm : double encollage", text: "Colle au sol ET au dos. Obligatoire DTU 52.1." },
  { title: "Électricité : coupez + vérifiez", text: "Disjoncteur OFF + testeur VAT avant toute intervention." },
  { title: "Humidité : aérez 10 min/jour", text: "-15% d'humidité, moins de moisissures." },
  { title: "Isolation : les combles d'abord", text: "30% de chaleur par le toit. R≥7 = -30% de chauffage." },
  { title: "Devis : comparez 3 minimum", text: "Écarts de 40% possibles entre artisans." },
  { title: "Vis placo : tous les 30cm", text: "DTU 25.41 — affleurement, jamais traverser le carton." },
];

export default function HomePage() {
  const { page, goPage, userType, startUrgence, setToolTab, crJournalierLoading, showCRJournalier, setShowCRJournalier, crJournalierResult, genererCRJournalier } = useApp();
  const [lastProject, setLastProject] = useState(getLastProject);
  const [showUrgence, setShowUrgence] = useState(false);
  const [geoContexte, setGeoContexte] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => { if (page === "home") setLastProject(getLastProject()); }, [page]);

  const chargerMeteo = useCallback(async () => {
    setGeoLoading(true);
    try {
      const ctx = await getContexteLocal();
      if (!ctx.error) setGeoContexte(ctx);
    } catch {} finally { setGeoLoading(false); }
  }, []);

  const tip = TIPS[new Date().getDay() % TIPS.length];

  return (
    <div style={{ ...s.page, ...(page === "home" ? s.pageActive : {}) }}>

      {/* ── Hero ── */}
      <div style={{ padding: "28px 20px 20px" }}>
        <div style={{ color: "rgba(240,237,230,0.4)", fontSize: 13, marginBottom: 6 }}>{PROFILS[userType]?.icon} {getGreeting()} !</div>
        <div className="gold-text" style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>MAESTROMIND</div>

        {/* CTA principal */}
        <button className="gold-btn" style={{ ...s.cta, borderRadius: 16, padding: "16px 20px", marginBottom: 0 }} onClick={() => goPage("coach")} aria-label="Posez votre question au coach IA">
          <span style={{ fontSize: 14 }}>Posez votre question</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </button>
      </div>

      {/* ── 3 actions rapides (scanner / question / devis) ── */}
      <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Scanner", sub: "Photo → diagnostic", color: "#5290E0", action: () => goPage("scanner"), icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5290E0" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> },
          { label: "Devis", sub: "Vérifier les prix", color: "#E8873A", action: () => { goPage("outils"); setToolTab("devis"); }, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8873A" strokeWidth="1.8" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> },
          { label: "Matériaux", sub: "Calculer", color: "#52C37A", action: () => { goPage("outils"); setToolTab("mat"); }, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52C37A" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg> },
        ].map((a, i) => (
          <div key={i} className="liquid-glass" onClick={a.action} role="button" tabIndex={0} aria-label={a.label + " — " + a.sub} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); a.action(); } }} style={{ borderRadius: 14, padding: "14px 8px", cursor: "pointer", textAlign: "center", border: "0.5px solid " + a.color + "1A" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: a.color + "10", border: "0.5px solid " + a.color + "25", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{a.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{a.label}</div>
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", marginTop: 1 }}>{a.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Dernier projet ── */}
      {lastProject && (
        <div style={{ padding: "0 20px 12px" }}>
          <div onClick={() => goPage("projets")} role="button" tabIndex={0} aria-label="Voir le projet en cours" onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goPage("projets"); } }} className="liquid-glass" style={{ borderRadius: 14, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(139,92,246,0.1)", border: "0.5px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Projet en cours</div>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lastProject.nom || lastProject.type}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      )}

      {/* ── Astuce du jour ── */}
      <div style={{ padding: "0 20px 12px" }}>
        <div className="liquid-glass" style={{ borderRadius: 14, padding: "14px 16px", border: "0.5px solid rgba(201,168,76,0.12)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: "#C9A84C", letterSpacing: 1.5 }}>ASTUCE DU JOUR</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{tip.title}</div>
          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.5 }}>{tip.text}</div>
        </div>
      </div>

      {/* ── Météo chantier géolocalisée ── */}
      <div style={{ padding: "0 20px 12px" }}>
        {!geoContexte && !geoLoading && (
          <button onClick={chargerMeteo} className="liquid-glass" style={{ width: "100%", borderRadius: 14, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, border: "0.5px solid rgba(82,144,224,0.15)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5290E0" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Météo chantier</div>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)" }}>Prévisions 3 jours + alertes BTP</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.15)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto" }}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
        {geoLoading && (
          <div style={{ textAlign: "center", padding: 12, fontSize: 11, color: "rgba(240,237,230,0.35)" }}>Géolocalisation en cours...</div>
        )}
        {geoContexte && geoContexte.meteo && (() => {
          const jours = resumeMeteo(geoContexte.meteo);
          if (!jours) return null;
          return (
            <div className="liquid-glass" style={{ borderRadius: 14, padding: "14px 16px", border: "0.5px solid rgba(82,144,224,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5290E0" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2"/></svg>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#5290E0", letterSpacing: 1.5 }}>MÉTÉO CHANTIER</span>
                </div>
                <span style={{ fontSize: 9, color: "rgba(240,237,230,0.25)" }}>{geoContexte.ville}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {jours.map((j, i) => (
                  <div key={i} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 10, background: j.ok ? "rgba(82,195,122,0.06)" : "rgba(224,82,82,0.06)", border: "0.5px solid " + (j.ok ? "rgba(82,195,122,0.15)" : "rgba(224,82,82,0.15)") }}>
                    <div style={{ fontSize: 9, color: "rgba(240,237,230,0.4)", fontWeight: 600 }}>{j.date}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: j.ok ? "#52C37A" : "#E05252", fontFamily: "'Syne',sans-serif" }}>{j.tMax}°</div>
                    <div style={{ fontSize: 8, color: "rgba(240,237,230,0.3)" }}>{j.tMin}° min</div>
                    {j.pluie > 0 && <div style={{ fontSize: 8, color: "#5290E0", marginTop: 2 }}>💧 {j.pluie}mm</div>}
                    {j.vent > 40 && <div style={{ fontSize: 8, color: "#E8873A", marginTop: 1 }}>💨 {j.vent}km/h</div>}
                    <div style={{ fontSize: 7, marginTop: 3, color: j.ok ? "#52C37A" : "#E05252", fontWeight: 700 }}>{j.ok ? "✓ OK" : "⚠ Alerte"}</div>
                  </div>
                ))}
              </div>
              {jours.some(j => j.alertes.length > 0) && (
                <div style={{ marginTop: 8 }}>
                  {jours.filter(j => j.alertes.length > 0).slice(0, 2).map((j, i) => (
                    <div key={i} style={{ fontSize: 9, color: "#E8873A", padding: "2px 0" }}>⚠ {j.date} : {j.alertes[0]}</div>
                  ))}
                </div>
              )}
              {geoContexte.prixM2 && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid rgba(255,255,255,0.04)", fontSize: 10, color: "rgba(240,237,230,0.4)" }}>
                  Prix moyen : <strong style={{ color: "#C9A84C" }}>{geoContexte.prixM2.prixMoyenM2} €/m²</strong> ({geoContexte.prixM2.nbTransactions} ventes)
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Outils (liste compacte) ── */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "rgba(240,237,230,0.3)", marginBottom: 8 }}>Outils</div>
        {[
          { label: "Aides 2026", sub: "MaPrimeRénov' + CEE", color: "#52C37A", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52C37A" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, action: () => { goPage("outils"); setToolTab("primes"); } },
          { label: "Artisan RGE", sub: "Vérifier un artisan", color: "#5290E0", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5290E0" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>, action: () => { goPage("outils"); setToolTab("rge"); } },
          { label: "Certificat DTU", sub: "PDF de conformité", color: "#C9A84C", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>, action: () => goPage("cert") },
          { label: "Boutique", sub: "Matériaux partenaires", color: "#C9A84C", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, action: () => goPage("shop") },
        ].map((t, i) => (
          <div key={i} onClick={t.action} role="button" tabIndex={0} aria-label={t.label + " — " + t.sub} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t.action(); } }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", cursor: "pointer", borderBottom: i < 3 ? "0.5px solid rgba(255,255,255,0.04)" : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: t.color + "10", border: "0.5px solid " + t.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{t.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.label}</div>
              <div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)" }}>{t.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.15)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>

      {/* ── Urgence (compact, collapsed) ── */}
      <div style={{ padding: "0 20px 16px" }}>
        <div onClick={() => setShowUrgence(!showUrgence)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#E05252" }}>Urgence</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(224,82,82,0.4)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto", transform: showUrgence ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.25s" }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        {showUrgence && (
          <div style={{ display: "flex", gap: 8, animation: "fadeSlideUp 0.25s ease-out" }}>
            {[["GAZ","#E05252"],["EAU","#5290E0"],["ÉLECTRICITÉ","#E8873A"]].map(([label, color]) => (
              <button key={label} onClick={() => startUrgence(label)} aria-label={"Urgence " + label} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, background: color + "0A", border: "0.5px solid " + color + "33", cursor: "pointer", fontSize: 10, fontWeight: 800, color, letterSpacing: 1, textAlign: "center" }}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── CR modal ── */}
      {showCRJournalier && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowCRJournalier(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: "rgba(15,19,28,0.95)", border: "0.5px solid rgba(232,135,58,0.3)", borderRadius: 20, padding: "24px 20px", maxWidth: 400, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, color: "#E8873A", marginBottom: 14 }}>Compte-rendu de journée</div>
          <div style={{ fontSize: 12, color: "rgba(240,237,230,0.7)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{crJournalierResult || "Chargement..."}</div>
          <button onClick={() => setShowCRJournalier(false)} style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(240,237,230,0.5)", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Fermer</button>
        </div>
      </div>}
    </div>
  );
}
