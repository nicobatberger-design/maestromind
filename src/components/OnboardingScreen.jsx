import { useApp } from "../context/AppContext";
import s from "../styles/index";

export default function OnboardingScreen() {
  const { onboardingStep, setOnboardingStep, userType, setUserType, setOnboardingDone } = useApp();

  const steps = [
    { title: "Bienvenue sur", highlight: "MAESTROMIND", sub: "32 IA expertes du bâtiment, disponibles 24h/24.", icon: "\u{1F3D7}" },
    { title: "Votre profil ?", highlight: "", sub: "Personnalise vos conseils IA.", icon: "\u{1F477}", choices: ["Particulier", "Artisan Pro", "Architecte", "Investisseur"] },
    { title: "Vous êtes prêt !", highlight: "", sub: "Activez les notifications pour vos rappels chantier.", icon: "\u{1F514}" },
  ];
  const step = steps[onboardingStep];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 430, margin: "0 auto", background: "#06080D", color: "#F0EDE6", fontFamily: "'DM Sans',sans-serif", alignItems: "center", justifyContent: "center", padding: "0 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 56, marginBottom: 24 }}>{step.icon}</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, textAlign: "center", lineHeight: 1.2, marginBottom: 8 }}>{step.title} {step.highlight && <span style={{ color: "#C9A84C" }}>{step.highlight}</span>}</div>
        <div style={{ fontSize: 13, color: "rgba(240,237,230,0.65)", textAlign: "center", lineHeight: 1.7, marginBottom: 36 }}>{step.sub}</div>
        {step.choices && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", marginBottom: 24 }}>{step.choices.map(ch => <button key={ch} onClick={() => setUserType(ch)} style={{ padding: "14px 12px", minHeight: 44, borderRadius: 12, border: "0.5px solid " + (userType === ch ? "#C9A84C" : "rgba(255,255,255,0.08)"), background: userType === ch ? "rgba(201,168,76,0.12)" : "rgba(15,19,28,0.6)", color: userType === ch ? "#C9A84C" : "rgba(240,237,230,0.6)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{ch}</button>)}</div>}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>{steps.map((_, i) => <div key={i} style={{ width: i === onboardingStep ? 24 : 8, height: 8, borderRadius: 4, background: i === onboardingStep ? "#C9A84C" : "rgba(255,255,255,0.1)", transition: "all 0.3s" }} />)}</div>
        <button onClick={() => { if (onboardingStep < steps.length - 1) { setOnboardingStep(prev => prev + 1); } else { localStorage.setItem("bl_onboarded", "1"); localStorage.setItem("bl_user_type", userType); setOnboardingDone(true); } }} style={{ width: "100%", background: "linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border: "none", borderRadius: 14, padding: "15px", fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#06080D", cursor: "pointer", boxShadow: "0 4px 24px rgba(201,168,76,0.35)" }}>
          {onboardingStep < steps.length - 1 ? "Continuer \u2192" : "Commencer maintenant"}
        </button>
        {onboardingStep > 0 && <button onClick={() => setOnboardingStep(prev => prev - 1)} style={{ background: "transparent", border: "none", marginTop: 12, fontSize: 14, color: "rgba(240,237,230,0.3)", cursor: "pointer", padding: "8px 16px" }}>{"\u2190"} Retour</button>}
      </div>
    </>
  );
}
