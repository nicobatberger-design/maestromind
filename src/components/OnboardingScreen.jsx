import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";

const PROFILS_DATA = [
  { key: "Particulier", icon: "🏠", label: "Particulier", sub: "Bricoleur amateur ou propriétaire", desc: "Conseils simples et accessibles" },
  { key: "Artisan Pro", icon: "⚒️", label: "Artisan Pro", sub: "Professionnel du bâtiment", desc: "Normes DTU et outils techniques" },
  { key: "Architecte", icon: "📐", label: "Architecte", sub: "Maître d'œuvre ou concepteur", desc: "Conception et coordination" },
  { key: "Investisseur", icon: "💰", label: "Investisseur", sub: "Investissement immobilier", desc: "ROI et valorisation" },
];

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 40;
    const timer = setInterval(() => {
      frame++;
      setCount(Math.round((frame / total) * target));
      if (frame >= total) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

export default function OnboardingScreen() {
  const { onboardingStep, setOnboardingStep, userType, setUserType, setOnboardingDone } = useApp();
  const [fadeKey, setFadeKey] = useState(0);

  const goNext = () => {
    if (onboardingStep < steps.length - 1) {
      setFadeKey(k => k + 1);
      setOnboardingStep(prev => prev + 1);
    } else {
      localStorage.setItem("bl_onboarded", "1");
      localStorage.setItem("bl_user_type", userType);
      setOnboardingDone(true);
    }
  };

  const goBack = () => {
    if (onboardingStep > 0) {
      setFadeKey(k => k + 1);
      setOnboardingStep(prev => prev - 1);
    }
  };

  const steps = [
    // 1. Welcome
    () => (
      <div style={styles.stepContent}>
        <div style={styles.logoWrap}>
          <div style={styles.logoRing}>
            <div style={styles.logoBox}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#06080D" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            </div>
          </div>
        </div>
        <div className="gold-text" style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, textAlign: "center", lineHeight: 1.1, marginBottom: 8 }}>MAESTROMIND</div>
        <div style={{ fontSize: 14, color: "rgba(240,237,230,0.5)", textAlign: "center", lineHeight: 1.7, marginBottom: 36 }}>L'intelligence artificielle<br/>au service du bâtiment</div>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 8 }}>
          {[
            [40, "IA expertes"],
            [11, "Divisions"],
            ["∞", "Disponible"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: "#C9A84C" }}>
                {typeof n === "number" ? <AnimatedCounter target={n} /> : n}
              </div>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", letterSpacing: 0.5, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),

    // 2. Profil
    () => (
      <div style={styles.stepContent}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>👤</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>Votre profil</div>
        <div style={{ fontSize: 12, color: "rgba(240,237,230,0.5)", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>L'IA s'adapte à votre niveau et votre métier</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          {PROFILS_DATA.map(p => (
            <button key={p.key} onClick={() => setUserType(p.key)} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14,
              background: userType === p.key ? "rgba(201,168,76,0.1)" : "rgba(15,19,28,0.5)",
              border: userType === p.key ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer", transition: "all 0.25s", textAlign: "left",
              boxShadow: userType === p.key ? "0 0 20px rgba(201,168,76,0.08)" : "none",
              WebkitTapHighlightColor: "rgba(201,168,76,0.2)",
              touchAction: "manipulation", position: "relative", zIndex: 2,
            }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: userType === p.key ? "#C9A84C" : "#F0EDE6", fontFamily: "'Syne',sans-serif" }}>{p.label}</div>
                <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginTop: 1 }}>{p.sub}</div>
                <div style={{ fontSize: 9, color: "rgba(240,237,230,0.4)", marginTop: 2 }}>{p.desc}</div>
              </div>
              {userType === p.key && <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#EDD060,#C9A84C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06080D" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>}
            </button>
          ))}
        </div>
      </div>
    ),

    // 3. Features
    () => (
      <div style={styles.stepContent}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>Vos superpouvoirs</div>
        <div style={{ fontSize: 12, color: "rgba(240,237,230,0.5)", textAlign: "center", marginBottom: 24 }}>Tout ce dont vous avez besoin, dans votre poche</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
          {[
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5290E0" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, label: "Scanner photo", sub: "Diagnostic instantané", color: "#5290E0" },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#52C37A" strokeWidth="1.8" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>, label: "Commande vocale", sub: "Parlez, l'IA comprend", color: "#52C37A" },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E8873A" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>, label: "12 calculateurs", sub: "Béton, escalier, devis...", color: "#E8873A" },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>, label: "Certificats DTU", sub: "PDF partageables", color: "#C9A84C" },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, label: "Urgences", sub: "Gaz, eau, électricité", color: "#E05252" },
            { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: "Planning chantier", sub: "Organisez vos travaux", color: "#8B5CF6" },
          ].map((f, i) => (
            <div key={i} className="liquid-glass" style={{ borderRadius: 14, padding: "16px 12px", textAlign: "center", border: "0.5px solid " + f.color + "22", animation: "fadeSlideUp 0.4s cubic-bezier(0.4,0,0.2,1) both", animationDelay: (i * 0.08) + "s" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: f.color + "12", border: "0.5px solid " + f.color + "28", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{f.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.4)" }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>
    ),

    // 4. Ready
    () => (
      <div style={styles.stepContent}>
        <div style={{ fontSize: 56, marginBottom: 20, animation: "navBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>🚀</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, textAlign: "center", lineHeight: 1.2, marginBottom: 8 }}>Tout est prêt !</div>
        <div style={{ fontSize: 13, color: "rgba(240,237,230,0.5)", textAlign: "center", lineHeight: 1.7, marginBottom: 28 }}>
          Posez votre première question,<br/>scannez un problème,<br/>ou explorez les 40 IA.
        </div>
        <div className="liquid-glass" style={{ borderRadius: 14, padding: "14px 18px", width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["📸", "Photographiez un problème", "Diagnostic IA instantané"],
            ["💬", "Posez une question", "40 IA spécialisées répondent"],
            ["📋", "Collez un devis", "Vérification prix et anomalies"],
          ].map(([icon, title, sub], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 0", opacity: 0, animation: "fadeSlideUp 0.4s cubic-bezier(0.4,0,0.2,1) both", animationDelay: (0.2 + i * 0.15) + "s" }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
                <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  ];

  const currentStep = steps[onboardingStep];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={styles.container}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.15) 0%,rgba(201,168,76,0.03) 40%,transparent 65%)", pointerEvents: "none", animation: "ambientGlow 5s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "35%", right: -80, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle,rgba(82,144,224,0.06) 0%,transparent 65%)", pointerEvents: "none", animation: "orbFloat 9s ease-in-out infinite 1s" }} />
        <div style={{ position: "absolute", bottom: "15%", left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(82,195,122,0.05) 0%,transparent 65%)", pointerEvents: "none", animation: "orbFloat 11s ease-in-out infinite 2.5s" }} />

        {/* Step content with fade */}
        <div key={fadeKey} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", animation: "fadeSlideUp 0.35s cubic-bezier(0.4,0,0.2,1)" }}>
          {currentStep()}
        </div>

        {/* Bottom controls */}
        <div style={{ width: "100%", paddingBottom: 40 }}>
          {/* Dots */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                width: i === onboardingStep ? 28 : 8, height: 8, borderRadius: 4,
                background: i === onboardingStep ? "linear-gradient(135deg,#EDD060,#C9A84C)" : "rgba(255,255,255,0.08)",
                boxShadow: i === onboardingStep ? "0 0 12px rgba(201,168,76,0.3)" : "none",
                transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
              }} />
            ))}
          </div>

          {/* CTA */}
          <button className="gold-btn" onClick={goNext} style={{
            width: "100%", background: "linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border: "none",
            borderRadius: 16, padding: "17px", fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800,
            color: "#06080D", cursor: "pointer", letterSpacing: "0.5px",
            boxShadow: "0 4px 28px rgba(201,168,76,0.4), 0 0 60px rgba(201,168,76,0.08)",
          }}>
            {onboardingStep < steps.length - 1 ? "Continuer →" : "Commencer maintenant"}
          </button>

          {onboardingStep > 0 && (
            <button onClick={goBack} style={{ display: "block", width: "100%", background: "transparent", border: "none", marginTop: 12, fontSize: 13, color: "rgba(240,237,230,0.25)", cursor: "pointer", padding: "8px 16px", textAlign: "center" }}>← Retour</button>
          )}

          {onboardingStep === 0 && (
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "rgba(240,237,230,0.15)" }}>v1.0 — Gratuit et sans publicité</div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", height: "100vh", maxWidth: 430, margin: "0 auto", background: "#06080D", color: "#F0EDE6", fontFamily: "'DM Sans',sans-serif", alignItems: "center", padding: "0 28px", position: "relative", overflow: "hidden" },
  stepContent: { display: "flex", flexDirection: "column", alignItems: "center", width: "100%" },
  logoWrap: { marginBottom: 24, position: "relative" },
  logoRing: { width: 88, height: 88, borderRadius: 26, padding: 3, background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030,#C9A84C)", boxShadow: "0 6px 40px rgba(201,168,76,0.4), 0 0 80px rgba(201,168,76,0.12)", animation: "logoGlow 3s ease-in-out infinite" },
  logoBox: { width: "100%", height: "100%", borderRadius: 23, background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", display: "flex", alignItems: "center", justifyContent: "center" },
};
