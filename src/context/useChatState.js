import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { IAS, DIVISIONS, PROFILS, buildSystemPrompt, getChips } from "../data/constants";
import { streamChat } from "../utils/api";
import { writeMsgCount } from "./useUserState";

export function useChatState({ userType, msgCount, setMsgCount, isPremium, showPaywall, setShowPaywall, profilIA, apiKey, goPageRef }) {
  // ── IA / Chat ─────────────────────────────────────────────────
  const [curDiv, setCurDiv] = useState("M\u00e9tier");
  const [curIA, setCurIA] = useState("coach");
  const [msgs, setMsgs] = useState(() => {
    try { const s = localStorage.getItem("mm_chat_coach"); if (s) { const p = JSON.parse(s); if (p.length) return p; } } catch {}
    return [{ role: "ai", text: "Bonjour ! Je suis votre Coach Expert B\u00e2timent. Quel est votre projet ?" }];
  });
  const [hist, setHist] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────
  const msgsRef = useRef(null);
  const voiceRef = useRef(null);

  // ── Effects ──────────────────────────────────────────────────
  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [msgs]);

  // ── Memos ─────────────────────────────────────────────────────
  const currentIA = useMemo(() => IAS[curIA], [curIA]);
  const chips = useMemo(() => getChips(curIA, userType), [curIA, userType]);

  // ── Conversation helpers ──────────────────────────────────────
  const welcomeMsg = useCallback((iaKey, profile) => {
    const ia = IAS[iaKey];
    const p = PROFILS[profile] || PROFILS["Particulier"];
    if (profile === "Artisan Pro" || profile === "Architecte") {
      return `${p.icon} ${ia.name} \u2014 Mode professionnel. R\u00e9f\u00e9rences DTU, quantitatifs et techniques de mise en oeuvre. Quelle est votre probl\u00e9matique ?`;
    }
    return `${p.icon} Bonjour ! Je suis ${ia.name}. Je m'adapte \u00e0 votre niveau \u2014 de la solution la plus simple \u00e0 la plus compl\u00e8te. Quel est votre projet ?`;
  }, []);

  const saveConv = useCallback((iaKey, messages) => {
    try { localStorage.setItem("mm_chat_" + iaKey, JSON.stringify(messages.slice(-40))); } catch {}
  }, []);

  const loadConv = useCallback((iaKey) => {
    try { const s = localStorage.getItem("mm_chat_" + iaKey); return s ? JSON.parse(s) : null; } catch { return null; }
  }, []);

  const switchDiv = useCallback((div) => {
    saveConv(curIA, msgs);
    setCurDiv(div);
    const firstIA = DIVISIONS[div].ias[0];
    setCurIA(firstIA);
    const saved = loadConv(firstIA);
    setMsgs(saved && saved.length > 0 ? saved : [{ role: "ai", text: welcomeMsg(firstIA, userType) }]);
    setHist([]);
    setErrMsg("");
  }, [curIA, msgs, userType, saveConv, loadConv, welcomeMsg]);

  const switchIA = useCallback((id) => {
    saveConv(curIA, msgs);
    setCurIA(id);
    const div = Object.entries(DIVISIONS).find(([, info]) => info.ias.includes(id));
    if (div) setCurDiv(div[0]);
    const saved = loadConv(id);
    setMsgs(saved && saved.length > 0 ? saved : [{ role: "ai", text: welcomeMsg(id, userType) }]);
    setHist([]);
    setErrMsg("");
  }, [curIA, msgs, userType, saveConv, loadConv, welcomeMsg]);

  // ── Send message ──────────────────────────────────────────────
  const send = useCallback(async () => {
    if (loading || !input.trim()) return;
    const txt = input.trim();
    setInput("");
    setErrMsg("");
    const newMsgs = [...msgs, { role: "user", text: txt }];
    const newHist = [...hist, { role: "user", content: txt }];
    const nc = msgCount + 1; setMsgCount(nc); writeMsgCount(nc);
    if (!isPremium && nc > 0 && nc % 5 === 0) { setMsgs(newMsgs); setShowPaywall(true); return; }
    setMsgs([...newMsgs, { role: "ai", text: "..." }]);
    setLoading(true);
    try {
      const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildSystemPrompt(curIA, userType), messages: newHist.slice(-10) };
      const rep = await streamChat({ apiKey, body, onToken: (partial) => {
        setMsgs([...newMsgs, { role: "ai", text: partial }]);
      }});
      setHist([...newHist, { role: "assistant", content: rep }]);
      const finalMsgs = [...newMsgs, { role: "ai", text: rep }];
      setMsgs(finalMsgs);
      saveConv(curIA, finalMsgs);
    } catch (e) {
      setMsgs(newMsgs);
      setErrMsg(e.message);
    } finally { setLoading(false); }
  }, [loading, input, msgs, hist, msgCount, isPremium, apiKey, curIA, userType, saveConv, setMsgCount, setShowPaywall]);

  const sendWithPhoto = useCallback(async (dataUrl) => {
    if (loading) return;
    const caption = input.trim() || "Analyse cette photo et donne-moi ton expertise.";
    setInput("");
    setErrMsg("");
    const mediaTypePhoto = (dataUrl.split(";")[0].split(":")[1] || "image/jpeg");
    const newMsgs = [...msgs, { role: "user", text: "\uD83D\uDCF7 " + caption }];
    const newHist = [...hist, { role: "user", content: [
      { type: "image", source: { type: "base64", media_type: mediaTypePhoto, data: dataUrl.split(",")[1] } },
      { type: "text", text: caption }
    ]}];
    const nc = msgCount + 1; setMsgCount(nc); writeMsgCount(nc);
    if (!isPremium && nc > 0 && nc % 5 === 0) { setMsgs(newMsgs); setShowPaywall(true); return; }
    setMsgs([...newMsgs, { role: "ai", text: "..." }]);
    setLoading(true);
    try {
      const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildSystemPrompt(curIA, userType), messages: newHist.slice(-10) };
      const rep = await streamChat({ apiKey, body, onToken: (partial) => {
        setMsgs([...newMsgs, { role: "ai", text: partial }]);
      }});
      setHist([...newHist, { role: "assistant", content: rep }]);
      const finalMsgs2 = [...newMsgs, { role: "ai", text: rep }];
      setMsgs(finalMsgs2);
      saveConv(curIA, finalMsgs2);
    } catch (e) {
      setMsgs(newMsgs);
      setErrMsg(e.message);
    } finally { setLoading(false); }
  }, [loading, input, msgs, hist, msgCount, isPremium, apiKey, curIA, userType, saveConv, setMsgCount, setShowPaywall]);

  const rateMsg = useCallback((idx, rating) => {
    let r; try { r = JSON.parse(localStorage.getItem("bl_ratings") || "[]"); } catch { r = []; }
    r.push({ ia: curIA, rating, timestamp: Date.now(), idx });
    localStorage.setItem("bl_ratings", JSON.stringify(r));
    setMsgs(prev => prev.map((m, i) => i === idx ? { ...m, rated: rating } : m));
  }, [curIA]);

  // ── Voice ─────────────────────────────────────────────────────
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Reconnaissance vocale non support\u00e9e sur ce navigateur."); return; }
    if (voiceRef.current) { try { voiceRef.current.abort(); } catch {} }
    const rec = new SR();
    rec.lang = "fr-FR"; rec.continuous = false; rec.interimResults = false;
    voiceRef.current = rec;
    rec.onstart = () => setVoiceActive(true);
    rec.onresult = e => { setInput(prev => prev + (prev ? " " : "") + e.results[0][0].transcript); setVoiceActive(false); };
    rec.onerror = () => setVoiceActive(false);
    rec.onend = () => setVoiceActive(false);
    rec.start();
  }, []);

  // ── Urgence express ───────────────────────────────────────────
  const startUrgence = useCallback((type) => {
    const messages = {
      "GAZ":         "\uD83D\uDD34 URGENCE GAZ \u2014 j'ai une odeur de gaz dans mon logement. Que faire imm\u00e9diatement ?",
      "EAU":         "\uD83D\uDD35 URGENCE EAU \u2014 j'ai une fuite d'eau importante. Que faire maintenant ?",
      "\u00c9LECTRICIT\u00c9": "\u26A1 URGENCE \u00c9LECTRICIT\u00c9 \u2014 odeur de br\u00fbl\u00e9 / court-circuit. Que faire imm\u00e9diatement ?"
    };
    saveConv(curIA, msgs);
    setCurIA("urgence");
    setCurDiv("Diagnostic");
    setMsgs([{ role: "ai", text: "\uD83D\uDEA8 MODE URGENCE ACTIV\u00c9 \u2014 Je vous guide pas \u00e0 pas. Restez calme.\n\nQuelle est votre situation exacte ?" }]);
    setHist([]);
    setInput(messages[type]);
    if (goPageRef.current) goPageRef.current("coach");
  }, [curIA, msgs, saveConv, goPageRef]);

  return {
    curDiv, setCurDiv, curIA, setCurIA, msgs, setMsgs, hist, setHist, input, setInput, loading, errMsg,
    voiceActive,
    msgsRef, voiceRef,
    currentIA, chips,
    switchDiv, switchIA, send, sendWithPhoto, rateMsg,
    startVoice, startUrgence,
    saveConv, loadConv, welcomeMsg,
  };
}
