import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { PROFILS } from "../data/constants";
import s from "../styles/index";

export default function Header({ onSearchClick }) {
  const { IS_DEV, showKey, keyInput, setKeyInput, keyErr, activerIA, userType, setUserType, setMsgs, setHist, goPage, pdgUnlocked, setShowPinOverlay, setPinInput, setPinError } = useApp();

  // Profile dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside, true);
    return () => document.removeEventListener("click", handleClickOutside, true);
  }, [showProfileMenu]);

  // Easter egg: 5 rapid clicks on logo to show PIN overlay
  const [logoClicks, setLogoClicks] = useState(0);
  const lastClickTime = useRef(0);

  const handleLogoClick = useCallback(() => {
    if (pdgUnlocked) return; // Already unlocked, no need
    const now = Date.now();
    if (now - lastClickTime.current > 3000) {
      // Reset if more than 3 seconds since last click
      setLogoClicks(1);
    } else {
      setLogoClicks(prev => {
        const next = prev + 1;
        if (next >= 5) {
          setPinInput("");
          setPinError("");
          setShowPinOverlay(true);
          return 0;
        }
        return next;
      });
    }
    lastClickTime.current = now;
  }, [pdgUnlocked, setShowPinOverlay, setPinInput, setPinError]);

  return (
    <>
      {IS_DEV && showKey && (
        <div style={s.keyScreen}>
          <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#C9A84C,#7A6030)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, marginBottom: 6 }}>MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span></div>
          <div style={{ fontSize: 12, color: "rgba(240,237,230,0.5)", textAlign: "center", marginBottom: 28, lineHeight: 1.6 }}>Mode développement — clé Anthropic pour tester en local.</div>
          <div style={s.keyBox}>
            <div style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Clé API Anthropic</div>
            <input style={s.keyInp} type="password" placeholder="sk-ant-api03-..." value={keyInput} onChange={e => setKeyInput(e.target.value)} autoComplete="off" onKeyDown={e => e.key === "Enter" && activerIA()} />
            <button style={s.keyBtn} onClick={activerIA}>Activer en local</button>
            {keyErr && <div style={{ fontSize: 12, color: "#E05252", textAlign: "center", marginTop: 10 }}>{keyErr}</div>}
          </div>
          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.22)", textAlign: "center", marginTop: 16 }}>En production Vercel, la clé est sécurisée côté serveur</div>
        </div>
      )}

      <div style={s.hdr}>
        <div style={s.logo} onClick={handleLogoClick}>
          <div style={s.logoBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
          </div>
          MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div ref={profileMenuRef} style={{ position: "relative" }}>
            <button onClick={() => setShowProfileMenu(v => !v)} style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(15,19,28,0.8)", border: "0.5px solid rgba(201,168,76,0.15)", borderRadius: 20, padding: "4px 10px", cursor: "pointer", fontSize: 14 }}>
              <span>{PROFILS[userType]?.icon}</span>
              <span style={{ fontSize: 8, color: "rgba(240,237,230,0.4)" }}>{"\u25BC"}</span>
            </button>
            {showProfileMenu && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, background: "rgba(15,19,28,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "0.5px solid rgba(201,168,76,0.2)", borderRadius: 14, padding: 6, zIndex: 200, minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                {["Particulier", "Artisan Pro", "Architecte", "Investisseur"].map(p => (
                  <button key={p} onClick={() => { setUserType(p); localStorage.setItem("bl_user_type", p); setMsgs([{ role: "ai", text: PROFILS[p].icon + " Mode " + p + " activé. Je m'adapte à votre profil." }]); setHist([]); setShowProfileMenu(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: userType === p ? "rgba(201,168,76,0.12)" : "transparent", color: userType === p ? "#C9A84C" : "rgba(240,237,230,0.6)", transition: "all 0.15s" }}>
                    <span style={{ fontSize: 16 }}>{PROFILS[p].icon}</span>
                    <span>{p}</span>
                    {userType === p && <span style={{ marginLeft: "auto", fontSize: 10, color: "#C9A84C" }}>{"\u2713"}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onSearchClick} title="Rechercher" style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button onClick={() => goPage("settings")} title="Réglages" style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
          {pdgUnlocked && (
            <button onClick={() => goPage("dashboard")} title="Dashboard PDG" style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
