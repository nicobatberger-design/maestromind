import { useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { streamChat } from "../utils/api";
import s from "../styles/index";

const CHECKLISTS_KEY = "mm_checklists";

function loadChecklists() {
  try { return JSON.parse(localStorage.getItem(CHECKLISTS_KEY)) || []; } catch { return []; }
}
function saveChecklists(lists) {
  localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(lists));
}

const TEMPLATES = [
  { label: "Pose carrelage sol", prompt: "checklist complète pour poser du carrelage au sol dans une pièce" },
  { label: "Cloison BA13", prompt: "checklist complète pour monter une cloison en placo BA13" },
  { label: "Peinture pièce", prompt: "checklist complète pour peindre une pièce (murs + plafond)" },
  { label: "Salle de bain", prompt: "checklist rénovation complète salle de bain" },
  { label: "Isolation combles", prompt: "checklist pour isoler des combles perdus" },
  { label: "Installation prise", prompt: "checklist pour installer une prise électrique encastrée" },
  { label: "Terrasse bois", prompt: "checklist pour construire une terrasse en bois" },
  { label: "Remplacement fenêtre", prompt: "checklist pour remplacer une fenêtre" },
];

export default function ChecklistChantier() {
  const { apiKey, profilIA } = useApp();
  const [checklists, setChecklists] = useState(loadChecklists);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeList, setActiveList] = useState(null);

  const genererChecklist = useCallback(async (prompt) => {
    setGenerating(true);
    try {
      const body = {
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        system: `Tu es un expert chantier bâtiment. Génère une checklist de travaux UNIQUEMENT en JSON valide. Format : {"titre":"Titre court","etapes":[{"texte":"Étape détaillée","duree":"30min","outils":["outil 1"],"dtu":"DTU XX.X ou null","alerte":"alerte sécurité ou null"}]}. Maximum 15 étapes. Chaque étape doit être actionnable et précise. Inclus les temps de séchage. ${profilIA()}`,
        messages: [{ role: "user", content: prompt }],
      };
      let result = "";
      await streamChat({ apiKey, body, onToken: (t) => { result = t; } });

      const clean = result.replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(clean); } catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error("Réponse invalide");
      }

      const checklist = {
        id: Date.now(),
        titre: parsed.titre || "Checklist",
        etapes: (parsed.etapes || []).map((e, i) => ({ ...e, id: i, done: false })),
        date: new Date().toLocaleDateString("fr-FR"),
        progression: 0,
      };

      const updated = [checklist, ...checklists].slice(0, 20);
      setChecklists(updated);
      saveChecklists(updated);
      setActiveList(checklist.id);
      setCustomPrompt("");
    } catch (e) {
      alert("Erreur : " + e.message);
    } finally { setGenerating(false); }
  }, [apiKey, profilIA, checklists]);

  const toggleEtape = useCallback((listId, etapeId) => {
    setChecklists(prev => {
      const updated = prev.map(list => {
        if (list.id !== listId) return list;
        const etapes = list.etapes.map(e => e.id === etapeId ? { ...e, done: !e.done } : e);
        const done = etapes.filter(e => e.done).length;
        return { ...list, etapes, progression: Math.round((done / etapes.length) * 100) };
      });
      saveChecklists(updated);
      return updated;
    });
  }, []);

  const supprimerChecklist = useCallback((id) => {
    const updated = checklists.filter(l => l.id !== id);
    setChecklists(updated);
    saveChecklists(updated);
    if (activeList === id) setActiveList(null);
  }, [checklists, activeList]);

  const activeChecklist = checklists.find(l => l.id === activeList);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
        <span>✅</span> Checklists Chantier
      </div>
      <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 12 }}>L'IA génère votre liste de tâches pas-à-pas</div>

      {/* Active checklist detail */}
      {activeChecklist ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button onClick={() => setActiveList(null)} style={{ background: "transparent", border: "none", color: "rgba(240,237,230,0.4)", fontSize: 12, cursor: "pointer" }}>← Retour</button>
            <button onClick={() => supprimerChecklist(activeChecklist.id)} style={{ background: "transparent", border: "none", color: "#E05252", fontSize: 11, cursor: "pointer" }}>Supprimer</button>
          </div>

          <div className="liquid-glass" style={{ borderRadius: 16, padding: "16px", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{activeChecklist.titre}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ width: activeChecklist.progression + "%", height: "100%", borderRadius: 3, background: activeChecklist.progression === 100 ? "#52C37A" : "linear-gradient(135deg,#EDD060,#C9A84C)", transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: activeChecklist.progression === 100 ? "#52C37A" : "#C9A84C" }}>{activeChecklist.progression}%</span>
            </div>

            {activeChecklist.etapes.map((e, i) => (
              <div key={e.id} onClick={() => toggleEtape(activeChecklist.id, e.id)} style={{ display: "flex", gap: 10, padding: "10px 0", cursor: "pointer", borderBottom: i < activeChecklist.etapes.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none", opacity: e.done ? 0.5 : 1 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: e.done ? "none" : "1.5px solid rgba(201,168,76,0.4)", background: e.done ? "linear-gradient(135deg,#52C37A,#3A9B5A)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {e.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, lineHeight: 1.5, textDecoration: e.done ? "line-through" : "none" }}>{e.texte}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    {e.duree && <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 10, background: "rgba(82,144,224,0.1)", color: "#5290E0", border: "0.5px solid rgba(82,144,224,0.2)" }}>{e.duree}</span>}
                    {e.dtu && <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 10, background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "0.5px solid rgba(201,168,76,0.2)" }}>{e.dtu}</span>}
                    {e.alerte && <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 10, background: "rgba(224,82,82,0.1)", color: "#E05252", border: "0.5px solid rgba(224,82,82,0.2)" }}>{e.alerte}</span>}
                  </div>
                  {e.outils && e.outils.length > 0 && (
                    <div style={{ fontSize: 9, color: "rgba(240,237,230,0.3)", marginTop: 3 }}>Outils : {e.outils.join(", ")}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Templates rapides */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {TEMPLATES.map((t, i) => (
              <button key={i} disabled={generating} onClick={() => genererChecklist(t.prompt)} style={{ padding: "7px 12px", borderRadius: 20, fontSize: 10, fontWeight: 600, cursor: "pointer", background: "rgba(201,168,76,0.06)", border: "0.5px solid rgba(201,168,76,0.15)", color: "rgba(240,237,230,0.5)", opacity: generating ? 0.5 : 1 }}>{t.label}</button>
            ))}
          </div>

          {/* Custom */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="Ou décrivez vos travaux..." style={{ ...s.inp, flex: 1 }} onKeyDown={e => { if (e.key === "Enter" && customPrompt.trim()) genererChecklist(customPrompt); }} />
            <button disabled={generating || !customPrompt.trim()} onClick={() => genererChecklist(customPrompt)} style={{ padding: "0 16px", borderRadius: 12, background: "linear-gradient(135deg,#EDD060,#C9A84C)", border: "none", fontWeight: 700, fontSize: 12, color: "#06080D", cursor: "pointer", opacity: generating ? 0.5 : 1, flexShrink: 0 }}>
              {generating ? "..." : "Générer"}
            </button>
          </div>

          {generating && (
            <div style={{ textAlign: "center", padding: 16, color: "rgba(240,237,230,0.4)", fontSize: 12 }}>L'IA prépare votre checklist...</div>
          )}

          {/* Saved checklists */}
          {checklists.length > 0 && (
            <>
              <div style={{ fontSize: 9, color: "rgba(240,237,230,0.25)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Mes checklists</div>
              {checklists.map(list => (
                <div key={list.id} onClick={() => setActiveList(list.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: list.progression === 100 ? "rgba(82,195,122,0.12)" : "rgba(201,168,76,0.08)", border: "0.5px solid " + (list.progression === 100 ? "rgba(82,195,122,0.3)" : "rgba(201,168,76,0.2)"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: list.progression === 100 ? "#52C37A" : "#C9A84C" }}>{list.progression}%</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{list.titre}</div>
                    <div style={{ fontSize: 10, color: "rgba(240,237,230,0.3)" }}>{list.etapes.length} étapes — {list.date}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(240,237,230,0.15)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
