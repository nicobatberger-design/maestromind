import { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { apiURL, apiHeaders, withRetry } from "../utils/api";
import s from "../styles/index";

const SYSTEM_PROMPT = `Tu es l'IA MÉTREUR EXPERT de MAESTROMIND, spécialiste des mesures et métrés dans le bâtiment.

TON RÔLE : Aider l'utilisateur à déterminer précisément les mesures nécessaires pour ses travaux.

TU MAÎTRISES :
- Surface au sol, surface habitable, surface loi Carrez
- Surface de murs (périmètre × hauteur - ouvertures)
- Surface en rampant (pente de toit : surface = surface au sol / cos(angle))
- Déduction des ouvertures (portes standard 2.04×0.83m, fenêtres)
- Calcul de volumes (m³ pour béton, isolant soufflé)
- Périmètre linéaire (pour plinthes, corniches, rails)
- Calcul de pente (conversion degré/pourcentage, hauteur sous faîtage vs sablière)
- Formes complexes : L, T, U, trapèze, triangle

COMPORTEMENT :
1. Pose des questions simples et concrètes ("Votre pièce est rectangulaire ou en L ?")
2. Demande les mesures que l'utilisateur peut prendre facilement au mètre
3. Calcule les surfaces/volumes dérivés automatiquement
4. Quand tu as assez d'infos, réponds avec un JSON de résultats

QUAND TU AS LES MESURES, termine TOUJOURS ta réponse avec un bloc JSON entre balises :
<MESURES>{"surface":"XX","hauteur":"X.XX","pente":"XX","longueur":"XX","details":"explication courte"}</MESURES>

Les valeurs sont en m², m, degrés, ml. Ne mets que les champs pertinents.
Si tu n'as pas encore assez d'infos, ne mets PAS le bloc <MESURES>.`;

export default function MesureAssistant({ onResult, context }) {
  const { apiKey } = useApp();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [msgs]);

  const openAssistant = () => {
    setOpen(true);
    if (msgs.length === 0) {
      const ctx = context ? ` pour ${context}` : "";
      setMsgs([{ role: "ai", text: `📐 Je suis votre Métreur IA. Je vais vous aider à calculer vos mesures${ctx}.\n\n**Décrivez votre pièce ou la zone à mesurer** — forme (rectangulaire, en L, sous pente...), et les dimensions que vous connaissez.` }]);
    }
  };

  const sendMsg = useCallback(async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    const newMsgs = [...msgs, { role: "user", text: txt }];
    setMsgs([...newMsgs, { role: "ai", text: "..." }]);
    setLoading(true);
    try {
      const hist = newMsgs.filter(m => m.text !== "...").map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })).slice(-12);
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, system: SYSTEM_PROMPT, messages: hist }),
      }));
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rep = data.content[0].text;

      // Extraire les mesures si présentes
      const match = rep.match(/<MESURES>(.*?)<\/MESURES>/s);
      if (match) {
        try {
          const mesures = JSON.parse(match[1]);
          if (onResult) onResult(mesures);
        } catch {}
      }

      const cleanRep = rep.replace(/<MESURES>.*?<\/MESURES>/s, "").trim();
      setMsgs([...newMsgs, { role: "ai", text: cleanRep + (match ? "\n\n✅ **Mesures injectées dans le formulaire.**" : "") }]);
    } catch (e) {
      setMsgs([...newMsgs, { role: "ai", text: "Erreur : " + e.message }]);
    } finally { setLoading(false); }
  }, [input, msgs, loading, apiKey, onResult]);

  return (
    <>
      <button onClick={openAssistant} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(82,195,122,0.1)", border: "0.5px solid rgba(82,195,122,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} title="Aide mesure IA">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#52C37A" strokeWidth="2" strokeLinecap="round"><path d="M2 2l5 5M2 2v4M2 2h4" /><path d="M22 22l-5-5M22 22v-4M22 22h-4" /><path d="M22 2l-5 5M22 2v4M22 2h-4" /><path d="M2 22l5-5M2 22v-4M2 22h4" /></svg>
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,13,0.98)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", flexDirection: "column", zIndex: 9995, maxWidth: 430, margin: "0 auto" }}>
          <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(82,195,122,0.2)", flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#52C37A,#3A9B5A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2.2" strokeLinecap="round"><path d="M2 2l5 5M2 2v4M2 2h4" /><path d="M22 22l-5-5M22 22v-4M22 22h-4" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}>Métreur IA</div>
              <div style={{ fontSize: 10, color: "#52C37A" }}>Expert mesures bâtiment</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.4)", fontSize: 22, cursor: "pointer", padding: 4 }}>{"\u00D7"}</button>
          </div>

          <div ref={msgsRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={m.role === "ai" ? s.msgA : s.msgU}>
                <div style={s.mav}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={m.role === "ai" ? "#52C37A" : "#C9A84C"} strokeWidth="1.8" strokeLinecap="round">
                    {m.role === "ai" ? <path d="M2 2l5 5M2 2v4M2 2h4M22 22l-5-5M22 22v-4M22 22h-4" /> : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}
                  </svg>
                </div>
                <div style={m.role === "ai" ? s.bubA : s.bubU} dangerouslySetInnerHTML={{ __html: m.text === "..." ? "<span>...</span>" : m.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 16px 16px", borderTop: "0.5px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <div style={s.inputBar}>
              <textarea style={s.ci} value={input} onChange={e => setInput(e.target.value)} placeholder="Ex: Pièce 4m x 3m sous combles..." rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} />
              <button style={s.sb} onClick={sendMsg} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
