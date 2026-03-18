import { useApp } from "../context/AppContext";

export default function RgpdBanner() {
  const { rgpdOk, setRgpdOk } = useApp();

  if (rgpdOk) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(10,14,22,0.97)", backdropFilter: "blur(20px)", borderTop: "0.5px solid rgba(201,168,76,0.2)", padding: "14px 16px", zIndex: 9999 }}>
      <div style={{ fontSize: 11, color: "rgba(240,237,230,0.6)", marginBottom: 10, lineHeight: 1.6 }}>MAESTROMIND utilise des cookies essentiels. En continuant, vous acceptez notre <span style={{ color: "#C9A84C" }}>politique de confidentialité</span>.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => { localStorage.setItem("rgpd_accepted", "1"); setRgpdOk(true); }} style={{ flex: 1, background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", borderRadius: 10, padding: "10px", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#06080D", cursor: "pointer" }}>Accepter</button>
        <button onClick={() => { localStorage.setItem("rgpd_accepted", "1"); setRgpdOk(true); }} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", fontSize: 12, color: "rgba(240,237,230,0.5)", cursor: "pointer" }}>Essentiels</button>
      </div>
    </div>
  );
}
