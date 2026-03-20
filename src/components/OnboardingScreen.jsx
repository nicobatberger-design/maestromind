import { useApp } from "../context/AppContext";
import s from "../styles/index";

export default function OnboardingScreen() {
  const { onboardingStep, setOnboardingStep, userType, setUserType, setOnboardingDone } = useApp();

  const logoElement = (
    <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "0 4px 32px rgba(201,168,76,0.4)" }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
    </div>
  );
  const iaElement = (
    <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.05))", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, border: "1px solid rgba(201,168,76,0.3)" }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    </div>
  );

  const steps = [
    {
      title: "Bienvenue sur", highlight: "MAESTROMIND",
      sub: "33 IA expertes du bâtiment, disponibles 24h/24.",
      icon: null, iconElement: logoElement
    },
    {
      title: "Votre profil ?", highlight: "",
      sub: "Chaque profil adapte l'interface et les conseils IA à votre métier.",
      icon: "\u{1F477}",
      choices: ["Particulier", "Artisan Pro", "Architecte", "Investisseur"]
    },
    {
      title: "33 IA spécialisées", highlight: "",
      sub: "Diagnostic, normes DTU, prix, matériaux, sécurité, DPE... Chaque IA est experte dans son domaine.",
      icon: null, iconElement: iaElement,
      features: ["\u{1F50D} Scanner photo \u2192 diagnostic instantané", "\u{1F399} Parlez \u2192 l'IA comprend votre question", "\u{1F4D0} Calculateurs béton, escalier, tuyauterie", "\u{1F4CB} Checklist sécurité par métier"]
    },
    {
      title: "Mode Chantier", highlight: "",
      sub: "Activez le casque dans le header pour des gros boutons adaptés aux gants et au soleil.",
      icon: "\u{1F9BA}"
    },
    {
      title: "C'est parti !", highlight: "",
      sub: "Posez votre première question ou photographiez un problème.",
      icon: "\u{1F680}"
    },
  ];
  const step = steps[onboardingStep];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 430, margin: "0 auto", background: "#06080D", color: "#F0EDE6", fontFamily: "'DM Sans',sans-serif", alignItems: "center", justifyContent: "flex-start", paddingTop: "15vh", padding: "15vh 32px 0 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%)", pointerEvents: "none" }} />
        {step.iconElement ? step.iconElement : <div style={{ fontSize: 56, marginBottom: 24 }}>{step.icon}</div>}
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, textAlign: "center", lineHeight: 1.2, marginBottom: 8 }}>{step.title} {step.highlight && <span style={{ color: "#C9A84C" }}>{step.highlight}</span>}</div>
        <div style={{ fontSize: 13, color: "rgba(240,237,230,0.65)", textAlign: "center", lineHeight: 1.7, marginBottom: step.features ? 16 : 36 }}>{step.sub}</div>
        {step.features && (
          <div style={{ background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.15)", borderRadius: 14, padding: "12px 16px", width: "100%", marginBottom: 36, display: "flex", flexDirection: "column", gap: 8 }}>
            {step.features.map((feat, i) => (
              <div key={i} style={{ fontSize: 12, color: "rgba(240,237,230,0.6)", lineHeight: 1.5 }}>{feat}</div>
            ))}
          </div>
        )}
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
