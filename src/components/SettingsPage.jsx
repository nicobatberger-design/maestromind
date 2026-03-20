import { useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { IAS } from "../data/constants";
import s from "../styles/index";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

const FONT_SIZES = [
  { key: "small", label: "Petit", size: 12 },
  { key: "medium", label: "Normal", size: 14 },
  { key: "large", label: "Grand", size: 16 },
];

function SettingSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>{title}</div>
      <div className="liquid-glass" style={{ borderRadius: 16, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, sub, right, onClick, last, danger }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
      borderBottom: last ? "none" : "0.5px solid rgba(255,255,255,0.04)",
      cursor: onClick ? "pointer" : "default",
      transition: "background 0.15s",
    }}>
      {icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: danger ? "rgba(224,82,82,0.1)" : "rgba(201,168,76,0.08)", border: "0.5px solid " + (danger ? "rgba(224,82,82,0.2)" : "rgba(201,168,76,0.15)"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: danger ? "#E05252" : "#F0EDE6" }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.35)", marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={(e) => { e.stopPropagation(); onChange(!value); }} style={{
      width: 44, height: 24, borderRadius: 12, padding: 2, cursor: "pointer", flexShrink: 0,
      background: value ? "linear-gradient(135deg,#C9A84C,#EDD060)" : "rgba(255,255,255,0.08)",
      border: "0.5px solid " + (value ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.1)"),
      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: value ? "#06080D" : "rgba(240,237,230,0.5)",
        transform: value ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

