import { useState, useEffect, useCallback } from "react";
import s from "../styles/index";

const RAPPELS_KEY = "mm_rappels";
const TOAST_KEY = "mm_rappels_last_check";

function loadRappels() {
  try { return JSON.parse(localStorage.getItem(RAPPELS_KEY)) || []; } catch { return []; }
}
function saveRappels(r) { localStorage.setItem(RAPPELS_KEY, JSON.stringify(r)); }

export function useRappelsToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const check = () => {
      const rappels = loadRappels();
      const now = new Date();
      const due = rappels.filter(r => {
        const rd = new Date(r.date + "T" + r.heure);
        return rd <= now && !r.dismissed;
      });
      if (due.length > 0) {
        setToast(due[0]);
        // Auto-dismiss after 5s
        setTimeout(() => setToast(null), 5000);
        // Mark as dismissed (for "une fois") or update next occurrence
        const updated = rappels.map(r => {
          if (r.id === due[0].id) {
            if (r.recurrence === "once") return { ...r, dismissed: true };
            // Advance to next occurrence
            const rd = new Date(r.date + "T" + r.heure);
            if (r.recurrence === "daily") rd.setDate(rd.getDate() + 1);
            if (r.recurrence === "weekly") rd.setDate(rd.getDate() + 7);
            return { ...r, date: rd.toISOString().split("T")[0] };
          }
          return r;
        });
        saveRappels(updated);
      }
    };
    check();
    const interval = setInterval(check, 60000); // check every minute
    return () => clearInterval(interval);
  }, []);

  return { toast, dismissToast: () => setToast(null) };
}

export function RappelToast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", top: 12, left: 12, right: 12, zIndex: 9999,
      background: "rgba(15,19,28,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(201,168,76,0.4)", borderRadius: 14,
      padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(201,168,76,0.15)",
      animation: "fadeSlideUp 0.3s ease-out"
    }}>
      <div style={{ fontSize: 22, flexShrink: 0 }}>{"\uD83D\uDD14"}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700, color: "#C9A84C" }}>{toast.titre}</div>
        <div style={{ fontSize: 10, color: "rgba(240,237,230,0.5)" }}>{toast.date} {toast.heure}</div>
      </div>
      <button onClick={onDismiss} style={{ background: "transparent", border: "none", color: "rgba(240,237,230,0.4)", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
    </div>
  );
}

export default function RappelsChantier() {
  const [rappels, setRappels] = useState(loadRappels);
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [heure, setHeure] = useState("09:00");
  const [recurrence, setRecurrence] = useState("once");

  const ajouterRappel = useCallback(() => {
    if (!titre.trim()) return;
    const newR = { id: Date.now(), titre: titre.trim(), date, heure, recurrence, dismissed: false };
    const updated = [newR, ...rappels];
    setRappels(updated);
    saveRappels(updated);
    setTitre("");
  }, [titre, date, heure, recurrence, rappels]);

  const supprimerRappel = useCallback((id) => {
    const updated = rappels.filter(r => r.id !== id);
    setRappels(updated);
    saveRappels(updated);
  }, [rappels]);

  const recLabels = { once: "Une fois", daily: "Quotidien", weekly: "Hebdo" };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 800, marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{"\uD83D\uDD14"}</span> Rappels Chantier
      </div>
      <div style={{ fontSize: 11, color: "rgba(240,237,230,0.5)", marginBottom: 12 }}>Programmez vos rappels travaux</div>

      {/* Formulaire */}
      <div style={{ background: "rgba(15,19,28,0.7)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 14, padding: "14px 15px", marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: "#C9A84C", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Nouveau rappel</div>

        <input style={{ ...s.inp, marginBottom: 8 }} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Vérifier séchage béton" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Date</div>
            <input type="date" style={s.inp} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Heure</div>
            <input type="time" style={s.inp} value={heure} onChange={e => setHeure(e.target.value)} />
          </div>
        </div>

        <div style={{ fontSize: 9, color: "rgba(240,237,230,0.38)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 1 }}>Récurrence</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {[["once", "Une fois"], ["daily", "Quotidien"], ["weekly", "Hebdo"]].map(([k, l]) => (
            <button key={k} onClick={() => setRecurrence(k)} style={{
              flex: 1, padding: "8px 6px", borderRadius: 10, fontSize: 10, fontWeight: 600, cursor: "pointer",
              border: "0.5px solid " + (recurrence === k ? "#C9A84C" : "rgba(255,255,255,0.08)"),
              background: recurrence === k ? "rgba(201,168,76,0.12)" : "transparent",
              color: recurrence === k ? "#C9A84C" : "rgba(240,237,230,0.4)",
              fontFamily: "'Syne',sans-serif"
            }}>{l}</button>
          ))}
        </div>

        <button onClick={ajouterRappel} style={{
          width: "100%", background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.45)",
          borderRadius: 12, padding: 12, fontFamily: "'Syne',sans-serif", fontSize: 12, fontWeight: 700,
          color: "#C9A84C", cursor: "pointer"
        }}>+ Ajouter le rappel</button>
      </div>

      {/* Liste des rappels */}
      {rappels.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px 16px", color: "rgba(240,237,230,0.3)", fontSize: 11 }}>
          Aucun rappel programmé.
        </div>
      )}
      {rappels.filter(r => !r.dismissed).map(r => (
        <div key={r.id} style={{
          background: "rgba(15,19,28,0.7)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12,
          padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10
        }}>
          <div style={{ fontSize: 18, flexShrink: 0 }}>{"\uD83D\uDD14"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#F0EDE6", fontFamily: "'Syne',sans-serif" }}>{r.titre}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
              <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 20, background: "rgba(201,168,76,0.08)", color: "#C9A84C", border: "0.5px solid rgba(201,168,76,0.2)", fontWeight: 600 }}>{r.date} {r.heure}</span>
              <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 20, background: "rgba(82,195,122,0.08)", color: "#52C37A", border: "0.5px solid rgba(82,195,122,0.2)", fontWeight: 600 }}>{recLabels[r.recurrence]}</span>
            </div>
          </div>
          <button onClick={() => supprimerRappel(r.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: "rgba(224,82,82,0.5)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
          </button>
        </div>
      ))}
    </div>
  );
}
