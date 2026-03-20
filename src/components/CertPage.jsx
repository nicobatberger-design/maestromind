import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import s from "../styles/index";

// Génère un ID court unique pour le certificat
function certId() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return "MM-" + y + m + "-" + r;
}

// Encode les données certificat en base64 pour l'URL
function encodeCert(data) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); } catch { return ""; }
}
function decodeCert(str) {
  try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch { return null; }
}

export default function CertPage() {
  const {
    page,
    certProjet, setCertProjet, certNorme, setCertNorme, certSurface, setCertSurface, certProp, setCertProp, certArtisan, setCertArtisan,
    genererPDF,
  } = useApp();

  const [shared, setShared] = useState(null); // certificat partagé reçu via URL
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Vérifie si l'URL contient un certificat partagé
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[?&]cert=([^&]+)/);
    if (match) {
      const data = decodeCert(match[1]);
      if (data) setShared(data);
    }
  }, []);

  // Générer le lien de partage
  const partagerCert = useCallback(() => {
    const data = {
      id: certId(),
      projet: certProjet,
      norme: certNorme,
      surface: certSurface,
      prop: certProp,
      artisan: certArtisan,
      date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    };
    const base = window.location.origin + window.location.pathname;
    const url = base + "#/cert?cert=" + encodeCert(data);
    setShareUrl(url);
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 3000); }).catch(() => {});
  }, [certProjet, certNorme, certSurface, certProp, certArtisan]);

  // Affichage certificat partagé (lecture seule)
  if (shared) return (
    <div style={{ ...s.page, ...s.pageActive }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Certificat vérifié</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 14 }}>Certificat MAESTROMIND #{shared.id}</div>
        <div style={s.certCard}>
          <div style={s.certSeal}><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg></div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, color: "#C9A84C", marginBottom: 3 }}>CERTIFICAT DE CONFORMITÉ</div>
          <div style={{ fontSize: 9, color: "rgba(240,237,230,0.4)", marginBottom: 6 }}>Délivré par MAESTROMIND · Plateforme IA Bâtiment</div>
          <div style={{ fontSize: 8, padding: "2px 8px", borderRadius: 20, background: "rgba(82,195,122,0.1)", color: "#52C37A", border: "0.5px solid rgba(82,195,122,0.3)", display: "inline-block", marginBottom: 14 }}>VÉRIFIÉ #{shared.id}</div>
          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.55)", lineHeight: 2.2, borderTop: "0.5px solid rgba(201,168,76,0.15)", paddingTop: 12, textAlign: "left" }}>
            <div>Projet : <strong style={{ color: "#F0EDE6" }}>{shared.projet || "—"}</strong></div>
            <div>Norme : <strong style={{ color: "#F0EDE6" }}>{shared.norme?.split("—")[0]?.trim() || "—"}</strong></div>
            <div>Surface : <strong style={{ color: "#F0EDE6" }}>{shared.surface || "—"} m²</strong></div>
            {shared.prop && <div>Maître d'ouvrage : <strong style={{ color: "#F0EDE6" }}>{shared.prop}</strong></div>}
            {shared.artisan && <div>Artisan : <strong style={{ color: "#F0EDE6" }}>{shared.artisan}</strong></div>}
            <div>Date : <strong style={{ color: "#F0EDE6" }}>{shared.date}</strong></div>
            <div>Statut : <strong style={{ color: "#52C37A" }}>{"\u2713"} CONFORME</strong></div>
          </div>
        </div>
        <button onClick={() => { setShared(null); window.history.replaceState({}, "", window.location.pathname + "#/cert"); }} style={{ ...s.dlBtn, background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.3)", color: "#C9A84C" }}>
          Créer mon certificat
        </button>
      </div>
    </div>
  );

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
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ ...s.dlBtn, flex: 1 }} onClick={genererPDF}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            PDF
          </button>
          <button style={{ ...s.dlBtn, flex: 1, background: "rgba(82,144,224,0.1)", border: "0.5px solid rgba(82,144,224,0.4)", color: "#5290E0", boxShadow: "none" }} onClick={partagerCert}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            {copied ? "Lien copié !" : "Partager"}
          </button>
        </div>
        {shareUrl && (
          <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 10, fontSize: 9, color: "rgba(240,237,230,0.5)", wordBreak: "break-all" }}>
            {shareUrl}
          </div>
        )}
      </div>
    </div>
  );
}
