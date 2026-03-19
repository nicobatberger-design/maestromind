import { useApp } from "../context/AppContext";
import { PROFILS } from "../data/constants";
import s from "../styles/index";

export default function Header() {
  const { IS_DEV, showKey, keyInput, setKeyInput, keyErr, activerIA, userType, setUserType, setMsgs, setHist, goPage, theme, setTheme } = useApp();

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
        <div style={s.logo}>
          <div style={s.logoBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
          </div>
          MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", background: "rgba(15,19,28,0.8)", border: "0.5px solid rgba(201,168,76,0.15)", borderRadius: 20, padding: 2, gap: 2 }}>
            {["Particulier", "Artisan Pro", "Architecte", "Investisseur"].map(p => (
              <button key={p} onClick={() => { setUserType(p); localStorage.setItem("bl_user_type", p); setMsgs([{ role: "ai", text: PROFILS[p].icon + " Mode " + p + " activé. Je m'adapte à votre profil." }]); setHist([]); }} style={{ padding: "3px 8px", borderRadius: 18, fontSize: 8, fontWeight: 700, cursor: "pointer", border: "none", background: userType === p ? "linear-gradient(135deg,#EDD060,#C9A84C)" : "transparent", color: userType === p ? "#06080D" : "rgba(240,237,230,0.4)", transition: "all 0.2s", whiteSpace: "nowrap" }}>{PROFILS[p].icon}</button>
            ))}
          </div>
          <div style={s.badge}>LIVE</div>
          <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={theme === "dark" ? "Mode clair" : "Mode sombre"} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: 14 }}>
            {theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"}
          </button>
          <button onClick={() => goPage("dashboard")} title="Dashboard PDG" style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          </button>
        </div>
      </div>
    </>
  );
}
