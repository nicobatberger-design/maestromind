import { useApp } from "../context/AppContext";
import { DIVISIONS, PROFILS } from "../data/constants";
import s from "../styles/index";

export default function HomePage() {
  const { page, goPage, switchDiv, userType, startUrgence, setToolTab } = useApp();

  return (
    <div style={{ ...s.page, ...(page === "home" ? s.pageActive : {}) }}>
      <div style={s.hero}>
        <div style={{ color: "rgba(240,237,230,0.5)", fontSize: 12, marginBottom: 4 }}>{PROFILS[userType]?.icon} Bonjour, {userType}</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, lineHeight: 1.15, marginBottom: 5 }}>MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span></div>
        <div style={{ color: "rgba(240,237,230,0.5)", fontSize: 11, marginBottom: 18 }}>32 IA spécialisées — Normes DTU — 11 divisions</div>
        <button style={s.cta} onClick={() => goPage("coach")}>
          <span>Quel est votre projet ?</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </button>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#E05252", marginBottom: 8 }}>{"\u{1F6A8}"} Urgence</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
            {[["\u{1F534}", "GAZ", "rgba(224,82,82,0.12)", "rgba(224,82,82,0.5)", "#E05252"], ["\u{1F535}", "EAU", "rgba(82,144,224,0.12)", "rgba(82,144,224,0.5)", "#5290E0"], ["\u26A1", "ÉLECTRICITÉ", "rgba(232,135,58,0.12)", "rgba(232,135,58,0.5)", "#E8873A"]].map(([icon, label, bg, border, color]) => (
              <button key={label} onClick={() => startUrgence(label)} style={{ background: bg, border: "0.5px solid " + border, borderRadius: 12, padding: "12px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 1 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={s.stats3}>
        {[["32", "IA actives"], ["11", "Divisions"], ["3", "Magasins"]].map(([v, l]) => (
          <div key={l} style={s.sc}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: "#C9A84C" }}>{v}</div>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={s.secLbl}>Outils rapides</div>
      <div style={s.featGrid}>
        {[
          { label: "Vérifier un devis", sub: "Prix justes ?", color: "#E8873A", icon: "\u{1F4CB}", action: () => { goPage("outils"); setToolTab("devis"); } },
          { label: "Calculer matériaux", sub: "Quantités exactes", color: "#52C37A", icon: "\u{1F4D0}", action: () => { goPage("outils"); setToolTab("mat"); } },
          { label: "Aides 2025", sub: "MaPrimeRénov' CEE", color: "#52C37A", icon: "\u{1F4B0}", action: () => { goPage("outils"); setToolTab("primes"); } },
          { label: "Vérifier artisan", sub: "RGE & légitimité", color: "#5290E0", icon: "\u{1F6E1}\uFE0F", action: () => { goPage("outils"); setToolTab("rge"); } },
          { label: "Boutique", sub: "Matériaux partenaires", color: "#C9A84C", icon: "\u{1F6D2}", action: () => { goPage("shop"); } },
          { label: "Certificat DTU", sub: "Validation conformité", color: "#C9A84C", icon: "\u{1F3C5}", action: () => { goPage("cert"); } },
        ].map((t, i) => (
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