function PillSelector({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map(o => (
        <button key={o.key || o} onClick={() => onChange(o.key || o)} style={{
          padding: "5px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer",
          border: (o.key || o) === value ? "0.5px solid #C9A84C" : "0.5px solid rgba(255,255,255,0.06)",
          background: (o.key || o) === value ? "rgba(201,168,76,0.15)" : "transparent",
          color: (o.key || o) === value ? "#C9A84C" : "rgba(240,237,230,0.4)",
          transition: "all 0.2s",
        }}>{o.flag ? o.flag + " " : ""}{o.label || o}</button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const {
    page, goPage, theme, setTheme, modeChantier, setModeChantier, autoVoice, setAutoVoice,
    userType, setUserType, profilNom, setProfilNom, profilLogement, setProfilLogement,
    profilRegion, setProfilRegion, profilNiveau, setProfilNiveau,
    user, logout, isSupabaseConfigured, clearAllHistory,
  } = useApp();

  const [language, setLanguage] = useState(() => localStorage.getItem("mm_language") || "fr");
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("mm_fontsize") || "medium");
  const [notifEnabled, setNotifEnabled] = useState(() => typeof Notification !== "undefined" && Notification.permission === "granted");
  const [haptic, setHaptic] = useState(() => localStorage.getItem("mm_haptic") !== "0");
  const [animations, setAnimations] = useState(() => localStorage.getItem("mm_animations") !== "0");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const saveAndSet = useCallback((key, value, setter) => {
    localStorage.setItem(key, value);
    setter(value);
  }, []);

  const toggleNotif = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      setNotifEnabled(false);
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifEnabled(perm === "granted");
  }, []);

  const handleFontSize = useCallback((size) => {
    localStorage.setItem("mm_fontsize", size);
    setFontSize(size);
    const root = document.documentElement;
    const sizeMap = { small: "12px", medium: "14px", large: "16px" };
    root.style.setProperty("--base-font-size", sizeMap[size] || "14px");
  }, []);

  if (page !== "settings") return null;

  return (
    <div style={{ ...s.page, ...s.pageActive }}>
      <div style={{ padding: "16px 16px 100px" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Réglages</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.4)", marginBottom: 20 }}>Personnalisez votre expérience</div>

        {/* ── Compte ── */}
        <SettingSection title="Compte">
          <SettingRow
            icon={<div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#EDD060,#C9A84C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#06080D" }}>{user ? (user.user_metadata?.nom?.[0] || "U") : profilNom?.[0]?.toUpperCase() || "👤"}</div>}
            label={user ? (user.user_metadata?.nom || "Utilisateur") : (profilNom || "Mode invité")}
            sub={user ? user.email : "Appuyez pour modifier votre profil"}
            right={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>}
            onClick={() => goPage("auth")}
            last
          />
        </SettingSection>

        {/* ── Apparence ── */}
        <SettingSection title="Apparence">
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>}
            label="Thème"
            sub={theme === "dark" ? "Sombre" : "Clair"}
            right={<PillSelector options={[{ key: "dark", label: "Sombre" }, { key: "light", label: "Clair" }]} value={theme} onChange={(v) => { setTheme(v); localStorage.setItem("mm_theme", v); }} />}
          />
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>}
            label="Taille du texte"
            sub={FONT_SIZES.find(f => f.key === fontSize)?.label}
            right={<PillSelector options={FONT_SIZES} value={fontSize} onChange={handleFontSize} />}
          />
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
            label="Animations"
            sub="Transitions et effets visuels"
            right={<Toggle value={animations} onChange={(v) => saveAndSet("mm_animations", v ? "1" : "0", setAnimations)} />}
            last
          />
        </SettingSection>

        {/* ── Langue ── */}
        <SettingSection title="Langue">
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
            label="Langue de l'interface"
            sub={LANGUAGES.find(l => l.code === language)?.flag + " " + LANGUAGES.find(l => l.code === language)?.label}
            right={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>}
            onClick={() => setShowLangPicker(!showLangPicker)}
            last
          />
          {showLangPicker && (
            <div style={{ padding: "0 16px 12px" }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => { saveAndSet("mm_language", l.code, setLanguage); setShowLangPicker(false); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, marginBottom: 2,
                  background: language === l.code ? "rgba(201,168,76,0.1)" : "transparent",
                  border: language === l.code ? "0.5px solid rgba(201,168,76,0.3)" : "0.5px solid transparent",
                  cursor: "pointer", color: language === l.code ? "#C9A84C" : "rgba(240,237,230,0.6)", fontSize: 12, fontWeight: 500,
                }}>
                  <span style={{ fontSize: 18 }}>{l.flag}</span>
                  <span>{l.label}</span>
                  {language === l.code && <span style={{ marginLeft: "auto", color: "#C9A84C" }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </SettingSection>

        {/* ── Accessibilité ── */}
        <SettingSection title="Accessibilité">
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M2 18v3h20v-3"/><path d="M4 18v-3.7a8 8 0 0 1 4.5-7.2L10 6h4l1.5 1.1A8 8 0 0 1 20 14.3V18"/></svg>}
            label="Mode Chantier"
            sub="Gros boutons pour gants et soleil"
            right={<Toggle value={modeChantier} onChange={(v) => { setModeChantier(v); localStorage.setItem("mm_mode_chantier", v ? "1" : "0"); }} />}
          />
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>}
            label="Lecture vocale auto"
            sub="Lire les réponses IA à voix haute"
            right={<Toggle value={autoVoice} onChange={(v) => { setAutoVoice(v); localStorage.setItem("mm_auto_voice", v ? "1" : "0"); }} />}
          />
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
            label="Notifications"
            sub={notifEnabled ? "Activées — rappels chantier" : "Désactivées"}
            right={<Toggle value={notifEnabled} onChange={toggleNotif} />}
            last
          />
        </SettingSection>

        {/* ── Profil ── */}
        <SettingSection title="Profil IA">
          <div style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginBottom: 8 }}>Ces informations personnalisent les conseils des 33 IA</div>
            <input type="text" placeholder="Votre nom" value={profilNom} onChange={e => setProfilNom(e.target.value)} style={{ ...s.inp, marginBottom: 8 }} />
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", marginBottom: 4 }}>TYPE DE PROFIL</div>
            <PillSelector options={["Particulier", "Artisan Pro", "Architecte", "Investisseur"]} value={userType} onChange={(v) => { setUserType(v); localStorage.setItem("bl_user_type", v); }} />
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", marginTop: 10, marginBottom: 4 }}>LOGEMENT</div>
            <PillSelector options={["Maison", "Appartement", "Immeuble", "Local pro"]} value={profilLogement} onChange={setProfilLogement} />
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", marginTop: 10, marginBottom: 4 }}>NIVEAU BRICOLAGE</div>
            <PillSelector options={["Débutant", "Intermédiaire", "Expert"]} value={profilNiveau} onChange={setProfilNiveau} />
            <input type="text" placeholder="Région (ex: Île-de-France)" value={profilRegion} onChange={e => setProfilRegion(e.target.value)} style={{ ...s.inp, marginTop: 10 }} />
          </div>
        </SettingSection>

        {/* ── Données ── */}
        <SettingSection title="Données & Confidentialité">
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>}
            label="Effacer l'historique"
            sub={"Conversations des " + Object.keys(IAS).length + " IA"}
            right={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>}
            onClick={() => { if (window.confirm("Effacer tout l'historique de conversations ?")) clearAllHistory(); }}
          />
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
            label="Politique de confidentialité"
            sub="RGPD & conditions d'utilisation"
            right={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>}
            onClick={() => window.open("https://maestromind.vercel.app/privacy", "_blank")}
            last
          />
        </SettingSection>

        {/* ── À propos ── */}
        <SettingSection title="À propos">
          <SettingRow label="Version" right={<span style={{ fontSize: 12, color: "rgba(240,237,230,0.35)", fontFamily: "'DM Sans',monospace" }}>1.0.0</span>} />
          <SettingRow label="33 IA spécialisées" right={<span style={{ fontSize: 12, color: "#C9A84C", fontWeight: 700 }}>11 divisions</span>} />
          <SettingRow label="Plateforme" right={<span style={{ fontSize: 12, color: "rgba(240,237,230,0.35)" }}>React 19 + Vite 8</span>} last />
        </SettingSection>

        {/* ── Déconnexion ── */}
        {user && (
          <button onClick={logout} style={{
            width: "100%", padding: 14, borderRadius: 14, fontSize: 13, fontWeight: 700,
            background: "rgba(224,82,82,0.06)", border: "0.5px solid rgba(224,82,82,0.25)",
            color: "#E05252", cursor: "pointer", fontFamily: "'Syne',sans-serif",
          }}>Se déconnecter</button>
        )}

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "rgba(240,237,230,0.15)" }}>
          MAESTROMIND v1.0.0 — IA Bâtiment
        </div>
      </div>
    </div>
  );
}
