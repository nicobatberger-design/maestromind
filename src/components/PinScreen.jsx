import { useApp } from "../context/AppContext";
import s from "../styles/index";

export default function PinScreen({ overlay }) {
  const { pinInput, pinError, handlePin, handlePinDel, setShowPinOverlay } = useApp();

  const containerStyle = overlay
    ? { position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto", background: "rgba(6,8,13,0.95)", color: "#F0EDE6", fontFamily: "'DM Sans',sans-serif", alignItems: "center", justifyContent: "center", padding: "0 32px", overflow: "hidden", backdropFilter: "blur(12px)" }
    : { display: "flex", flexDirection: "column", height: "100vh", maxWidth: 430, margin: "0 auto", background: "#06080D", color: "#F0EDE6", fontFamily: "'DM Sans',sans-serif", alignItems: "center", justifyContent: "center", padding: "0 32px", position: "relative", overflow: "hidden" };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <div style={containerStyle}>
        {overlay && (
          <button onClick={() => setShowPinOverlay(false)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(240,237,230,0.08)", border: "0.5px solid rgba(240,237,230,0.15)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(240,237,230,0.5)", fontSize: 18, zIndex: 1001 }}>
            {"\u2715"}
          </button>
        )}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.1) 0%,transparent 68%)", pointerEvents: "none" }} />
        <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 32px rgba(201,168,76,0.4), inset 0 1px 0 rgba(255,255,255,0.25)" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        </div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span></div>
        <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 8 }}>Interface PDG</div>
        <div style={{ fontSize: 12, color: "rgba(240,237,230,0.4)", marginBottom: 36, textAlign: "center", lineHeight: 1.6 }}>Entrez votre code confidentiel à 6 chiffres</div>
        <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} style={i < pinInput.length ? s.pinDotFill : s.pinDot} />
          ))}
        </div>
        <div style={{ height: 24, display: "flex", alignItems: "center", marginBottom: 28 }}>
          {pinError && <div style={{ fontSize: 12, color: "#E05252", textAlign: "center" }}>{pinError}</div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,72px)", gap: 14 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
            <button key={d} className="bl-pin" style={s.pinKey} onClick={() => handlePin(String(d))}>{d}</button>
          ))}
          <div style={{ width: 72, height: 72 }} />
          <button className="bl-pin" style={s.pinKey} onClick={() => handlePin("0")}>0</button>
          <button className="bl-pin" style={{ ...s.pinKey }} onClick={handlePinDel}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" /></svg>
          </button>
        </div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.18)", marginTop: 44 }}>Accès réservé — PDG uniquement</div>
      </div>
    </>
  );
}
