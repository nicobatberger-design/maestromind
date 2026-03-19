import { useApp } from "../context/AppContext";
import s from "../styles/index";
import RappelsChantier from "./RappelsChantier";

export default function ProjetsPage() {
  const {
    page, goPage,
    certProjet, setCertProjet,
    projets, projetNom, setProjetNom, projetType, setProjetType, projetNotes, setProjetNotes,
    crLoading,
    ajouterProjet, supprimerProjet, ouvrirProjetChat, genererCRChantier,
  } = useApp();

  return (
    <div style={{ ...s.page, ...(page === "projets" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Mes Projets</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 14 }}>Suivi de vos chantiers</div>
        <div style={s.card}>
          <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Nouveau projet</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Nom du projet</div><input style={s.inp} value={projetNom} onChange={e => setProjetNom(e.target.value)} placeholder="Ex: Réno salle de bain" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Type</div><select style={s.inp} value={projetType} onChange={e => setProjetType(e.target.value)}>{["Rénovation", "Construction", "Isolation", "Plomberie", "Électricité", "Peinture", "Carrelage", "Aménagement", "Autre"].map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Notes</div><textarea style={{ ...s.inp, minHeight: 60, resize: "none" }} value={projetNotes} onChange={e => setProjetNotes(e.target.value)} placeholder="Description, adresse, budget estimé..." /></div>
          <button style={s.greenBtn} onClick={ajouterProjet}>+ Créer le projet</button>
        </div>
        {projets.length === 0 && <div style={{ textAlign: "center", padding: "32px 16px", color: "rgba(240,237,230,0.3)", fontSize: 12 }}>Aucun projet pour l'instant.<br />Créez votre premier projet ci-dessus.</div>}
        {projets.map(p => <div key={p.id} style={{ ...s.card, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.nom}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "0.5px solid rgba(201,168,76,0.3)", fontWeight: 600 }}>{p.type}</span>
                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(82,195,122,0.08)", color: "#52C37A", border: "0.5px solid rgba(82,195,122,0.25)", fontWeight: 600 }}>{p.statut}</span>
                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(255,255,255,0.03)", color: "rgba(240,237,230,0.38)", border: "0.5px solid rgba(255,255,255,0.07)", fontWeight: 600 }}>{p.date}</span>
              </div>
            </div>
            <button onClick={() => supprimerProjet(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: "rgba(224,82,82,0.5)" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg></button>
          </div>
          {p.notes && <div style={{ fontSize: 11, color: "rgba(240,237,230,0.45)", lineHeight: 1.6, borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 8, marginTop: 6 }}>{p.notes}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
            <button onClick={() => ouvrirProjetChat(p)} style={{ background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "10px 6px", fontSize: 9, fontWeight: 700, color: "#C9A84C", cursor: "pointer" }}>{"\u{1F916}"} IA dédiée</button>
            <button onClick={() => { goPage("cert"); setCertProjet(p.nom); }} style={{ background: "rgba(82,195,122,0.06)", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 10, padding: "10px 6px", fontSize: 9, fontWeight: 700, color: "#52C37A", cursor: "pointer" }}>{"\u{1F3C5}"} Certificat</button>
            <button onClick={() => genererCRChantier(p)} disabled={crLoading} style={{ background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 10, padding: "10px 6px", fontSize: 9, fontWeight: 700, color: "#5290E0", cursor: "pointer", opacity: crLoading ? 0.5 : 1 }}>{crLoading ? "..." : "\u{1F4CB} CR PDF"}</button>
          </div>
        </div>)}

        <RappelsChantier />
      </div>
    </div>
  );
}
