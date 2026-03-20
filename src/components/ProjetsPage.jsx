import { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { triggerToast } from "./Toast";
import s from "../styles/index";
import RappelsChantier from "./RappelsChantier";
import CarnetArtisans from "./CarnetArtisans";

const TAG_COLORS = { Avant: "#5290E0", Pendant: "#E8873A", "Après": "#52C37A" };
const TAGS = ["Avant", "Pendant", "Après"];
const MAX_PHOTOS = 10;
const MAX_WIDTH = 400;
const MAX_TASKS = 50;
const TASK_STATUSES = ["todo", "progress", "done", "redo"];
const TASK_STATUS_LABELS = { todo: "À faire", progress: "En cours", done: "Fait", redo: "À reprendre" };
const TASK_STATUS_COLORS = { todo: "rgba(240,237,230,0.4)", progress: "#E8873A", done: "#52C37A", redo: "#E05252" };

function resizeImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > MAX_WIDTH) { h = Math.round(h * MAX_WIDTH / w); w = MAX_WIDTH; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProjetsPage() {
  const {
    page, goPage,
    certProjet, setCertProjet,
    projets, setProjets, projetNom, setProjetNom, projetType, setProjetType, projetNotes, setProjetNotes,
    crLoading,
    ajouterProjet, supprimerProjet, ouvrirProjetChat, genererCRChantier,
  } = useApp();

  // Photo state
  const [tagMenuProjet, setTagMenuProjet] = useState(null); // project id showing tag menu
  const [selectedTag, setSelectedTag] = useState("Pendant");
  const [modalPhoto, setModalPhoto] = useState(null); // { dataUrl, tag, date }
  const pendingFileRef = useRef(null);
  const fileInputRefs = useRef({});

  // Form visibility
  const [showForm, setShowForm] = useState(false);

  // Task state
  const [taskInputs, setTaskInputs] = useState({}); // { [projetId]: "text" }

  const saveProjets = (updated) => {
    setProjets(updated);
    localStorage.setItem("bl_projets", JSON.stringify(updated));
  };

  const handleFileSelect = (projetId, file) => {
    if (!file) return;
    pendingFileRef.current = { projetId, file };
    setSelectedTag("Pendant");
    setTagMenuProjet(projetId);
  };

  const confirmAddPhoto = async () => {
    if (!pendingFileRef.current) return;
    const { projetId, file } = pendingFileRef.current;
    const projet = projets.find(p => p.id === projetId);
    if (!projet) return;
    const photos = projet.photos || [];
    if (photos.length >= MAX_PHOTOS) {
      alert("Maximum " + MAX_PHOTOS + " photos par projet.");
      setTagMenuProjet(null);
      pendingFileRef.current = null;
      return;
    }
    const dataUrl = await resizeImage(file);
    const newPhoto = {
      id: Date.now(),
      dataUrl,
      date: new Date().toLocaleDateString("fr-FR"),
      tag: selectedTag,
    };
    const updated = projets.map(p =>
      p.id === projetId ? { ...p, photos: [...(p.photos || []), newPhoto] } : p
    );
    saveProjets(updated);
    setTagMenuProjet(null);
    pendingFileRef.current = null;
    // Reset file input
    if (fileInputRefs.current[projetId]) fileInputRefs.current[projetId].value = "";
  };

  const deletePhoto = (projetId, photoId) => {
    const updated = projets.map(p =>
      p.id === projetId ? { ...p, photos: (p.photos || []).filter(ph => ph.id !== photoId) } : p
    );
    saveProjets(updated);
    setModalPhoto(null);
  };

  // Task functions
  const addTask = (projetId) => {
    const text = (taskInputs[projetId] || "").trim();
    if (!text) return;
    const projet = projets.find(p => p.id === projetId);
    if (!projet) return;
    const tasks = projet.tasks || [];
    if (tasks.length >= MAX_TASKS) { alert("Maximum " + MAX_TASKS + " tâches par projet."); return; }
    const newTask = { id: Date.now(), text, status: "todo", date: new Date().toLocaleDateString("fr-FR") };
    const updated = projets.map(p =>
      p.id === projetId ? { ...p, tasks: [...(p.tasks || []), newTask] } : p
    );
    saveProjets(updated);
    setTaskInputs(prev => ({ ...prev, [projetId]: "" }));
  };

  const cycleTaskStatus = (projetId, taskId) => {
    const updated = projets.map(p => {
      if (p.id !== projetId) return p;
      return { ...p, tasks: (p.tasks || []).map(t => {
        if (t.id !== taskId) return t;
        const idx = TASK_STATUSES.indexOf(t.status);
        return { ...t, status: TASK_STATUSES[(idx + 1) % TASK_STATUSES.length] };
      })};
    });
    saveProjets(updated);
  };

  const deleteTask = (projetId, taskId) => {
    const updated = projets.map(p =>
      p.id === projetId ? { ...p, tasks: (p.tasks || []).filter(t => t.id !== taskId) } : p
    );
    saveProjets(updated);
  };

  return (
    <div style={{ ...s.page, ...(page === "projets" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 3 }}>Mes Projets</div>
        <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 14 }}>Suivi de vos chantiers</div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{ width: "100%", background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 14, padding: "14px 18px", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#C9A84C", cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>+</span> Nouveau projet
          </button>
        )}
        {showForm && <div style={s.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Nouveau projet</div>
            <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", color: "rgba(240,237,230,0.4)", cursor: "pointer", fontSize: 16, padding: 0 }}>{"\u2715"}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Nom du projet</div><input style={s.inp} value={projetNom} onChange={e => setProjetNom(e.target.value)} placeholder="Ex: Réno salle de bain" /></div>
            <div><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Type</div><select style={s.inp} value={projetType} onChange={e => setProjetType(e.target.value)}>{["Rénovation", "Construction neuve", "Extension", "Aménagement", "Isolation", "Toiture", "Électricité", "Plomberie", "Peinture", "Carrelage", "Autre"].map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "capitalize", letterSpacing: 0.5 }}>Notes</div><textarea style={{ ...s.inp, minHeight: 60, resize: "none" }} value={projetNotes} onChange={e => setProjetNotes(e.target.value)} placeholder="Description, adresse, budget estimé..." /></div>
          <button style={s.greenBtn} onClick={() => { ajouterProjet(); setShowForm(false); triggerToast("Projet créé !"); }}>+ Créer le projet</button>
        </div>}
        {projets.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.6 }}>{"\u{1F3D7}"}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 6, color: "rgba(240,237,230,0.6)" }}>Aucun projet en cours</div>
            <div style={{ fontSize: 11, color: "rgba(240,237,230,0.35)", lineHeight: 1.6 }}>Créez votre premier projet ci-dessus pour suivre vos chantiers et générer des CR automatiques.</div>
          </div>
        )}
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

          {/* === PHOTO TIMELINE === */}
          <div style={{ marginTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
            {/* Add photo button */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.25)",
                borderRadius: 8, padding: "6px 12px", fontSize: 10, fontWeight: 600,
                color: "#C9A84C", cursor: "pointer",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                </svg>
                Ajouter photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={el => { fileInputRefs.current[p.id] = el; }}
                  style={{ display: "none" }}
                  onChange={e => handleFileSelect(p.id, e.target.files?.[0])}
                />
              </label>
              <span style={{ fontSize: 9, color: "rgba(240,237,230,0.3)" }}>
                {(p.photos || []).length}/{MAX_PHOTOS}
              </span>
            </div>

            {/* Tag selector menu */}
            {tagMenuProjet === p.id && (
              <div style={{
                background: "rgba(15,19,28,0.95)", border: "0.5px solid rgba(201,168,76,0.3)",
                borderRadius: 10, padding: 10, marginBottom: 10,
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              }}>
                <div style={{ fontSize: 9, color: "rgba(240,237,230,0.5)", marginBottom: 8, fontWeight: 600 }}>Choisir le tag :</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                  {TAGS.map(tag => (
                    <button key={tag} onClick={() => setSelectedTag(tag)} style={{
                      background: selectedTag === tag ? TAG_COLORS[tag] + "22" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selectedTag === tag ? TAG_COLORS[tag] : "rgba(255,255,255,0.1)"}`,
                      borderRadius: 16, padding: "5px 12px", fontSize: 10, fontWeight: 600,
                      color: selectedTag === tag ? TAG_COLORS[tag] : "rgba(240,237,230,0.4)",
                      cursor: "pointer",
                    }}>
                      {tag}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={confirmAddPhoto} style={{
                    background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none",
                    borderRadius: 8, padding: "7px 16px", fontSize: 10, fontWeight: 700,
                    color: "#06080D", cursor: "pointer",
                  }}>Confirmer</button>
                  <button onClick={() => { setTagMenuProjet(null); pendingFileRef.current = null; if (fileInputRefs.current[p.id]) fileInputRefs.current[p.id].value = ""; }} style={{
                    background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "7px 16px", fontSize: 10, fontWeight: 600,
                    color: "rgba(240,237,230,0.5)", cursor: "pointer",
                  }}>Annuler</button>
                </div>
              </div>
            )}

            {/* Photo timeline */}
            {p.photos?.length > 0 && (
              <div style={{
                display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
                scrollbarWidth: "none", msOverflowStyle: "none",
              }}>
                {p.photos.map(ph => (
                  <div key={ph.id} style={{
                    flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    cursor: "pointer",
                  }} onClick={() => setModalPhoto({ ...ph, projetId: p.id })}>
                    <div style={{ position: "relative" }}>
                      <img src={ph.dataUrl} alt={ph.tag} style={{
                        width: 80, height: 80, objectFit: "cover", borderRadius: 8,
                        border: `1.5px solid ${TAG_COLORS[ph.tag] || "#555"}`,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
                      background: (TAG_COLORS[ph.tag] || "#555") + "22",
                      color: TAG_COLORS[ph.tag] || "#555",
                      border: `0.5px solid ${TAG_COLORS[ph.tag] || "#555"}`,
                    }}>{ph.tag}</span>
                    <span style={{ fontSize: 8, color: "rgba(240,237,230,0.3)" }}>{ph.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* === END PHOTO TIMELINE === */}

          {/* === TÂCHES === */}
          <div style={{ marginTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
            <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Tâches</div>

            {/* Progress bar */}
            {(p.tasks || []).length > 0 && (() => {
              const tasks = p.tasks || [];
              const doneCount = tasks.filter(t => t.status === "done").length;
              const pct = Math.round((doneCount / tasks.length) * 100);
              return (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: "rgba(240,237,230,0.55)", marginBottom: 4 }}>
                    {doneCount}/{tasks.length} tâches terminées
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, width: pct + "%", background: "#52C37A", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })()}

            {/* Add task input */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input
                style={{ ...s.inp, flex: 1 }}
                value={taskInputs[p.id] || ""}
                onChange={e => setTaskInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                onKeyDown={e => { if (e.key === "Enter") addTask(p.id); }}
                placeholder="Nouvelle tâche..."
              />
              <button
                onClick={() => addTask(p.id)}
                style={{
                  background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none",
                  borderRadius: 8, width: 34, fontSize: 16, fontWeight: 700,
                  color: "#06080D", cursor: "pointer", flexShrink: 0,
                }}
              >+</button>
            </div>

            {/* Task list */}
            {(p.tasks || []).map(task => (
              <div key={task.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 0",
                borderBottom: "0.5px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{
                  flex: 1, fontSize: 11, color: task.status === "done" ? "rgba(240,237,230,0.35)" : "rgba(240,237,230,0.75)",
                  textDecoration: task.status === "done" ? "line-through" : "none",
                }}>{task.text}</div>
                <button
                  onClick={() => cycleTaskStatus(p.id, task.id)}
                  style={{
                    background: TASK_STATUS_COLORS[task.status] + (task.status === "todo" ? "" : "22"),
                    border: `0.5px solid ${TASK_STATUS_COLORS[task.status]}`,
                    borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 600,
                    color: task.status === "todo" ? "rgba(240,237,230,0.6)" : TASK_STATUS_COLORS[task.status],
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >{TASK_STATUS_LABELS[task.status]}</button>
                <button
                  onClick={() => deleteTask(p.id, task.id)}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    padding: 2, color: "rgba(224,82,82,0.4)", fontSize: 14, lineHeight: 1,
                  }}
                >&times;</button>
              </div>
            ))}
          </div>
          {/* === END TÂCHES === */}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
            <button onClick={() => ouvrirProjetChat(p)} style={{ background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "10px 6px", fontSize: 9, fontWeight: 700, color: "#C9A84C", cursor: "pointer" }}>{"\u{1F916}"} IA dédiée</button>
            <button onClick={() => { goPage("cert"); setCertProjet(p.nom); }} style={{ background: "rgba(82,195,122,0.06)", border: "0.5px solid rgba(82,195,122,0.2)", borderRadius: 10, padding: "10px 6px", fontSize: 9, fontWeight: 700, color: "#52C37A", cursor: "pointer" }}>{"\u{1F3C5}"} Certificat</button>
            <button onClick={() => genererCRChantier(p)} disabled={crLoading} style={{ background: "rgba(82,144,224,0.06)", border: "0.5px solid rgba(82,144,224,0.2)", borderRadius: 10, padding: "10px 6px", fontSize: 9, fontWeight: 700, color: "#5290E0", cursor: "pointer", opacity: crLoading ? 0.5 : 1 }}>{crLoading ? "..." : "\u{1F4CB} CR PDF"}</button>
          </div>
        </div>)}

        <RappelsChantier />
        <CarnetArtisans />
      </div>

      {/* === MODAL PHOTO PLEIN ECRAN === */}
      {modalPhoto && (
        <div onClick={() => setModalPhoto(null)} style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.92)", display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            maxWidth: "100%", maxHeight: "100%",
          }}>
            <img src={modalPhoto.dataUrl} alt={modalPhoto.tag} style={{
              maxWidth: "100%", maxHeight: "70vh", borderRadius: 10,
              border: `2px solid ${TAG_COLORS[modalPhoto.tag] || "#555"}`,
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 14,
                background: (TAG_COLORS[modalPhoto.tag] || "#555") + "33",
                color: TAG_COLORS[modalPhoto.tag] || "#aaa",
                border: `1px solid ${TAG_COLORS[modalPhoto.tag] || "#555"}`,
              }}>{modalPhoto.tag}</span>
              <span style={{ fontSize: 11, color: "rgba(240,237,230,0.5)" }}>{modalPhoto.date}</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => deletePhoto(modalPhoto.projetId, modalPhoto.id)} style={{
                background: "rgba(224,82,82,0.15)", border: "1px solid rgba(224,82,82,0.4)",
                borderRadius: 10, padding: "8px 16px", fontSize: 11, fontWeight: 600,
                color: "#E05252", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                Supprimer
              </button>
              <button onClick={() => setModalPhoto(null)} style={{
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10, padding: "8px 16px", fontSize: 11, fontWeight: 600,
                color: "rgba(240,237,230,0.7)", cursor: "pointer",
              }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
