import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("pwa_dismissed") === "1");

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const install = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
  };

  const dismiss = () => { setDismissed(true); sessionStorage.setItem("pwa_dismissed", "1"); };

  return (
    <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 400, background: "rgba(10,14,22,0.97)", backdropFilter: "blur(20px)", border: "0.5px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "14px 16px", zIndex: 9990, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#EDD060,#C9A84C)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06080D" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#F0EDE6", marginBottom: 2 }}>Installer MAESTROMIND</div>
        <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>Accès rapide depuis l'écran d'accueil</div>
      </div>
      <button onClick={install} style={{ padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", fontFamily: "'Syne',sans-serif", fontSize: 11, fontWeight: 800, color: "#06080D", cursor: "pointer", flexShrink: 0 }}>Installer</button>
      <button onClick={dismiss} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.3)", fontSize: 18, cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>{"\u00D7"}</button>
    </div>
  );
}
