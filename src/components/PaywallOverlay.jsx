import { useApp } from "../context/AppContext";

export default function PaywallOverlay() {
  const { showPaywall, setShowPaywall } = useApp();

  if (!showPaywall) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,13,0.94)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 9997, padding: "0 32px" }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>{"\u{1F513}"}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#C9A84C", marginBottom: 8, textAlign: "center" }}>5 messages utilisés</div>
      <div style={{ fontSize: 13, color: "rgba(240,237,230,0.55)", textAlign: "center", marginBottom: 28, lineHeight: 1.7, maxWidth: 280 }}>Passez Premium pour un accès illimité aux 32 IA expertes bâtiment.</div>
      <button onClick={async () => { try { const { checkoutPremium } = await import("../utils/stripe"); await checkoutPremium(); } catch { setShowPaywall(false); } }} style={{ width: "100%", maxWidth: 320, background: "linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border: "none", borderRadius: 14, padding: "15px", fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "#06080D", cursor: "pointer", marginBottom: 12, boxShadow: "0 4px 28px rgba(201,168,76,0.4)" }}>Premium — 4,99€/mois</button>
      <button onClick={() => setShowPaywall(false)} style={{ background: "transparent", border: "none", fontSize: 12, color: "rgba(240,237,230,0.3)", cursor: "pointer", padding: 8 }}>Continuer sans Premium</button>
    </div>
  );
}
