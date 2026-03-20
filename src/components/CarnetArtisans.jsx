import { useState, useCallback } from "react";
import s from "../styles/index";

const ARTISANS_KEY = "mm_carnet_artisans";

function loadArtisans() {
  try { return JSON.parse(localStorage.getItem(ARTISANS_KEY)) || []; } catch { return []; }
}
function saveArtisans(list) {
  localStorage.setItem(ARTISANS_KEY, JSON.stringify(list));
}

const SPECIALITES = [
  "Maçonnerie", "Plomberie", "Électricité", "Peinture", "Carrelage",
  "Placo/Plâtrerie", "Menuiserie", "Couverture", "Chauffage/PAC",
  "Isolation", "Terrassement", "Charpente", "Serrurerie", "Autre",
];

export default function CarnetArtisans() {
  const [artisans, setArtisans] = useState(loadArtisans);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nom, setNom] = useState("");
  const [specialite, setSpecialite] = useState("Maçonnerie");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState(3);
  const [commentaire, setCommentaire] = useState("");
  const [rge, setRge] = useState(false);
  const [filterSpec, setFilterSpec] = useState("Tous");

  const resetForm = () => {
    setNom(""); setSpecialite("Maçonnerie"); setTelephone(""); setEmail("");
    setNote(3); setCommentaire(""); setRge(false); setEditId(null);
  };

  const sauvegarder = useCallback(() => {
    if (!nom.trim()) return;
    const artisan = {
      id: editId || Date.now(),
      nom: nom.trim(), specialite, telephone: telephone.trim(),
      email: email.trim(), note, commentaire: commentaire.trim(), rge,
      date: new Date().toLocaleDateString("fr-FR"),
    };
    let updated;
    if (editId) {
      updated = artisans.map(a => a.id === editId ? artisan : a);
    } else {
      updated = [artisan, ...artisans];
    }
    setArtisans(updated);
    saveArtisans(updated);
    resetForm();
    setShowForm(false);
  }, [nom, specialite, telephone, email, note, commentaire, rge, editId, artisans]);

  const supprimer = useCallback((id) => {
    if (!window.confirm("Supprimer cet artisan ?")) return;
    const updated = artisans.filter(a => a.id !== id);
    setArtisans(updated);
    saveArtisans(updated);
  }, [artisans]);

  const editer = useCallback((a) => {
    setNom(a.nom); setSpecialite(a.specialite); setTelephone(a.telephone || "");
    setEmail(a.email || ""); setNote(a.note); setCommentaire(a.commentaire || "");
    setRge(a.rge || false); setEditId(a.id); setShowForm(true);
  }, []);

  const filtered = filterSpec === "Tous" ? artisans : artisans.filter(a => a.specialite === filterSpec);
  const specs = ["Tous", ...new Set(artisans.map(a => a.specialite))];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📇</span> Carnet Artisans
          </div>
          <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)" }}>{artisans.length} artisan{artisans.length > 1 ? "s" : ""} sauvegardé{artisans.length > 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={{ padding: "8px 14px", borderRadius: 10, background: showForm ? "rgba(224,82,82,0.08)" : "rgba(201,168,76,0.08)", border: "0.5px solid " + (showForm ? "rgba(224,82,82,0.3)" : "rgba(201,168,76,0.3)"), color: showForm ? "#E05252" : "#C9A84C", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          {showForm ? "Annuler" : "+ Ajouter"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="liquid-glass" style={{ borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom / Entreprise *" style={{ ...s.inp, marginBottom: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="Téléphone" type="tel" style={s.inp} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={s.inp} />
          </div>
          <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", marginBottom: 4 }}>SPÉCIALITÉ</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
            {SPECIALITES.map(sp => (
              <button key={sp} onClick={() => setSpecialite(sp)} style={{ padding: "5px 9px", borderRadius: 16, fontSize: 9, fontWeight: 600, cursor: "pointer", border: sp === specialite ? "0.5px solid #C9A84C" : "0.5px solid rgba(255,255,255,0.06)", background: sp === specialite ? "rgba(201,168,76,0.12)" : "transparent", color: sp === specialite ? "#C9A84C" : "rgba(240,237,230,0.4)" }}>{sp}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)" }}>NOTE</div>
            <div style={{ display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setNote(n)} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: n <= note ? "#C9A84C" : "rgba(255,255,255,0.1)", padding: 0 }}>★</button>
              ))}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", fontSize: 10, color: rge ? "#52C37A" : "rgba(240,237,230,0.4)", cursor: "pointer" }}>
              <input type="checkbox" checked={rge} onChange={e => setRge(e.target.checked)} style={{ accentColor: "#52C37A" }} /> RGE
            </label>
          </div>
          <input value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Commentaire (optionnel)" style={{ ...s.inp, marginBottom: 10 }} />
          <button onClick={sauvegarder} style={{ width: "100%", padding: 12, borderRadius: 12, background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#06080D", cursor: "pointer" }}>
            {editId ? "Modifier" : "Sauvegarder"}
          </button>
        </div>
      )}

      {/* Filtres */}
      {artisans.length > 0 && (
        <div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none", marginBottom: 10, paddingBottom: 2 }}>
          {specs.map(sp => (
            <button key={sp} onClick={() => setFilterSpec(sp)} style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 16, fontSize: 9, fontWeight: 600, cursor: "pointer", border: sp === filterSpec ? "0.5px solid #C9A84C" : "0.5px solid rgba(255,255,255,0.06)", background: sp === filterSpec ? "rgba(201,168,76,0.12)" : "transparent", color: sp === filterSpec ? "#C9A84C" : "rgba(240,237,230,0.4)", whiteSpace: "nowrap" }}>{sp}</button>
          ))}
        </div>
      )}

      {/* Liste */}
      {filtered.length === 0 && !showForm && (
        <div style={{ textAlign: "center", padding: "30px 16px", color: "rgba(240,237,230,0.2)", fontSize: 11 }}>
          Aucun artisan sauvegardé. Ajoutez vos artisans de confiance.
        </div>
      )}
      {filtered.map(a => (
        <div key={a.id} className="liquid-glass" style={{ borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, fontSize: 14, color: "#C9A84C" }}>
            {a.nom[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nom}</div>
              {a.rge && <span style={{ fontSize: 7, padding: "1px 5px", borderRadius: 8, background: "rgba(82,195,122,0.12)", color: "#52C37A", border: "0.5px solid rgba(82,195,122,0.3)", fontWeight: 700 }}>RGE</span>}
            </div>
            <div style={{ fontSize: 10, color: "rgba(240,237,230,0.4)", marginTop: 1 }}>{a.specialite}</div>
            <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
              {[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 10, color: n <= a.note ? "#C9A84C" : "rgba(255,255,255,0.08)" }}>★</span>)}
            </div>
            {a.commentaire && <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)", marginTop: 3, fontStyle: "italic" }}>"{a.commentaire}"</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {a.telephone && <a href={"tel:" + a.telephone} style={{ fontSize: 10, color: "#5290E0", textDecoration: "none", fontWeight: 600 }}>📞 Appeler</a>}
              {a.email && <a href={"mailto:" + a.email} style={{ fontSize: 10, color: "#C9A84C", textDecoration: "none", fontWeight: 600 }}>✉ Email</a>}
              <button onClick={() => editer(a)} style={{ background: "transparent", border: "none", fontSize: 10, color: "rgba(240,237,230,0.3)", cursor: "pointer" }}>✏ Modifier</button>
              <button onClick={() => supprimer(a.id)} style={{ background: "transparent", border: "none", fontSize: 10, color: "rgba(224,82,82,0.5)", cursor: "pointer" }}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
