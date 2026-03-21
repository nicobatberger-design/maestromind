import { useRef, useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { IAS } from "../data/constants";

export default function PaywallOverlay() {
  const { showPaywall, setShowPaywall, msgCount } = useApp();

  // Swipe-down pour fermer l'overlay
  const touchStartY = useRef(null);
  const [dragY, setDragY] = useState(0);
  const onTouchStart = useCallback(e => { touchStartY.current = e.touches[0].clientY; }, []);
  const onTouchMove = useCallback(e => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  }, []);
  const onTouchEnd = useCallback(() => {
    if (dragY > 100) setShowPaywall(false);
    setDragY(0);
    touchStartY.current = null;
  }, [dragY, setShowPaywall]);

  if (!showPaywall) return null;

  const used = Math.min(msgCount, 5);
  const pct = (used / 5) * 100;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ position: "fixed", inset: 0, background: "rgba(6,8,13,0.94)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 9997, padding: "0 32px", transform: `translateY(${dragY}px)`, transition: dragY === 0 ? "transform 0.25s ease" : "none" }}>
      {/* Indicateur de glissement */}
      <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "8px auto 4px", position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }} />
      <div style={{ fontSize: 52, marginBottom: 16 }}>{"\u{1F513}"}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#C9A84C", marginBottom: 12, textAlign: "center" }}>Limite atteinte</div>

      {/* Compteur texte */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "#F0EDE6", marginBottom: 8, textAlign: "center" }}>
        {used}/5 messages gratuits utilisés
      </div>

      {/* Barre de progression */}
      <div style={{ width: "100%", maxWidth: 280, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", marginBottom: 24, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", transition: "width 0.4s ease" }} />
      </div>

      <div style={{ fontSize: 13, color: "rgba(240,237,230,0.55)", textAlign: "center", marginBottom: 6, lineHeight: 1.7, maxWidth: 280 }}>Passez Premium pour un accès illimité {"aux " + Object.keys(IAS).length + " IA expertes bâtiment."}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#C9A84C", textAlign: "center", marginBottom: 24 }}>Illimité + toutes les IA + exports PDF</div>

      <button onClick={async () => { try { const { checkoutPremium } = await import("../utils/stripe"); await checkoutPremium(); } catch { setShowPaywall(false); } }} style={{ width: "100%", maxWidth: 320, background: "linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border: "none", borderRadius: 14, padding: "15px", fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#06080D", cursor: "pointer", marginBottom: 6, boxShadow: "0 4px 28px rgba(201,168,76,0.4)" }}>Débloquer Premium</button>
      <div style={{ fontSize: 11, color: "rgba(240,237,230,0.4)", marginBottom: 14, textAlign: "center" }}>Offre de lancement — 4,99€/mois</div>

      <button onClick={() => setShowPaywall(false)} style={{ background: "transparent", border: "none", fontSize: 12, color: "rgba(240,237,230,0.3)", cursor: "pointer", padding: 8 }}>Continuer sans Premium</button>
    </div>
  );
}
