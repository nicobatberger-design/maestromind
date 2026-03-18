import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import { IAS, DIVISIONS, PROFILS, buildSystemPrompt, getChips, PDG_PIN_HASH } from "../data/constants";
import { apiURL, apiHeaders, withRetry, hashPin } from "../utils/api";

const IS_DEV = import.meta.env.DEV;

const ROUTE_TO_PAGE = { "/": "home", "/coach": "coach", "/scanner": "scanner", "/shop": "shop", "/cert": "cert", "/outils": "outils", "/projets": "projets" };
const PAGE_TO_ROUTE = { home: "/", coach: "/coach", scanner: "/scanner", shop: "/shop", cert: "/cert", outils: "/outils", projets: "/projets" };

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Navigation ────────────────────────────────────────────────
  const [page, setPage] = useState(() => ROUTE_TO_PAGE[location.pathname] || "home");

  // Sync URL → page state
  useEffect(() => {
    const p = ROUTE_TO_PAGE[location.pathname];
    if (p && p !== page) setPage(p);
  }, [location.pathname]);

  // ── API key (dev only) ────────────────────────────────────────
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("maestromind_key") || "");
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyErr, setKeyErr] = useState("");

  // ── IA / Chat ─────────────────────────────────────────────────
  const [curDiv, setCurDiv] = useState("Métier");
  const [curIA, setCurIA] = useState("coach");
  const [msgs, setMsgs] = useState([{ role: "ai", text: "Bonjour ! Je suis votre Coach Expert Bâtiment. Quel est votre projet ?" }]);
  const [hist, setHist] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // ── Boutique ──────────────────────────────────────────────────
  const [store, setStore] = useState("leroy");

  // ── DPE ───────────────────────────────────────────────────────
  const [dpeS, setDpeS] = useState(75);
  const [dpeT, setDpeT] = useState("Appartement");
  const [dpeC, setDpeC] = useState("Gaz naturel");
  const [dpeRes, setDpeRes] = useState(null);

  // ── Scanner ───────────────────────────────────────────────────
  const [camActive, setCamActive] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanIA, setScanIA] = useState("diag");
  const [scannerTab, setScannerTab] = useState("photo");

  // ── AR ────────────────────────────────────────────────────────
  const [arModeType, setArModeType] = useState("etagere");
  const [arAnchor, setArAnchor] = useState(null);
  const [arTilt, setArTilt] = useState({ beta: 0, gamma: 0 });
  const [arShelfType, setArShelfType] = useState("flottante");
  const [showArAdvisor, setShowArAdvisor] = useState(false);
  const [arAdvInput, setArAdvInput] = useState("");
  const [arAdvResult, setArAdvResult] = useState(null);
  const [arAdvLoading, setArAdvLoading] = useState(false);

  // ── Certificat ────────────────────────────────────────────────
  const [certProjet, setCertProjet] = useState("Cloison BA13");
  const [certNorme, setCertNorme] = useState("DTU 25.41 — Cloisons plâtre");
  const [certSurface, setCertSurface] = useState("10");
  const [certProp, setCertProp] = useState("");
  const [certArtisan, setCertArtisan] = useState("");

  // ── Auth / Onboarding ─────────────────────────────────────────
  const [rgpdOk, setRgpdOk] = useState(() => localStorage.getItem("rgpd_accepted") === "1");
  const [msgCount, setMsgCount] = useState(() => parseInt(localStorage.getItem("bl_msg_count") || "0"));
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPremium] = useState(() => localStorage.getItem("bl_premium") === "1");
  const [onboardingDone, setOnboardingDone] = useState(() => localStorage.getItem("bl_onboarded") === "1");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userType, setUserType] = useState(() => localStorage.getItem("bl_user_type") || "Particulier");
  const [pdgUnlocked, setPdgUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // ── Outils ────────────────────────────────────────────────────
  const [toolTab, setToolTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "devis";
  });
  const [devisText, setDevisText] = useState("");
  const [devisResult, setDevisResult] = useState(null);
  const [devisLoading, setDevisLoading] = useState(false);
  const [calcType, setCalcType] = useState("Peinture");
  const [calcSurface, setCalcSurface] = useState("20");
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [artisanNom, setArtisanNom] = useState("");
  const [artisanSpec, setArtisanSpec] = useState("Maçonnerie");
  const [artisanResult, setArtisanResult] = useState(null);
  const [artisanLoading, setArtisanLoading] = useState(false);
  const [primesRev, setPrimesRev] = useState("Modeste");
  const [primesTrav, setPrimesTrav] = useState("Isolation combles");
  const [primesSurf, setPrimesSurf] = useState("80");
  const [primesResult, setPrimesResult] = useState(null);
  const [primesLoading, setPrimesLoading] = useState(false);
  const [counterDevis, setCounterDevis] = useState(null);
  const [counterLoading, setCounterLoading] = useState(false);
  const [planningType, setPlanningType] = useState("Rénovation salle de bain");
  const [planningBudget, setPlanningBudget] = useState("5000");
  const [planningResult, setPlanningResult] = useState(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [devisProDesc, setDevisProDesc] = useState("");
  const [devisProClient, setDevisProClient] = useState("");
  const [devisProSurface, setDevisProSurface] = useState("20");
  const [devisProResult, setDevisProResult] = useState(null);
  const [devisProLoading, setDevisProLoading] = useState(false);
  const [rentaSurface, setRentaSurface] = useState("50");
  const [rentaTaux, setRentaTaux] = useState("45");
  const [rentaMat, setRentaMat] = useState("3000");
  const [rentaDep, setRentaDep] = useState("150");
  const [rentaResult, setRentaResult] = useState(null);

  // ── Projets ───────────────────────────────────────────────────
  const [projets, setProjets] = useState(() => { try { return JSON.parse(localStorage.getItem("bl_projets") || "[]"); } catch { return []; } });
  const [projetNom, setProjetNom] = useState("");
  const [projetType, setProjetType] = useState("Rénovation");
  const [projetNotes, setProjetNotes] = useState("");
  const [projetChat, setProjetChat] = useState(null);
  const [projetChatMsgs, setProjetChatMsgs] = useState([]);
  const [projetChatInput, setProjetChatInput] = useState("");
  const [projetChatLoading, setProjetChatLoading] = useState(false);
  const [crLoading, setCrLoading] = useState(false);

  // ── Vocal ─────────────────────────────────────────────────────
  const [voiceActive, setVoiceActive] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────
  const msgsRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const arVideoRef = useRef(null);
  const arCanvasRef = useRef(null);
  const arAnimRef = useRef(null);
  const arFrameRef = useRef(0);
  const streamRef = useRef(null);
  const arAnchorRef = useRef(null);
  const arModeRef = useRef("etagere");
  const arTiltRef = useRef({ beta: 0, gamma: 0 });
  const arShelfTypeRef = useRef("flottante");
  const voiceRef = useRef(null);

  // ── Effects ───────────────────────────────────────────────────
  useEffect(() => { if (IS_DEV && !apiKey) setShowKey(true); }, [apiKey]);
  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [msgs]);

  useEffect(() => {
    const handler = (e) => {
      const t = { beta: e.beta || 0, gamma: e.gamma || 0 };
      arTiltRef.current = t;
      setArTilt(t);
    };
    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  useEffect(() => { arAnchorRef.current = arAnchor; }, [arAnchor]);
  useEffect(() => { arModeRef.current = arModeType; }, [arModeType]);
  useEffect(() => { arShelfTypeRef.current = arShelfType; }, [arShelfType]);

  useEffect(() => {
    if (streamRef.current) {
      if (videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      if (arVideoRef.current && !arVideoRef.current.srcObject) {
        arVideoRef.current.srcObject = streamRef.current;
        arVideoRef.current.play().catch(() => {});
      }
    }
  }, [scannerTab, page]);

  // ── Memos ─────────────────────────────────────────────────────
  const currentIA = useMemo(() => IAS[curIA], [curIA]);
  const chips = useMemo(() => getChips(curIA, userType), [curIA, userType]);

  // ── Helpers ───────────────────────────────────────────────────
  const profilIA = useCallback(() => ({
    "Particulier":  "PROFIL UTILISATEUR : Particulier / non-professionnel. Langage simple et accessible, pas de jargon sans explication. Indiquer quand il faut impérativement faire appel à un professionnel.",
    "Artisan Pro":  "PROFIL UTILISATEUR : Professionnel du bâtiment / artisan qualifié. Langage technique complet, références DTU obligatoires (numéro + paragraphe), quantitatifs précis, normes de mise en œuvre, responsabilité décennale.",
    "Architecte":   "PROFIL UTILISATEUR : Architecte / Maître d'œuvre. Prescriptions techniques de conception, coordination inter-corps d'état, réglementation ERP/PMR, aspects administratifs (permis, AT, assurances MOE).",
    "Investisseur": "PROFIL UTILISATEUR : Investisseur immobilier. Focus ROI et valorisation du bien, estimations en €/m², impact sur la valeur locative/vénale, optimisation des aides financières cumulables.",
  }[userType] || ""), [userType]);

  const profilPDFLabel = useCallback(() => ({
    "Particulier":  "Document Particulier",
    "Artisan Pro":  "Document Professionnel",
    "Architecte":   "Document Maître d'Œuvre",
    "Investisseur": "Rapport Investisseur",
  }[userType] || "Document MAESTROMIND"), [userType]);

  const rangColor = (rang) => {
    if (rang === "Général") return "#C9A84C";
    if (rang === "Colonel") return "#52C37A";
    if (rang === "Capitaine") return "#5290E0";
    return "#888780";
  };

  // ── Conversation helpers ──────────────────────────────────────
  const welcomeMsg = useCallback((iaKey, profile) => {
    const ia = IAS[iaKey];
    const p = PROFILS[profile] || PROFILS["Particulier"];
    if (profile === "Artisan Pro" || profile === "Architecte") {
      return `${p.icon} ${ia.name} — Mode professionnel. Références DTU, quantitatifs et techniques de mise en oeuvre. Quelle est votre problématique ?`;
    }
    return `${p.icon} Bonjour ! Je suis ${ia.name}. Je m'adapte à votre niveau — de la solution la plus simple à la plus complète. Quel est votre projet ?`;
  }, []);

  const saveConv = useCallback((iaKey, messages) => {
    try { localStorage.setItem("mm_chat_" + iaKey, JSON.stringify(messages.slice(-40))); } catch {}
  }, []);

  const loadConv = useCallback((iaKey) => {
    try { const s = localStorage.getItem("mm_chat_" + iaKey); return s ? JSON.parse(s) : null; } catch { return null; }
  }, []);

  // ── Navigation ────────────────────────────────────────────────
  const goPage = useCallback((p) => {
    if (page === "scanner" && p !== "scanner") {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCamActive(false);
    }
    setPage(p);
    const route = PAGE_TO_ROUTE[p] || "/";
    if (location.pathname !== route) navigate(route);
    if (p === "coach") {
      setMsgs([{ role: "ai", text: welcomeMsg(curIA, userType) }]);
      setHist([]);
      setErrMsg("");
    }
  }, [page, curIA, userType, welcomeMsg, navigate, location.pathname]);

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

  // ── API key activation (dev) ──────────────────────────────────
  const activerIA = useCallback(() => {
    if (!keyInput.startsWith("sk-ant")) { setKeyErr("Clé invalide — doit commencer par sk-ant-"); return; }
    setKeyErr("");
    setApiKey(keyInput);
    localStorage.setItem("maestromind_key", keyInput);
    setShowKey(false);
  }, [keyInput]);

  // ── Send message ──────────────────────────────────────────────
  const send = useCallback(async () => {
    if (loading || !input.trim()) return;
    const txt = input.trim();
    setInput("");
    setErrMsg("");
    const newMsgs = [...msgs, { role: "user", text: txt }];
    const newHist = [...hist, { role: "user", content: txt }];
    const nc = msgCount + 1; setMsgCount(nc); localStorage.setItem("bl_msg_count", nc);
    if (!isPremium && nc > 0 && nc % 5 === 0) { setMsgs(newMsgs); setShowPaywall(true); return; }
    setMsgs([...newMsgs, { role: "ai", text: "..." }]);
    setLoading(true);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildSystemPrompt(curIA, userType), messages: newHist.slice(-10) }),
      }));
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rep = data.content[0].text || "Désolé, réessayez.";
      setHist([...newHist, { role: "assistant", content: rep }]);
      const finalMsgs = [...newMsgs, { role: "ai", text: rep }];
      setMsgs(finalMsgs);
      saveConv(curIA, finalMsgs);
    } catch (e) {
      setMsgs(newMsgs);
      setErrMsg(e.message);
    } finally { setLoading(false); }
  }, [loading, input, msgs, hist, msgCount, isPremium, apiKey, curIA, userType, saveConv]);

  const sendWithPhoto = useCallback(async (dataUrl) => {
    const caption = input.trim() || "Analyse cette photo et donne-moi ton expertise.";
    setInput("");
    setErrMsg("");
    const mediaTypePhoto = (dataUrl.split(";")[0].split(":")[1] || "image/jpeg");
    const newMsgs = [...msgs, { role: "user", text: "📷 " + caption }];
    const newHist = [...hist, { role: "user", content: [
      { type: "image", source: { type: "base64", media_type: mediaTypePhoto, data: dataUrl.split(",")[1] } },
      { type: "text", text: caption }
    ]}];
    const nc = msgCount + 1; setMsgCount(nc); localStorage.setItem("bl_msg_count", nc);
    if (!isPremium && nc > 0 && nc % 5 === 0) { setMsgs(newMsgs); setShowPaywall(true); return; }
    setMsgs([...newMsgs, { role: "ai", text: "..." }]);
    setLoading(true);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildSystemPrompt(curIA, userType), messages: newHist.slice(-10) }),
      }));
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const rep = data.content[0].text || "Désolé, réessayez.";
      setHist([...newHist, { role: "assistant", content: rep }]);
      const finalMsgs2 = [...newMsgs, { role: "ai", text: rep }];
      setMsgs(finalMsgs2);
      saveConv(curIA, finalMsgs2);
    } catch (e) {
      setMsgs(newMsgs);
      setErrMsg(e.message);
    } finally { setLoading(false); }
  }, [input, msgs, hist, msgCount, isPremium, apiKey, curIA, userType, saveConv]);

  const rateMsg = useCallback((idx, rating) => {
    let r; try { r = JSON.parse(localStorage.getItem("bl_ratings") || "[]"); } catch { r = []; }
    r.push({ ia: curIA, rating, timestamp: Date.now(), idx });
    localStorage.setItem("bl_ratings", JSON.stringify(r));
    setMsgs(prev => prev.map((m, i) => i === idx ? { ...m, rated: rating } : m));
  }, [curIA]);

  // ── Camera ────────────────────────────────────────────────────
  const ouvrirCamera = useCallback(async () => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      if (arVideoRef.current) { arVideoRef.current.srcObject = stream; arVideoRef.current.play().catch(() => {}); }
      setCamActive(true);
      setPhotoUrl(null);
      setScanResult(null);
    } catch (e) {
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, []);

  const prendrePhoto = useCallback(() => {
    if (!camActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotoUrl(dataUrl);
    setCamActive(false);
    if (scannerTab !== "ar") {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    analyserPhoto(dataUrl);
  }, [camActive, scannerTab]);

  const importerPhoto = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setPhotoUrl(ev.target.result); analyserPhoto(ev.target.result); };
    reader.readAsDataURL(file);
  }, []);

  const analyserPhoto = useCallback(async (dataUrl, iaKey) => {
    setScanLoading(true);
    setScanResult(null);
    const ia = iaKey || scanIA;
    const base64 = dataUrl.split(",")[1];
    const mediaType = (dataUrl.split(";")[0].split(":")[1] || "image/jpeg");
    const sysScan = IAS[ia].sys + " Analyse la photo fournie et réponds UNIQUEMENT en JSON valide (aucun texte hors JSON) : {\"urgence\":\"MODERE\",\"titre\":\"Titre court\",\"etapes\":[\"etape 1\",\"etape 2\",\"etape 3\"],\"materiaux\":[\"Matériau identifié\"],\"cout_estime\":\"100-300€\",\"delai\":\"1-2 jours\",\"reference_dtu\":\"DTU XX.X\",\"conseils_pro\":\"Conseil clé\"}. Urgences : BAS, MODERE, URGENT, DANGER.";
    try {
      const r = await fetch(apiURL(), {
        method: "POST",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: sysScan,
          messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "Analyse ce problème de bâtiment." }] }]
        }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      const txt = data.content[0].text.replace(/```json|```/g, "").trim();
      setScanResult(JSON.parse(txt));
    } catch (e) {
      setScanResult({ urgence: "ERREUR", titre: "Analyse impossible", etapes: [e.message] });
    } finally { setScanLoading(false); }
  }, [apiKey, scanIA]);

  // ── Voice ─────────────────────────────────────────────────────
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Reconnaissance vocale non supportée sur ce navigateur."); return; }
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
      "GAZ":         "🔴 URGENCE GAZ — j'ai une odeur de gaz dans mon logement. Que faire immédiatement ?",
      "EAU":         "🔵 URGENCE EAU — j'ai une fuite d'eau importante. Que faire maintenant ?",
      "ÉLECTRICITÉ": "⚡ URGENCE ÉLECTRICITÉ — odeur de brûlé / court-circuit. Que faire immédiatement ?"
    };
    saveConv(curIA, msgs);
    setCurIA("urgence");
    setCurDiv("Diagnostic");
    setMsgs([{ role: "ai", text: "🚨 MODE URGENCE ACTIVÉ — Je vous guide pas à pas. Restez calme.\n\nQuelle est votre situation exacte ?" }]);
    setHist([]);
    setInput(messages[type]);
    goPage("coach");
  }, [curIA, msgs, saveConv, goPage]);

  // ── PIN ───────────────────────────────────────────────────────
  const handlePin = useCallback((d) => {
    if (pinInput.length >= 6) return;
    const np = pinInput + d;
    setPinInput(np);
    setPinError("");
    if (np.length === 6) {
      hashPin(np).then(hash => {
        if (hash === PDG_PIN_HASH) { setPdgUnlocked(true); }
        else { setTimeout(() => { setPinInput(""); setPinError("Code incorrect — réessayez"); }, 400); }
      });
    }
  }, [pinInput]);

  const handlePinDel = useCallback(() => { setPinInput(p => p.slice(0, -1)); setPinError(""); }, []);

  // ── Outils ────────────────────────────────────────────────────
  const analyserDevis = useCallback(async () => {
    if (!devisText.trim()) return;
    setDevisLoading(true); setDevisResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `${profilIA()}\nTu es un expert en tarifs de travaux en France 2025. Analyse ce devis et réponds UNIQUEMENT en JSON valide : {"verdict":"CORRECT","resume":"1 phrase synthèse","points":["point 1","point 2","point 3"],"conseil":"conseil pratique"}. Verdict possible : CORRECT, ÉLEVÉ, SUSPECT.`,
          messages: [{ role: "user", content: "Analyse ce devis :\n\n" + devisText }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setDevisResult(JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch (e) { setDevisResult({ verdict: "ERREUR", resume: e.message, points: [], conseil: "" }); }
    finally { setDevisLoading(false); }
  }, [devisText, apiKey, profilIA]);

  const genererContreDevis = useCallback(async () => {
    if (!devisResult || !devisText.trim()) return;
    setCounterLoading(true); setCounterDevis(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1400,
          system: `Tu es un expert en négociation de travaux en France. ${profilIA()} Génère un contre-devis argumenté. Réponds UNIQUEMENT en JSON valide : {"lignes":[{"poste":"nom","prix_demande":"X€","prix_negocie":"X€","argument":"court argument"}],"economie_totale":"X€","message_negociation":"message poli à envoyer à l artisan en 2-3 phrases","conseil":"conseil final"}`,
          messages: [{ role: "user", content: "Devis original :\n" + devisText + "\n\nAnalyse :\n" + JSON.stringify(devisResult) + "\n\nGénère le contre-devis." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setCounterDevis(JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch (e) { setCounterDevis({ lignes: [], economie_totale: "0€", message_negociation: e.message, conseil: "" }); }
    finally { setCounterLoading(false); }
  }, [devisResult, devisText, apiKey, profilIA]);

  const calculerMateriaux = useCallback(async () => {
    setCalcLoading(true); setCalcResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 900,
          system: `${profilIA()}\nTu es un expert en quantitatifs matériaux France. Réponds UNIQUEMENT en JSON valide : {"materiaux":[{"nom":"Produit","quantite":"X unités","prixEstime":"X€","conseil":"marque/ref"}],"total":"X€","conseil":"conseil pratique"}`,
          messages: [{ role: "user", content: `Calcule les matériaux pour ${calcType} sur ${calcSurface}m². Inclus pertes standards. Prix marché France 2025. Produits disponibles Leroy Merlin/Castorama.` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setCalcResult(JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch (e) { setCalcResult({ materiaux: [], total: "0€", conseil: e.message }); }
    finally { setCalcLoading(false); }
  }, [apiKey, profilIA, calcType, calcSurface]);

  const calculerPrimes = useCallback(async () => {
    setPrimesLoading(true); setPrimesResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `${profilIA()}\nTu es un expert en aides rénovation France 2025 (MaPrimeRénov', CEE, éco-PTZ, TVA 5.5%, Anah). Réponds UNIQUEMENT en JSON valide : {"aides":[{"nom":"Aide","montant":"X€","condition":"condition courte","demarche":"comment faire en 1 phrase"}],"total":"X€","conseil":"conseil pratique","attention":"point important"}`,
          messages: [{ role: "user", content: `Foyer ${primesRev}, travaux : ${primesTrav}, surface : ${primesSurf}m². Quelles aides suis-je éligible en 2025 ?` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setPrimesResult(JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch (e) { setPrimesResult({ aides: [], total: "0€", conseil: e.message, attention: "" }); }
    finally { setPrimesLoading(false); }
  }, [apiKey, profilIA, primesRev, primesTrav, primesSurf]);

  const verifierArtisan = useCallback(async () => {
    if (!artisanNom.trim()) return;
    setArtisanLoading(true); setArtisanResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 900,
          system: `${profilIA()}\nTu es un expert en vérification d'artisans RGE France. Génère une checklist complète. Réponds UNIQUEMENT en JSON valide : {"checks":[{"label":"Vérification","comment":"comment vérifier","url":"site officiel ou vide"}],"alertes":["alerte 1"],"conseils":"conseil global"}`,
          messages: [{ role: "user", content: `Je veux vérifier l'artisan "${artisanNom}" spécialisé en ${artisanSpec}. Checklist de vérification RGE, assurance décennale, existence légale.` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setArtisanResult(JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch (e) { setArtisanResult({ checks: [], alertes: [e.message], conseils: "" }); }
    finally { setArtisanLoading(false); }
  }, [apiKey, profilIA, artisanNom, artisanSpec]);

  const planifierChantier = useCallback(async () => {
    setPlanningLoading(true); setPlanningResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1400,
          system: `Tu es expert en planification de chantier. ${profilIA()} Réponds UNIQUEMENT en JSON valide : {"duree_totale":"X semaines","semaines":[{"numero":1,"titre":"Titre court","taches":["tâche 1","tâche 2"],"materiaux_a_commander":["matériau 1"],"attention":"point critique"}],"ordre_metiers":["1. Corps de métier"],"conseils":"conseil global","budget_detail":"répartition budget"}`,
          messages: [{ role: "user", content: "Projet : " + planningType + ", budget " + planningBudget + "€. Planning complet semaine par semaine." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setPlanningResult(JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch (e) { setPlanningResult({ duree_totale: "?", semaines: [], ordre_metiers: [], conseils: e.message, budget_detail: "" }); }
    finally { setPlanningLoading(false); }
  }, [apiKey, profilIA, planningType, planningBudget]);

  const genererDevisPro = useCallback(async () => {
    if (!devisProDesc.trim()) return;
    setDevisProLoading(true); setDevisProResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1600,
          system: `Tu es expert en rédaction de devis travaux France 2025. ${profilIA()} Génère un devis professionnel. Réponds UNIQUEMENT en JSON valide : {"lignes":[{"description":"description précise","unite":"m² ou U ou ml ou forfait","quantite":"X","prix_unitaire":"X€","total":"X€","dtu":"DTU ou norme ou vide"}],"sous_total_ht":"X€","tva_taux":"10%","tva":"X€","total_ttc":"X€","validite":"30 jours","garanties":"décennale 10 ans + parfait achèvement 1 an","mentions":"TVA applicable selon art. 279-0 bis du CGI"}`,
          messages: [{ role: "user", content: "Travaux : " + devisProDesc + "\nSurface : " + devisProSurface + "m²\nClient : " + (devisProClient || "À compléter") + "\nGénère le devis complet prix France 2025." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setDevisProResult(JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch (e) { setDevisProResult({ lignes: [], sous_total_ht: "0€", tva_taux: "10%", tva: "0€", total_ttc: "0€", validite: "30 jours", garanties: "", mentions: "" }); }
    finally { setDevisProLoading(false); }
  }, [apiKey, profilIA, devisProDesc, devisProSurface, devisProClient]);

  const calculerRentabilite = useCallback(() => {
    const surf = parseFloat(rentaSurface) || 0, taux = parseFloat(rentaTaux) || 0;
    const mat = parseFloat(rentaMat) || 0, dep = parseFloat(rentaDep) || 0;
    const heures = surf * 2.5, mo = heures * taux;
    const ca_total = mo + mat + dep;
    const charges = mo * 0.45;
    const benef = ca_total - mat - dep - charges;
    const marge = ca_total > 0 ? Math.round((benef / ca_total) * 100) : 0;
    setRentaResult({ heures: Math.round(heures), mo: Math.round(mo), ca_total: Math.round(ca_total), charges: Math.round(charges), benef: Math.round(benef), marge, prix_m2: surf > 0 ? Math.round(ca_total / surf) : 0 });
  }, [rentaSurface, rentaTaux, rentaMat, rentaDep]);

  const calcDPE = useCallback(() => {
    const prime = Math.round(dpeS * 45 + 2000);
    const cee = Math.round(dpeS * 18);
    setDpeRes({ prime, cee, total: prime + cee, eco: Math.round(dpeS * 4.2) });
  }, [dpeS]);

  // ── AR advisor ────────────────────────────────────────────────
  const suggestShelf = useCallback(async () => {
    if (!arAdvInput.trim()) return;
    setArAdvLoading(true); setArAdvResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600,
          system: `Tu es un expert en décoration et aménagement intérieur. L'utilisateur décrit sa pièce ou son mur. Recommande le type d'étagère le plus adapté PARMI : flottante, industrielle, angle, console, cube. Réponds UNIQUEMENT en JSON valide : {"type":"flottante","raison":"courte explication","dimensions":"L x H recommandés","produit":"nom produit précis","prix":"fourchette","ou":"enseigne (Leroy Merlin, IKEA ou Castorama)","url_keyword":"terme de recherche pour trouver le produit","conseils":"1 conseil pratique d'installation"}`,
          messages: [{ role: "user", content: arAdvInput }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      const res = JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
      setArAdvResult(res);
      if (res.type) { setArShelfType(res.type); arShelfTypeRef.current = res.type; }
    } catch (e) { setArAdvResult({ type: "flottante", raison: e.message, dimensions: "", produit: "", prix: "", ou: "", url_keyword: "", conseils: "" }); }
    finally { setArAdvLoading(false); }
  }, [apiKey, arAdvInput]);

  // ── Projets ───────────────────────────────────────────────────
  const ajouterProjet = useCallback(() => {
    if (!projetNom.trim()) return;
    const p = { id: Date.now(), nom: projetNom, type: projetType, notes: projetNotes, date: new Date().toLocaleDateString("fr-FR"), statut: "En cours" };
    const np = [p, ...projets]; setProjets(np); localStorage.setItem("bl_projets", JSON.stringify(np));
    setProjetNom(""); setProjetNotes("");
  }, [projetNom, projetType, projetNotes, projets]);

  const supprimerProjet = useCallback((id) => {
    const np = projets.filter(p => p.id !== id); setProjets(np); localStorage.setItem("bl_projets", JSON.stringify(np));
  }, [projets]);

  const ouvrirProjetChat = useCallback((p) => {
    setProjetChat(p);
    setProjetChatMsgs([{ role: "ai", text: "🏗 Je connais votre projet \"" + p.nom + "\" (" + p.type + "). " + (p.notes ? "Notes : " + p.notes + " — " : "") + "Posez-moi toutes vos questions sur ce chantier." }]);
    setProjetChatInput("");
  }, []);

  const sendProjetChat = useCallback(async () => {
    if (!projetChatInput.trim() || !projetChat) return;
    const txt = projetChatInput.trim();
    setProjetChatInput("");
    const newMsgs = [...projetChatMsgs, { role: "user", text: txt }];
    setProjetChatMsgs([...newMsgs, { role: "ai", text: "..." }]);
    setProjetChatLoading(true);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 900,
          system: "Tu es l'assistant IA dédié à ce projet — Nom : " + projetChat.nom + ". Type : " + projetChat.type + ". Date : " + projetChat.date + ". Statut : " + projetChat.statut + ". Notes : " + (projetChat.notes || "aucune") + ". Expert bâtiment, normes DTU. Réponds de façon concise et pratique.\n" + profilIA(),
          messages: newMsgs.filter(m => m.text !== "...").map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })).slice(-8) }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setProjetChatMsgs([...newMsgs, { role: "ai", text: data.content[0].text }]);
    } catch (e) { setProjetChatMsgs([...newMsgs, { role: "ai", text: "Erreur : " + e.message }]); }
    finally { setProjetChatLoading(false); }
  }, [projetChatInput, projetChat, projetChatMsgs, apiKey, profilIA]);

  // ── CR Chantier ───────────────────────────────────────────────
  const genererCRChantier = useCallback(async (p) => {
    setCrLoading(true);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200,
          system: `${profilIA()}\nTu es expert en compte-rendu de chantier. Réponds UNIQUEMENT en JSON valide : {"avancement":"X%","travaux_realises":["travail 1"],"travaux_restants":["travail 1"],"observations":["observation 1"],"prochaine_intervention":"description","reserves":["réserve ou vide"]}`,
          messages: [{ role: "user", content: "Projet : " + p.nom + "\nType : " + p.type + "\nDate : " + p.date + "\nStatut : " + p.statut + "\nNotes : " + (p.notes || "aucune") + "\nGénère le compte-rendu." }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      genererCRPDF(p, JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim()));
    } catch (e) { alert("Erreur CR : " + e.message); }
    finally { setCrLoading(false); }
  }, [apiKey, profilIA]);

  // ── PDFs ──────────────────────────────────────────────────────
  const exportChatPDF = useCallback(() => {
    if (!msgs || msgs.length <= 1) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210, dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const ia = IAS[curIA];
    doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, 297, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, 297, "F"); doc.rect(0, 0, W, 1.5, "F");
    doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 42, "F");
    doc.setTextColor(240, 237, 230); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("MAESTRO", 42, 18);
    const mw = doc.getTextWidth("MAESTRO"); doc.setTextColor(201, 168, 76); doc.text("MIND", 42 + mw, 18);
    doc.setTextColor(201, 168, 76); doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.text("CONVERSATION — " + (ia?.name || curIA).toUpperCase(), 42, 27);
    doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(profilPDFLabel() + "  ·  " + dateStr + "  ·  " + msgs.filter(m => m.role !== "ai" || m.text !== "...").length + " messages", 42, 34);
    doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(5, 44, W, 44);
    let y = 52;
    const addPage = () => { doc.addPage(); doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, 297, "F"); doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, 297, "F"); y = 20; };
    msgs.filter(m => m.text && m.text !== "...").forEach((m) => {
      const isAI = m.role === "ai";
      const label = isAI ? (ia?.name || "IA") : "Vous";
      const color = isAI ? [82, 195, 122] : [201, 168, 76];
      doc.setTextColor(...color); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text(label, 14, y); y += 5;
      doc.setTextColor(isAI ? 160 : 240, isAI ? 155 : 237, isAI ? 148 : 230); doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(m.text, W - 28);
      if (y + lines.length * 5 > 278) addPage();
      doc.text(lines, 14, y); y += lines.length * 5 + 6;
      if (y > 278) addPage();
    });
    doc.setFillColor(10, 14, 22); doc.rect(0, 278, W, 19, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 278, 5, 19, "F"); doc.rect(0, 295.5, W, 1.5, "F");
    doc.setTextColor(201, 168, 76); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
    doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(profilPDFLabel() + " · Export conversation", 13, 292);
    doc.text(dateStr, W - 12, 286, { align: "right" });
    doc.save("MAESTROMIND-" + curIA + "-" + new Date().getTime() + ".pdf");
  }, [msgs, curIA, profilPDFLabel]);

  const genererPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210, H = 297;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const certNum = "MAESTRO-" + new Date().getFullYear() + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    const norme = certNorme.split("—")[0].trim();
    const projet = certProjet || "Non renseigné";
    const prop = certProp || "Non renseigné";
    const artisan = certArtisan || "Non renseigné";
    const surface = (certSurface || "10") + " m²";
    doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, H, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, H, "F"); doc.rect(0, 0, W, 1.5, "F");
    doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 50, "F");
    doc.setFillColor(201, 168, 76); doc.roundedRect(14, 10, 24, 24, 3, 3, "F");
    doc.setTextColor(6, 8, 13); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("M", 26, 27, { align: "center" });
    doc.setTextColor(240, 237, 230); doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.text("MAESTRO", 46, 22);
    const bw = doc.getTextWidth("MAESTRO"); doc.setTextColor(201, 168, 76); doc.text("MIND", 46 + bw, 22);
    doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text("Plateforme IA Expertise Bâtiment  ·  32 Intelligences Spécialisées", 46, 30);
    doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(5, 52, W, 52);
    doc.setFillColor(8, 12, 20); doc.rect(5, 52, W - 5, 38, "F");
    doc.setTextColor(201, 168, 76); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text("DOCUMENT OFFICIEL DE CONFORMITÉ", W / 2 + 2.5, 63, { align: "center" });
    doc.setTextColor(240, 237, 230); doc.setFontSize(19); doc.setFont("helvetica", "bold"); doc.text("CERTIFICAT DE CONFORMITÉ DTU", W / 2 + 2.5, 79, { align: "center" });
    doc.setFillColor(201, 168, 76); doc.rect(5, 90, W - 5, 0.5, "F");
    doc.setFillColor(12, 16, 24); doc.roundedRect(14, 98, W - 28, 78, 3, 3, "F");
    doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.4); doc.roundedRect(14, 98, W - 28, 78, 3, 3, "S");
    doc.setTextColor(201, 168, 76); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("INFORMATIONS DU PROJET", 22, 108);
    doc.setDrawColor(40, 50, 68); doc.setLineWidth(0.2); doc.line(22, 111, W - 22, 111);
    [["Projet", projet], ["Norme applicable", norme], ["Surface concernée", surface], ["Maître d'ouvrage", prop], ["Artisan / Entreprise", artisan], ["Date d'émission", dateStr], ["N° Certificat", certNum]].forEach(([label, value], i) => {
      const y = 121 + i * 9.5;
      doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text(label + " :", 22, y);
      doc.setTextColor(240, 237, 230); doc.setFont("helvetica", "bold"); doc.text(value, 90, y);
    });
    const cx = W - 34, cy = 142;
    doc.setFillColor(6, 8, 13); doc.circle(cx, cy, 22, "F");
    doc.setDrawColor(82, 195, 122); doc.setLineWidth(1.8); doc.circle(cx, cy, 22, "S");
    doc.setLineWidth(0.5); doc.circle(cx, cy, 18.5, "S");
    doc.setTextColor(82, 195, 122); doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.text("CONFORME", cx, cy - 2, { align: "center" });
    doc.setFontSize(7); doc.text("DTU VALIDÉ", cx, cy + 5, { align: "center" });
    doc.setFontSize(6); doc.setTextColor(60, 150, 90); doc.text("MAESTROMIND IA", cx, cy + 11, { align: "center" });
    doc.setFillColor(8, 10, 16); doc.roundedRect(14, 183, W - 28, 32, 3, 3, "F");
    doc.setDrawColor(35, 45, 62); doc.setLineWidth(0.3); doc.roundedRect(14, 183, W - 28, 32, 3, 3, "S");
    doc.setTextColor(201, 168, 76); doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.text("NORMES ET RÉGLEMENTATION", 22, 192);
    doc.setDrawColor(35, 45, 62); doc.line(22, 195, W - 22, 195);
    doc.setTextColor(160, 155, 148); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(`La norme ${norme} définit les règles de l'art applicables à ce projet. Les travaux ont été réalisés dans le strict respect des prescriptions techniques en vigueur au ${dateStr}.`, W - 50), 22, 201);
    doc.setFillColor(16, 10, 6); doc.roundedRect(14, 221, W - 28, 20, 2, 2, "F");
    doc.setDrawColor(80, 50, 18); doc.setLineWidth(0.3); doc.roundedRect(14, 221, W - 28, 20, 2, 2, "S");
    doc.setTextColor(140, 95, 40); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("AVERTISSEMENT", 22, 228);
    doc.setFont("helvetica", "normal"); doc.setTextColor(110, 75, 30);
    doc.text(doc.splitTextToSize("Ce certificat est généré automatiquement par MAESTROMIND à titre indicatif. Il ne se substitue pas à un contrôle officiel par un bureau de contrôle agréé (Apave, Bureau Veritas, Socotec…).", W - 50), 22, 234);
    doc.setDrawColor(40, 50, 68); doc.setLineWidth(0.3); doc.line(18, 262, 82, 262); doc.line(128, 262, 192, 262);
    doc.setTextColor(100, 96, 88); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
    doc.text("IA Certificat — MAESTROMIND", 50, 267, { align: "center" }); doc.text("Responsable Conformité", 50, 272, { align: "center" });
    doc.text("IA Validation Technique", 160, 267, { align: "center" }); doc.text("Contrôle DTU", 160, 272, { align: "center" });
    doc.setFillColor(10, 14, 22); doc.rect(0, 278, W, 19, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 278, 5, 19, "F"); doc.rect(0, 295.5, W, 1.5, "F");
    doc.setTextColor(201, 168, 76); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
    doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text("Plateforme IA Expertise Bâtiment", 13, 292);
    doc.text("N° " + certNum, W - 12, 286, { align: "right" }); doc.text("Émis le " + dateStr, W - 12, 292, { align: "right" });
    doc.save("certificat-" + projet.replace(/\s+/g, "-").toLowerCase() + "-" + new Date().getFullYear() + ".pdf");
  }, [certNorme, certProjet, certProp, certArtisan, certSurface]);

  const genererDevisProPDF = useCallback(() => {
    if (!devisProResult) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210, H = 297;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    const num = "DEV-" + new Date().getFullYear() + "-" + Math.random().toString(36).substr(2, 6).toUpperCase();
    doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, H, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 0, 5, H, "F"); doc.rect(0, 0, W, 1.5, "F");
    doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 50, "F");
    doc.setFillColor(201, 168, 76); doc.roundedRect(14, 10, 22, 22, 3, 3, "F");
    doc.setTextColor(6, 8, 13); doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("M", 25, 26, { align: "center" });
    doc.setTextColor(240, 237, 230); doc.setFontSize(17); doc.setFont("helvetica", "bold"); doc.text("DEVIS PROFESSIONNEL", 42, 20);
    doc.setTextColor(201, 168, 76); doc.setFontSize(8); doc.text("N° " + num, 42, 28);
    doc.setTextColor(100, 96, 88); doc.setFontSize(7.5); doc.setFont("helvetica", "normal");
    doc.text("Émis le " + dateStr + "  ·  Validité : " + (devisProResult.validite || "30 jours"), 42, 35);
    if (devisProClient) doc.text("Client : " + devisProClient, 42, 42);
    doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.3); doc.line(5, 52, W, 52);
    doc.setFillColor(14, 18, 28); doc.rect(5, 53, W - 5, 10, "F");
    doc.setTextColor(201, 168, 76); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text("DÉSIGNATION", 14, 60); doc.text("UNITÉ", 102, 60, { align: "center" }); doc.text("QTÉ", 122, 60, { align: "center" }); doc.text("PU HT", 147, 60, { align: "center" }); doc.text("TOTAL HT", W - 12, 60, { align: "right" });
    let y = 68;
    (devisProResult.lignes || []).forEach((l, i) => {
      const desc = l.dtu ? l.description + " (" + l.dtu + ")" : l.description;
      const lines = doc.splitTextToSize(desc, 82);
      const rowH = Math.max(10, lines.length * 5 + 4);
      if (i % 2 === 0) { doc.setFillColor(10, 13, 20); doc.rect(5, y - 2, W - 5, rowH, "F"); }
      doc.setTextColor(240, 237, 230); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(lines, 14, y + 3);
      doc.setTextColor(180, 175, 165); doc.text(l.unite || "", 102, y + 3, { align: "center" });
      doc.text(String(l.quantite || ""), 122, y + 3, { align: "center" });
      doc.text(l.prix_unitaire || "", 147, y + 3, { align: "center" });
      doc.setTextColor(201, 168, 76); doc.setFont("helvetica", "bold");
      doc.text(l.total || "", W - 12, y + 3, { align: "right" });
      y += rowH;
    });
    y = Math.min(y + 8, 225);
    doc.setDrawColor(201, 168, 76); doc.line(120, y, W - 5, y);
    doc.setTextColor(160, 155, 148); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Sous-total HT", 130, y + 7); doc.text(devisProResult.sous_total_ht || "", W - 12, y + 7, { align: "right" });
    doc.text("TVA " + devisProResult.tva_taux, 130, y + 14); doc.text(devisProResult.tva || "", W - 12, y + 14, { align: "right" });
    doc.setFillColor(14, 18, 28); doc.roundedRect(120, y + 17, W - 125, 12, 2, 2, "F");
    doc.setDrawColor(201, 168, 76); doc.setLineWidth(0.5); doc.roundedRect(120, y + 17, W - 125, 12, 2, 2, "S");
    doc.setTextColor(201, 168, 76); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("TOTAL TTC", 130, y + 26); doc.text(devisProResult.total_ttc || "", W - 12, y + 26, { align: "right" });
    const yM = Math.min(y + 38, 248);
    doc.setFillColor(8, 10, 16); doc.roundedRect(14, yM, W - 28, 28, 2, 2, "F");
    doc.setDrawColor(35, 45, 62); doc.setLineWidth(0.2); doc.roundedRect(14, yM, W - 28, 28, 2, 2, "S");
    doc.setTextColor(201, 168, 76); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("GARANTIES & MENTIONS LÉGALES", 22, yM + 7);
    doc.setTextColor(110, 106, 98); doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize((devisProResult.garanties || "") + " — " + (devisProResult.mentions || ""), W - 52), 22, yM + 14);
    doc.setDrawColor(40, 50, 68); doc.setLineWidth(0.3); doc.line(18, 270, 82, 270); doc.line(128, 270, 192, 270);
    doc.setTextColor(100, 96, 88); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Signature artisan", 50, 275, { align: "center" }); doc.text("Signature client + «Bon pour accord»", 160, 275, { align: "center" });
    doc.setFillColor(10, 14, 22); doc.rect(0, 278, W, 19, "F");
    doc.setFillColor(201, 168, 76); doc.rect(0, 278, 5, 19, "F"); doc.rect(0, 295.5, W, 1.5, "F");
    doc.setTextColor(201, 168, 76); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
    doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Devis généré par IA · À compléter avec vos coordonnées", 13, 292);
    doc.text("N° " + num, W - 12, 286, { align: "right" });
    doc.text("Validité : " + (devisProResult.validite || "30 jours"), W - 12, 292, { align: "right" });
    doc.save("devis-pro-" + num + ".pdf");
  }, [devisProResult, devisProClient]);

  const genererCRPDF = useCallback((projet, cr) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210, H = 297;
    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    doc.setFillColor(6, 8, 13); doc.rect(0, 0, W, H, "F");
    doc.setFillColor(82, 195, 122); doc.rect(0, 0, 5, H, "F"); doc.rect(0, 0, W, 1.5, "F");
    doc.setFillColor(10, 14, 22); doc.rect(5, 1.5, W - 5, 52, "F");
    doc.setFillColor(82, 195, 122); doc.roundedRect(14, 10, 22, 22, 3, 3, "F");
    doc.setTextColor(6, 8, 13); doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("CR", 25, 26, { align: "center" });
    doc.setTextColor(240, 237, 230); doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.text("COMPTE-RENDU DE CHANTIER", 42, 20);
    doc.setTextColor(82, 195, 122); doc.setFontSize(8); doc.text(dateStr, 42, 28);
    doc.setTextColor(100, 96, 88); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    doc.text("Projet : " + projet.nom + "  ·  Type : " + projet.type, 42, 35);
    const av = parseInt(cr.avancement) || 0;
    doc.setFillColor(20, 24, 34); doc.rect(42, 40, W - 50, 7, "F");
    doc.setFillColor(82, 195, 122); doc.rect(42, 40, (W - 50) * av / 100, 7, "F");
    doc.setTextColor(240, 237, 230); doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.text("Avancement : " + cr.avancement, (W + 42) / 2, 45.5, { align: "center" });
    doc.setDrawColor(82, 195, 122); doc.setLineWidth(0.3); doc.line(5, 54, W, 54);
    let y = 62;
    const sect = (title, items, r, g, b) => {
      if (!items || !items.length) return;
      doc.setFillColor(10, 13, 20); doc.roundedRect(14, y, W - 28, 9, 2, 2, "F");
      doc.setTextColor(r, g, b); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text(title, 22, y + 6); y += 13;
      items.forEach(item => {
        if (!item) return;
        const lines = doc.splitTextToSize("• " + item, W - 40);
        doc.setTextColor(160, 155, 148); doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.text(lines, 22, y); y += lines.length * 5 + 2;
      }); y += 3;
    };
    sect("TRAVAUX RÉALISÉS", cr.travaux_realises, 82, 195, 122);
    sect("TRAVAUX RESTANTS", cr.travaux_restants, 201, 168, 76);
    sect("OBSERVATIONS", cr.observations, 82, 144, 224);
    if (cr.reserves && cr.reserves[0]) sect("RÉSERVES", cr.reserves, 224, 82, 82);
    if (cr.prochaine_intervention) {
      doc.setFillColor(8, 10, 16); doc.roundedRect(14, y, W - 28, 20, 2, 2, "F");
      doc.setDrawColor(82, 195, 122); doc.setLineWidth(0.2); doc.roundedRect(14, y, W - 28, 20, 2, 2, "S");
      doc.setTextColor(82, 195, 122); doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.text("PROCHAINE INTERVENTION", 22, y + 7);
      doc.setTextColor(160, 155, 148); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(cr.prochaine_intervention, W - 48), 22, y + 13); y += 24;
    }
    doc.setDrawColor(40, 50, 68); doc.setLineWidth(0.3); doc.line(18, 270, 82, 270); doc.line(128, 270, 192, 270);
    doc.setTextColor(100, 96, 88); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Chef de chantier", 50, 275, { align: "center" }); doc.text("Maître d'ouvrage", 160, 275, { align: "center" });
    doc.setFillColor(10, 14, 22); doc.rect(0, 278, W, 19, "F");
    doc.setFillColor(82, 195, 122); doc.rect(0, 278, 5, 19, "F"); doc.rect(0, 295.5, W, 1.5, "F");
    doc.setTextColor(82, 195, 122); doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.text("MAESTROMIND", 13, 286);
    doc.setTextColor(80, 76, 70); doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.text(profilPDFLabel() + " · CR chantier", 13, 292);
    doc.text(dateStr, W - 12, 286, { align: "right" });
    doc.save("CR-" + projet.nom.replace(/\s+/g, "-") + "-" + new Date().getFullYear() + ".pdf");
  }, [profilPDFLabel]);

  // ── Context value ─────────────────────────────────────────────
  const value = {
    IS_DEV,
    // State
    page, setPage,
    apiKey, setApiKey, showKey, setShowKey, keyInput, setKeyInput, keyErr, setKeyErr,
    curDiv, setCurDiv, curIA, setCurIA, msgs, setMsgs, hist, setHist, input, setInput, loading, errMsg,
    store, setStore,
    dpeS, setDpeS, dpeT, setDpeT, dpeC, setDpeC, dpeRes,
    camActive, setCamActive, photoUrl, setPhotoUrl, scanLoading, scanResult, setScanResult, scanIA, setScanIA, scannerTab, setScannerTab,
    arModeType, setArModeType, arAnchor, setArAnchor, arTilt, arShelfType, setArShelfType, showArAdvisor, setShowArAdvisor, arAdvInput, setArAdvInput, arAdvResult, arAdvLoading,
    certProjet, setCertProjet, certNorme, setCertNorme, certSurface, setCertSurface, certProp, setCertProp, certArtisan, setCertArtisan,
    rgpdOk, setRgpdOk, msgCount, showPaywall, setShowPaywall, isPremium, onboardingDone, setOnboardingDone, onboardingStep, setOnboardingStep, userType, setUserType, pdgUnlocked, pinInput, pinError,
    toolTab, setToolTab, devisText, setDevisText, devisResult, devisLoading, calcType, setCalcType, calcSurface, setCalcSurface, calcResult, calcLoading,
    artisanNom, setArtisanNom, artisanSpec, setArtisanSpec, artisanResult, artisanLoading,
    primesRev, setPrimesRev, primesTrav, setPrimesTrav, primesSurf, setPrimesSurf, primesResult, primesLoading,
    counterDevis, setCounterDevis, counterLoading, planningType, setPlanningType, planningBudget, setPlanningBudget, planningResult, planningLoading,
    devisProDesc, setDevisProDesc, devisProClient, setDevisProClient, devisProSurface, setDevisProSurface, devisProResult, devisProLoading,
    rentaSurface, setRentaSurface, rentaTaux, setRentaTaux, rentaMat, setRentaMat, rentaDep, setRentaDep, rentaResult,
    projets, projetNom, setProjetNom, projetType, setProjetType, projetNotes, setProjetNotes,
    projetChat, setProjetChat, projetChatMsgs, projetChatInput, setProjetChatInput, projetChatLoading, crLoading,
    voiceActive,
    // Refs
    msgsRef, videoRef, canvasRef, arVideoRef, arCanvasRef, arAnimRef, arFrameRef, streamRef, arAnchorRef, arModeRef, arTiltRef, arShelfTypeRef,
    // Computed
    currentIA, chips,
    // Functions
    goPage, switchDiv, switchIA, activerIA, send, sendWithPhoto, rateMsg,
    ouvrirCamera, prendrePhoto, importerPhoto, analyserPhoto,
    startVoice, startUrgence, handlePin, handlePinDel,
    analyserDevis, genererContreDevis, calculerMateriaux, calculerPrimes, verifierArtisan,
    planifierChantier, genererDevisPro, calculerRentabilite, calcDPE, suggestShelf,
    ajouterProjet, supprimerProjet, ouvrirProjetChat, sendProjetChat, genererCRChantier,
    exportChatPDF, genererPDF, genererDevisProPDF, genererCRPDF,
    profilIA, profilPDFLabel, rangColor, saveConv, loadConv, welcomeMsg,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
