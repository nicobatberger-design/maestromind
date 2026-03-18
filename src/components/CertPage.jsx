import { useApp } from "../context/AppContext";
import s from "../styles/index";

export default function CertPage() {
  const {
    page,
    certProjet, setCertProjet, certNorme, setCertNorme, certSurface, setCertSurface, certProp, setCertProp, certArtisan, setCertArtisan,
    genererPDF,
  } = useApp();

  return (
    <div style={{ ...s.page, ...(page === "cert" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Certificat</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 14 }}>Validation conformité IA — Normes DTU</div>
        <div style={s.card}>
          <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Données du projet</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Projet</div><input style={s.inp} value={certProjet} onChange={e => setCertProjet(e.target.value)} placeholder="Ex: Cloison BA13" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Surface m²</div><input style={s.inp} type="number" value={certSurface} onChange={e => setCertSurface(e.target.value)} placeholder="10" /></div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Norme DTU</div>
            <select style={s.inp} value={certNorme} onChange={e => setCertNorme(e.target.value)}>
              <option>DTU 25.41 — Cloisons plâtre</option><option>DTU 52.1 — Carrelage</option><option>DTU 45.1 — Isolation thermique</option><option>DTU 60.1 — Plomberie sanitaire</option><option>DTU 70.1 — Électricité NFC 15-100</option><option>DTU 31.2 — Charpente bois</option><option>DTU 40.21 — Couverture tuiles</option><option>DTU 20.1 — Maçonnerie</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Maître d'ouvrage</div><input style={s.inp} value={certProp} onChange={e => setCertProp(e.target.value)} placeholder="Nom propriétaire" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Artisan / Entreprise</div><input style={s.inp} value={certArtisan} onChange={e => setCertArtisan(e.target.value)} placeholder="Nom artisan" /></div>
          </div>
        </div>
        <div style={s.certCard}>
          <div style={s.certSeal}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg></div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#C9A84C", marginBottom: 3 }}>CERTIFICAT DE CONFORMITÉ</div>
          <div style={{ fontSize: 9, color: "rgba(240,237,230,0.4)", marginBottom: 14 }}>Délivré par MAESTROMIND · Plateforme IA Bâtiment</div>
          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.55)", lineHeight: 2.2, borderTop: "0.5px solid rgba(201,168,76,0.15)", paddingTop: 12, textAlign: "left" }}>
            <div>Projet : <strong style={{ color: "#F0EDE6" }}>{certProjet || "—"}</strong></div>
            <div>Norme : <strong style={{ color: "#F0EDE6" }}>{certNorme.split("—")[0].trim()}</strong></div>
            <div>Surface : <strong style={{ color: "#F0EDE6" }}>{certSurface || "—"} m²</strong></div>
            {certProp && <div>Maître d'ouvrage : <strong style={{ color: "#F0EDE6" }}>{certProp}</strong></div>}
            {certArtisan && <div>Artisan : <strong style={{ color: "#F0EDE6" }}>{certArtisan}</strong></div>}
            <div>Date : <strong style={{ color: "#F0EDE6" }}>{new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</strong></div>
            <div>Statut : <strong style={{ color: "#52C37A" }}>{"\u2713"} CONFORME</strong></div>
          </div>
        </div>
        <button style={s.dlBtn} onClick={genererPDF}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Télécharger le certificat PDF
        </button>
      </div>
    </div>
  );
}
