import { useState, useCallback, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { IAS, DIVISIONS } from "../data/constants";
import { speak, stop, isTTSSupported } from "../utils/tts";
import Tooltip from "./Tooltip";
import s from "../styles/index";

// Format AI text: bold, numbered lists, titles, prices in color
function formatAIText(text) {
  if (!text || text === "...") return "<span>...</span>";
  let html = text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Numbered lists: "1. " or "1) " at start of line
    .replace(/^(\d+)[.)]\s+(.+)$/gm, '<div style="display:flex;gap:6px;margin:3px 0"><span style="color:#C9A84C;font-weight:700;flex-shrink:0">$1.</span><span>$2</span></div>')
    // Bullet lists: "- " or "* " at start of line
    .replace(/^[-*]\s+(.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:#C9A84C">&#8226;</span><span>$1</span></div>')
    // Prices: match patterns like 100€, 1 500€, 100-300€, ~200€
    .replace(/([~]?\d[\d\s]*(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d[\d\s]*(?:[.,]\d+)?)?\s*\u20AC)/g, '<span style="color:#52C37A;font-weight:700">$1</span>')
    // Lines that look like titles (all caps or ending with :)
    .replace(/^([A-Z\u00C0-\u00DC\s]{5,}):?\s*$/gm, '<div style="font-weight:700;color:#C9A84C;margin-top:6px;font-size:11px;letter-spacing:0.5px">$1</div>')
    // Newlines
    .replace(/\n/g, "<br/>");
  return html;
}

export default function CoachPage() {
  const {
    page, goPage, curDiv, curIA, msgs, setMsgs, hist, setHist, input, setInput, loading, errMsg,
    userType, voiceActive, msgCount, isPremium, autoVoice,
    msgsRef, chips,
    switchDiv, switchIA, send, sendWithPhoto, rateMsg,
    startVoice, startUrgence, exportChatPDF, rangColor, saveConv, welcomeMsg, clearHistory, toggleFavori, isFavori,
  } = useApp();

  const [copiedIdx, setCopiedIdx] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const textareaRef = useRef(null);

  // TTS : lire ou arrêter un message
  const toggleSpeak = useCallback((text, idx) => {
    if (speakingIdx === idx) {
      stop();
      setSpeakingIdx(null);
    } else {
      speak(text, () => setSpeakingIdx(idx), () => setSpeakingIdx(null));
    }
  }, [speakingIdx]);

  // Auto-voice : lire la dernière réponse IA automatiquement
  const lastMsgRef = useRef(null);
  useEffect(() => {
    if (!autoVoice || !msgs.length || loading) return;
    const last = msgs[msgs.length - 1];
    if (last.role === "ai" && last.text !== "..." && last.text !== lastMsgRef.current) {
      lastMsgRef.current = last.text;
      speak(last.text, () => setSpeakingIdx(msgs.length - 1), () => setSpeakingIdx(null));
    }
  }, [msgs, loading, autoVoice]);

  // Copy message text to clipboard
  const copyMessage = useCallback(async (text, idx) => {
    try {
      // Strip markdown-like formatting for plain text copy
      const plain = text.replace(/\*\*(.*?)\*\*/g, "$1");
      await navigator.clipboard.writeText(plain);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { /* clipboard may fail on some browsers */ }
  }, []);

  // Auto-resize textarea (max 4 lines)
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineH = 20; // approx line height
    const maxH = lineH * 4;
    ta.style.height = Math.min(ta.scrollHeight, maxH) + "px";
  }, [input]);

  // Message counter for paywall
  const userMsgCount = msgs.filter(m => m.role === "user").length;
  const msgsBeforePaywall = isPremium ? null : (5 - (msgCount % 5));

  return (
    <div style={{ ...s.page, ...(page === "coach" ? s.pageActive : {}) }}>
      <div style={s.wrap}>
        <div style={s.aiHdr}>
          <div style={{ ...s.aiAv, background: IAS[curIA]?.color + "33", border: "0.5px solid " + IAS[curIA]?.color + "66" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IAS[curIA]?.color} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700 }}>{IAS[curIA]?.name}</div>
              <span style={{ ...s.rangBadge, background: rangColor(IAS[curIA]?.rang) + "22", color: rangColor(IAS[curIA]?.rang), border: "0.5px solid " + rangColor(IAS[curIA]?.rang) + "66" }}>{IAS[curIA]?.rang}</span>
            </div>
            <div style={{ fontSize: 10, color: IAS[curIA]?.color, display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: IAS[curIA]?.color }}></div>
              {IAS[curIA]?.st}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Message counter badge */}
            {!isPremium && (
              <div style={{ padding: "3px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: msgsBeforePaywall <= 1 ? "rgba(224,82,82,0.12)" : "rgba(201,168,76,0.1)", color: msgsBeforePaywall <= 1 ? "#E05252" : "#C9A84C", border: "0.5px solid " + (msgsBeforePaywall <= 1 ? "rgba(224,82,82,0.3)" : "rgba(201,168,76,0.25)") }}>
                {msgsBeforePaywall}/5
              </div>
            )}
            {msgs.length > 1 && <button onClick={exportChatPDF} title="Exporter en PDF" style={{ background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.3)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
            </button>}
            {msgs.length > 1 && <button onClick={() => { if (window.confirm("Effacer cette conversation ?")) clearHistory(curIA); }} title="Effacer la conversation" style={{ background: "rgba(224,82,82,0.06)", border: "0.5px solid rgba(224,82,82,0.25)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
            </button>}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={s.divSel}>
            {Object.entries(DIVISIONS).map(([div, info]) => (
              <button key={div} style={curDiv === div ? { ...s.divPill, background: info.color + "22", color: info.color, border: "0.5px solid " + info.color + "66" } : s.divPill} onClick={() => switchDiv(div)}>{div}</button>
            ))}
          </div>
          <Tooltip id="coach-divisions" text="Choisissez une division IA spécialisée ici" />
        </div>
        <div style={s.iaSel}>
          {DIVISIONS[curDiv].ias.map(k => (
            <button key={k} style={curIA === k ? s.iapOn : s.iap} onClick={() => switchIA(k)}>{IAS[k].name.replace("IA ", "")}</button>
          ))}
        </div>
        <div style={s.chips}>
          {chips.map(c => (
            <div key={c} className="bl-chip" style={s.chip} onClick={() => setInput(c)}>{c}</div>
          ))}
        </div>
        <div style={s.msgs} ref={msgsRef}>
          {msgs.map((m, i) => (
            <div key={i} className="bl-msg" style={{ ...m.role === "ai" ? s.msgA : s.msgU, animationDelay: i === msgs.length - 1 ? "0ms" : `${Math.min(i * 30, 120)}ms` }}>
              <div style={s.mav}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round">
                  {m.role === "ai" ? <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> : <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>}
                </svg>
              </div>
              <div style={{ maxWidth: "88%" }}>
                <div className={m.role === "ai" && m.text !== "..." && loading && i === msgs.length - 1 ? "streaming-cursor" : ""} style={m.role === "ai" ? s.bubA : s.bubU} dangerouslySetInnerHTML={{ __html: m.text === "..." ? '<div class="mm-skeleton" style="height:14px;width:60%;margin-bottom:6px"></div><div class="mm-skeleton" style="height:14px;width:80%"></div>' : formatAIText(m.text) }} />
                {m.role === "ai" && m.text !== "..." && <div style={{ display: "flex", gap: 6, marginTop: 5, paddingLeft: 2 }}>
                  {isTTSSupported() && <button onClick={() => toggleSpeak(m.text, i)} style={{ background: speakingIdx === i ? "rgba(201,168,76,0.15)" : "transparent", border: "0.5px solid " + (speakingIdx === i ? "#C9A84C" : "rgba(255,255,255,0.07)"), borderRadius: 20, padding: "2px 8px", fontSize: 10, color: speakingIdx === i ? "#C9A84C" : "rgba(240,237,230,0.3)", cursor: "pointer", transition: "all 0.2s", animation: speakingIdx === i ? "voicePulse 1.2s ease-in-out infinite" : "none" }}>
                    {speakingIdx === i ? "⏹ Stop" : "🔊 Écouter"}
                  </button>}
                  <button onClick={() => copyMessage(m.text, i)} style={{ background: copiedIdx === i ? "rgba(82,195,122,0.15)" : "transparent", border: "0.5px solid " + (copiedIdx === i ? "#52C37A" : "rgba(255,255,255,0.07)"), borderRadius: 20, padding: "2px 8px", fontSize: 10, color: copiedIdx === i ? "#52C37A" : "rgba(240,237,230,0.3)", cursor: "pointer", transition: "all 0.2s" }}>
                    {copiedIdx === i ? "\u2713 Copie" : "\u{1F4CB} Copier"}
                  </button>
                  <button onClick={() => rateMsg(i, 1)} style={{ background: m.rated === 1 ? "rgba(82,195,122,0.15)" : "transparent", border: "0.5px solid " + (m.rated === 1 ? "#52C37A" : "rgba(255,255,255,0.07)"), borderRadius: 20, padding: "2px 8px", fontSize: 11, color: m.rated === 1 ? "#52C37A" : "rgba(240,237,230,0.3)", cursor: "pointer" }}>{"\u{1F44D}"}</button>
                  <button onClick={() => rateMsg(i, -1)} style={{ background: m.rated === -1 ? "rgba(224,82,82,0.12)" : "transparent", border: "0.5px solid " + (m.rated === -1 ? "#E05252" : "rgba(255,255,255,0.07)"), borderRadius: 20, padding: "2px 8px", fontSize: 11, color: m.rated === -1 ? "#E05252" : "rgba(240,237,230,0.3)", cursor: "pointer" }}>{"\u{1F44E}"}</button>
                  <button onClick={() => toggleFavori(m, curIA)} style={{ background: isFavori(m.text, curIA) ? "rgba(201,168,76,0.15)" : "transparent", border: "0.5px solid " + (isFavori(m.text, curIA) ? "#C9A84C" : "rgba(255,255,255,0.07)"), borderRadius: 20, padding: "2px 8px", fontSize: 11, color: isFavori(m.text, curIA) ? "#C9A84C" : "rgba(240,237,230,0.3)", cursor: "pointer" }}>{isFavori(m.text, curIA) ? "★" : "☆"}</button>
                </div>}
              </div>
            </div>
          ))}
        </div>
        {errMsg && <div style={s.errBox}>{errMsg}</div>}
        {msgs.length <= 1 && (
          <div className="stagger-enter" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[
              { label: "Photo diagnostic", sub: "Diagnostic visuel", color: "#5290E0", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5290E0" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, action: () => document.querySelector('input[type=file]')?.click() },
              { label: "Question vocale", sub: "Parlez à l'IA", color: "#52C37A", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#52C37A" strokeWidth="1.8" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>, action: startVoice },
              { label: "Calculer", sub: "Matériaux & coûts", color: "#E8873A", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8873A" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>, action: () => goPage("outils") },
              { label: "Urgence", sub: "Aide immédiate", color: "#E05252", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E05252" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, action: () => startUrgence("GAZ") },
            ].map((a, i) => (
              <div key={i} className="liquid-glass" onClick={a.action} style={{ background: a.color + "08", border: "0.5px solid " + a.color + "22", borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: a.color + "12", border: "0.5px solid " + a.color + "28", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>{a.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(240,237,230,0.85)", fontFamily: "'Syne',sans-serif" }}>{a.label}</div>
                <div style={{ fontSize: 9, color: "rgba(240,237,230,0.35)", marginTop: 2 }}>{a.sub}</div>
              </div>
            ))}
          </div>
        )}
        <div style={s.inputBar}>
          <textarea ref={textareaRef} style={{ ...s.ci, overflow: "hidden", maxHeight: 80 }} value={input} onChange={e => setInput(e.target.value)} placeholder={"Demandez \u00E0 " + IAS[curIA]?.name + "..."} rows={1} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button onClick={startVoice} title="Parler \u00E0 l'IA" style={{ width: 44, height: 44, borderRadius: "50%", border: "0.5px solid " + (voiceActive ? "rgba(224,82,82,0.6)" : "rgba(201,168,76,0.22)"), background: voiceActive ? "rgba(224,82,82,0.15)" : "rgba(201,168,76,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: voiceActive ? "voicePulse 0.8s ease-in-out infinite" : "none" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={voiceActive ? "#E05252" : "#C9A84C"} strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
          </button>
          <label style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(201,168,76,0.08)", border: "0.5px solid rgba(201,168,76,0.22)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }} title="Envoyer une photo \u00E0 cette IA">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
            <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = ev => sendWithPhoto(ev.target.result); r.readAsDataURL(f); e.target.value = ""; }} />
          </label>
          <button style={s.sb} onClick={send} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
