import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import s from "../styles/index";

export default function NavBar() {
  const { page, goPage } = useApp();
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const NavIcon = ({ id, label, ariaLabel, children, needsOnline }) => (
    <div style={{ ...s.ni, opacity: needsOnline && !isOnline ? 0.3 : 1 }} onClick={() => goPage(id)} role="button" tabIndex={0} aria-label={ariaLabel || label} {...(page === id ? { "aria-current": "page" } : {})} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goPage(id); } }}>
      <div style={page === id ? { ...s.niwOn, animation: "navBounce 0.3s cubic-bezier(0.34,1.56,0.64,1)" } : s.niw}>{children}</div>
      <div style={page === id ? s.nlblOn : s.nlbl}>{label}</div>
    </div>
  );

  return (
    <>
      {/* Offline indicator */}
      {!isOnline && (
        <div style={{ position: "absolute", bottom: 58, left: 0, right: 0, background: "rgba(224,82,82,0.12)", borderTop: "0.5px solid rgba(224,82,82,0.3)", padding: "5px 16px", display: "flex", alignItems: "center", gap: 6, zIndex: 101 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E05252", flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: "#E05252", fontWeight: 600 }}>Hors ligne — certaines fonctions sont indisponibles</span>
        </div>
      )}
      <nav style={s.bnav} role="navigation" aria-label="Navigation principale">
        <NavIcon id="home" label="Accueil" ariaLabel="Accueil"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg></NavIcon>
        <NavIcon id="coach" label="32 IA" ariaLabel="Coach IA" needsOnline><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></NavIcon>
        <NavIcon id="scanner" label="Scanner" ariaLabel="Scanner photo" needsOnline><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg></NavIcon>
        <NavIcon id="outils" label="Outils" needsOnline><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg></NavIcon>
        <NavIcon id="projets" label="Projets" ariaLabel="Projets"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></NavIcon>
      </nav>
    </>
  );
}
