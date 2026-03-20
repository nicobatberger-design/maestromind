import { useRef, useEffect, useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { speak, stop, isTTSSupported } from "../utils/tts";
import s from "../styles/index";

export default function ProjetChatOverlay() {
  const { projetChat, setProjetChat, projetChatMsgs, projetChatInput, setProjetChatInput, projetChatLoading, sendProjetChat } = useApp();
  const msgsEndRef = useRef(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const toggleSpeak = useCallback((text, idx) => {
    if (speakingIdx === idx) { stop(); setSpeakingIdx(null); }
    else { speak(text, () => setSpeakingIdx(idx), () => setSpeakingIdx(null)); }
  }, [speakingIdx]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [projetChatMsgs]);

  if (!projetChat) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,13,0.98)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", flexDirection: "column", zIndex: 9994, maxWidth: 430, margin: "0 auto" }}>
      <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(201,168,76,0.15)", flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#080A0F" strokeWidth="2.2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg></div>
        <div style={{ flex: 1 }}><div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}>{projetChat.nom}</div><div style={{ fontSize: 10, color: "#C9A84C" }}>IA dédiée · {projetChat.type}</div></div>
        <button onClick={() => setProjetChat(null)} style={{ background: "none", border: "none", color: "rgba(240,237,230,0.4)", fontSize: 22, cursor: "pointer", padding: 4 }}>{"\u00D7"}</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {projetChatMsgs.length === 0 && (
          <>
            <div style={s.msgA}>
              <div style={s.mav}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div>
              <div><div style={s.bubA}>Bonjour ! Je connais votre projet <strong>{projetChat.nom}</strong>. Posez-moi vos questions sur le planning, le budget ou les normes.</div></div>
            </div>
            <div style={s.chips}>
              {["Budget prévisionnel de ce projet", "Normes DTU applicables", "Planning des travaux"].map(label => (
                <button key={label} style={s.chip} onClick={() => setProjetChatInput(label)}>{label}</button>
              ))}
            </div>
          </>
        )}
        {projetChatMsgs.map((m, i) => (
          <div key={i} style={m.role === "ai" ? s.msgA : s.msgU}>
            <div style={s.mav}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round">{m.role === "ai" ? <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}</svg></div>
            <div>
              <div style={m.role === "ai" ? s.bubA : s.bubU} dangerouslySetInnerHTML={{ __html: m.text === "..." ? "<span>...</span>" : m.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") }} />
              {m.role === "ai" && m.text !== "..." && isTTSSupported() && (
                <button onClick={() => toggleSpeak(m.text, i)} style={{ marginTop: 4, background: speakingIdx === i ? "rgba(201,168,76,0.15)" : "transparent", border: "0.5px solid " + (speakingIdx === i ? "#C9A84C" : "rgba(255,255,255,0.07)"), borderRadius: 20, padding: "2px 8px", fontSize: 10, color: speakingIdx === i ? "#C9A84C" : "rgba(240,237,230,0.3)", cursor: "pointer" }}>
                  {speakingIdx === i ? "⏹ Stop" : "🔊 Écouter"}
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={msgsEndRef} />
      </div>
      <div style={{ padding: "10px 16px 16px", borderTop: "0.5px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={s.inputBar}>
          <textarea style={s.ci} value={projetChatInput} onChange={e => setProjetChatInput(e.target.value)} placeholder={"Question sur " + projetChat.nom + "..."} rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendProjetChat(); } }} />
          <button style={s.sb} onClick={sendProjetChat} disabled={projetChatLoading}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></button>
        </div>
      </div>
    </div>
  );
}
