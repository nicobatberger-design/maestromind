import { useState } from "react";
import { useApp } from "../context/AppContext";
import { resetPassword } from "../utils/supabase";
import s from "../styles/index";

export default function AuthPage() {
  const { page, goPage, user, login, register, logout, authError, setAuthError, isSupabaseConfigured, profilNom, setProfilNom, profilLogement, setProfilLogement, profilRegion, setProfilRegion, profilNiveau, setProfilNiveau, userType, setUserType, clearAllHistory } = useApp();
  const [mode, setMode] = useState("login"); // login | register | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (page !== "auth") return null;

  // Page profil (connecté OU mode invité sans Supabase)
  if (user || !isSupabaseConfigured) {
    const profilSection = (
      <div style={{ ...s.page, ...s.pageActive }}>
        <div style={s.wrap}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, marginBottom: 4, paddingTop: 12 }}>
            Mon profil
          </div>
          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.4)", marginBottom: 20 }}>
            {user ? user.email : "Mode invité"} — Ces infos personnalisent les conseils IA
          </div>

          <div style={s.card}>
            <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Informations</div>
            <input type="text" placeholder="Votre nom (optionnel)" value={profilNom} onChange={e => setProfilNom(e.target.value)} style={{ ...s.inp, marginBottom: 8 }} />
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginBottom: 4, marginTop: 4 }}>Type de logement</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {["Maison", "Appartement", "Immeuble", "Local pro"].map(t => (
                <button key={t} onClick={() => setProfilLogement(t)} style={{ padding: "7px 12px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", border: profilLogement === t ? "0.5px solid #C9A84C" : "0.5px solid rgba(255,255,255,0.08)", background: profilLogement === t ? "rgba(201,168,76,0.12)" : "transparent", color: profilLogement === t ? "#C9A84C" : "rgba(240,237,230,0.5)" }}>{t}</button>
              ))}
            </div>
            <input type="text" placeholder="Région (ex: Île-de-France)" value={profilRegion} onChange={e => setProfilRegion(e.target.value)} style={{ ...s.inp, marginBottom: 8 }} />
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)", marginBottom: 4, marginTop: 4 }}>Niveau bricolage</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              {["Débutant", "Intermédiaire", "Expert"].map(n => (
                <button key={n} onClick={() => setProfilNiveau(n)} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, fontSize: 10, fontWeight: 600, cursor: "pointer", border: profilNiveau === n ? "0.5px solid #C9A84C" : "0.5px solid rgba(255,255,255,0.08)", background: profilNiveau === n ? "rgba(201,168,76,0.12)" : "transparent", color: profilNiveau === n ? "#C9A84C" : "rgba(240,237,230,0.5)" }}>{n}</button>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <div style={{ fontSize: 10, color: "#C9A84C", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Type de profil</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {["Particulier", "Artisan Pro", "Architecte", "Investisseur"].map(p => (
                <button key={p} onClick={() => { setUserType(p); localStorage.setItem("bl_user_type", p); }} style={{ padding: "10px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", border: userType === p ? "0.5px solid #C9A84C" : "0.5px solid rgba(255,255,255,0.08)", background: userType === p ? "rgba(201,168,76,0.12)" : "transparent", color: userType === p ? "#C9A84C" : "rgba(240,237,230,0.5)" }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <div style={{ fontSize: 10, color: "#E05252", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Données</div>
            <button onClick={() => { if (window.confirm("Effacer tout l'historique de conversations ?")) clearAllHistory(); }} style={{ width: "100%", padding: 10, borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "0.5px solid rgba(224,82,82,0.25)", background: "rgba(224,82,82,0.06)", color: "#E05252", marginBottom: 6 }}>Effacer tout l'historique</button>
            {user && <button onClick={logout} style={{ ...authStyles.logoutBtn, marginTop: 6 }}>Se déconnecter</button>}
          </div>

          <button onClick={() => goPage("home")} style={{ ...authStyles.skipBtn, marginTop: 8, width: "100%", textAlign: "center" }}>Retour à l'accueil</button>
        </div>
      </div>
    );
    return profilSection;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || (mode !== "reset" && !password.trim())) return;
    setLoading(true);
    setAuthError("");
    try {
      if (mode === "login") {
        await login(email, password);
        goPage("home");
      } else if (mode === "register") {
        await register(email, password, nom);
        goPage("home");
      } else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch {} finally { setLoading(false); }
  };

  return (
    <div style={{ ...s.page, ...s.pageActive }}>
      <div style={s.wrap}>
        <div style={authStyles.container}>
          <div style={authStyles.icon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
            MAESTRO<span style={{ color: "#C9A84C" }}>MIND</span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 24 }}>
            {mode === "login" ? "Connectez-vous à votre compte" : mode === "register" ? "Créez votre compte gratuit" : "Réinitialisez votre mot de passe"}
          </div>

          {resetSent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#52C37A", marginBottom: 16 }}>Un email de réinitialisation a été envoyé à {email}</div>
              <button onClick={() => { setMode("login"); setResetSent(false); }} style={authStyles.skipBtn}>Retour à la connexion</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              {mode === "register" && (
                <input type="text" placeholder="Votre nom" value={nom} onChange={e => setNom(e.target.value)} style={{ ...s.inp, marginBottom: 10 }} />
              )}
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ ...s.inp, marginBottom: 10 }} autoComplete="email" />
              {mode !== "reset" && (
                <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ ...s.inp, marginBottom: 6 }} autoComplete={mode === "register" ? "new-password" : "current-password"} />
              )}
              {mode === "login" && (
                <div style={{ textAlign: "right", marginBottom: 14 }}>
                  <button type="button" onClick={() => { setMode("reset"); setAuthError(""); }} style={authStyles.link}>Mot de passe oublié ?</button>
                </div>
              )}
              {authError && <div style={{ ...s.errBox, marginBottom: 10 }}>{authError}</div>}
              <button type="submit" disabled={loading} style={{ ...authStyles.goldBtn, opacity: loading ? 0.6 : 1 }}>
                {loading ? "..." : mode === "login" ? "Se connecter" : mode === "register" ? "Créer mon compte" : "Envoyer le lien"}
              </button>
            </form>
          )}

          {!resetSent && (
            <div style={{ marginTop: 16, fontSize: 11, color: "rgba(240,237,230,0.5)" }}>
              {mode === "login" ? (
                <>Pas encore de compte ? <button type="button" onClick={() => { setMode("register"); setAuthError(""); }} style={authStyles.link}>Créer un compte</button></>
              ) : mode === "register" ? (
                <>Déjà un compte ? <button type="button" onClick={() => { setMode("login"); setAuthError(""); }} style={authStyles.link}>Se connecter</button></>
              ) : (
                <button type="button" onClick={() => { setMode("login"); setAuthError(""); }} style={authStyles.link}>Retour à la connexion</button>
              )}
            </div>
          )}

          <button onClick={() => goPage("home")} style={{ ...authStyles.skipBtn, marginTop: 20 }}>
            Continuer sans compte
          </button>
        </div>
      </div>
    </div>
  );
}

const authStyles = {
  container: { display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40 },
  icon: { width: 64, height: 64, background: "linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))", border: "0.5px solid rgba(201,168,76,0.3)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#06080D", marginBottom: 12 },
  goldBtn: { width: "100%", background: "linear-gradient(135deg,#EDD060,#C9A84C,#8A6820)", border: "none", borderRadius: 14, padding: 13, fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#06080D", cursor: "pointer", boxShadow: "0 4px 24px rgba(201,168,76,0.32)" },
  logoutBtn: { width: "100%", background: "rgba(224,82,82,0.08)", border: "0.5px solid rgba(224,82,82,0.35)", borderRadius: 14, padding: 13, fontSize: 13, fontWeight: 700, color: "#E05252", cursor: "pointer" },
  skipBtn: { background: "none", border: "none", color: "rgba(240,237,230,0.4)", fontSize: 11, cursor: "pointer", padding: "6px 0" },
  link: { background: "none", border: "none", color: "#C9A84C", fontSize: 11, cursor: "pointer", padding: 0, textDecoration: "underline" },
};
