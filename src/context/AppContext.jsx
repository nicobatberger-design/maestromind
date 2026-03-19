import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IAS, DIVISIONS, PROFILS, buildSystemPrompt, getChips, PDG_PIN_HASH } from "../data/constants";
import { apiURL, apiHeaders, withRetry, hashPin } from "../utils/api";
import { exportChatPDF as _exportChatPDF, genererCertificatPDF, genererDevisProPDF as _genererDevisProPDF, genererCRPDF } from "../utils/pdf";

const IS_DEV = import.meta.env.DEV;

function parseAIJson(text) {
  const clean = (text || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("Réponse IA invalide. Réessayez.");
}

const ROUTE_TO_PAGE = { "/": "home", "/coach": "coach", "/scanner": "scanner", "/shop": "shop", "/cert": "cert", "/outils": "outils", "/projets": "projets", "/dashboard": "dashboard" };
const PAGE_TO_ROUTE = { home: "/", coach: "/coach", scanner: "/scanner", shop: "/shop", cert: "/cert", outils: "/outils", projets: "/projets", dashboard: "/dashboard" };

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
  const [msgs, setMsgs] = useState(() => {
    try { const s = localStorage.getItem("mm_chat_coach"); if (s) { const p = JSON.parse(s); if (p.length) return p; } } catch {}
    return [{ role: "ai", text: "Bonjour ! Je suis votre Coach Expert Bâtiment. Quel est votre projet ?" }];
  });
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

  // ── Theme ────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem("mm_theme") || "dark");
  useEffect(() => { localStorage.setItem("mm_theme", theme); }, [theme]);

  // ── Auth / Onboarding ─────────────────────────────────────────
  const [rgpdOk, setRgpdOk] = useState(() => localStorage.getItem("rgpd_accepted") === "1");
  const [msgCount, setMsgCount] = useState(() => parseInt(localStorage.getItem("bl_msg_count") || "0"));
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPremium, setIsPremium] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("premium") === "1") { localStorage.setItem("bl_premium", "1"); window.history.replaceState({}, "", window.location.pathname); return true; }
    return localStorage.getItem("bl_premium") === "1";
  });
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
  const [calcHauteur, setCalcHauteur] = useState("2.50");
  const [calcPente, setCalcPente] = useState("");
  const [calcLongueur, setCalcLongueur] = useState("");
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
      const rep = data?.content?.[0]?.text || "Désolé, réessayez.";
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
      const rep = data?.content?.[0]?.text || "Désolé, réessayez.";
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
      setScanResult(parseAIJson(data?.content?.[0]?.text));
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
          system: `${profilIA()}\nTu es un expert en tarifs de travaux en France 2026, certifié métreur-vérificateur. PRIX DE RÉFÉRENCE MO 2026 TTC : Maçon 42-68€/h · Plombier 68-100€/h · Électricien 62-90€/h · Plaquiste/peintre 38-58€/h · Couvreur 48-75€/h · Menuisier 48-68€/h. MAJORATION RÉGIONALE : IDF +20% · PACA/Rhône-Alpes +10% · Province base. Vérifie : cohérence quantitatifs vs surface, prix unitaires vs marché, TVA applicable (5.5% réno énergétique, 10% réno standard, 20% neuf), mentions légales obligatoires (assurance décennale, date validité, délai exécution). Analyse ce devis et réponds UNIQUEMENT en JSON valide : {"verdict":"CORRECT","resume":"1 phrase synthèse","points":["point 1","point 2","point 3"],"anomalies":["anomalie détectée ou vide"],"conseil":"conseil pratique","tva_correcte":"oui/non + explication"}. Verdict possible : CORRECT, ÉLEVÉ, SUSPECT, INCOMPLET.`,
          messages: [{ role: "user", content: "Analyse ce devis :\n\n" + devisText }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setDevisResult(parseAIJson(data?.content?.[0]?.text));
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
          system: `Tu es un expert en négociation de travaux en France 2026, métreur-vérificateur certifié. ${profilIA()} PRIX RÉFÉRENCE MO 2026 TTC : Maçon 42-68€/h · Plombier 68-100€/h · Électricien 62-90€/h · Plaquiste/peintre 38-58€/h · Couvreur 48-75€/h. MAJORATION IDF +20%, Sud-Est +10%. Matériaux : BA13 7-9€/plaque · Carrelage grès 10-35€/m² · Peinture acrylique 4-8€/m² · Mortier-colle C2 14-20€/sac 25kg. Génère un contre-devis argumenté en citant les prix de référence marché. Réponds UNIQUEMENT en JSON valide : {"lignes":[{"poste":"nom","prix_demande":"X€","prix_marche":"X€ (référence marché 2026)","prix_negocie":"X€","argument":"court argument avec référence prix"}],"economie_totale":"X€","pourcentage_economie":"X%","message_negociation":"message poli à envoyer à l artisan en 2-3 phrases","conseil":"conseil final"}`,
          messages: [{ role: "user", content: "Devis original :\n" + devisText + "\n\nAnalyse :\n" + JSON.stringify(devisResult) + "\n\nGénère le contre-devis." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setCounterDevis(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setCounterDevis({ lignes: [], economie_totale: "0€", message_negociation: e.message, conseil: "" }); }
    finally { setCounterLoading(false); }
  }, [devisResult, devisText, apiKey, profilIA]);

  const calculerMateriaux = useCallback(async () => {
    setCalcLoading(true); setCalcResult(null);
    const hauteur = parseFloat(calcHauteur) || 2.5;
    const pente = parseFloat(calcPente) || 0;
    const longueur = parseFloat(calcLongueur) || 0;
    let dims = `Surface : ${calcSurface}m². Hauteur sous plafond : ${hauteur}m.`;
    if (pente > 0) dims += ` ATTENTION : toit/plafond en pente à ${pente}° — la hauteur varie. Calcule la surface réelle en tenant compte de la pente (surface rampant = surface au sol / cos(pente)). Adapte les longueurs de plaques/rails en conséquence.`;
    if (longueur > 0) dims += ` Longueur linéaire de la cloison/mur : ${longueur}m.`;
    const typesAvecHauteur = ["Placo BA13", "Peinture", "Carrelage", "Enduit", "Isolation murs"];
    if (typesAvecHauteur.includes(calcType)) dims += ` La hauteur impacte le choix des plaques (standard 2.50m, haute 2.60m, 2.70m, 3m). Si hauteur > 2.50m, précise qu'il faut des plaques plus grandes et adapte les quantités de rails/montants.`;
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200,
          system: `${profilIA()}\nTu es un expert en quantitatifs matériaux bâtiment France 2026. Tu connais parfaitement les dimensions standard des matériaux (plaques BA13 : 1200x2500, 1200x2600, 1200x2700, 1200x3000 ; rails R48/R70 en 3m ; montants M48/M70 en 2.50/2.60/2.70/3m ; etc.). IMPORTANT : adapte tes recommandations à la HAUTEUR et à la PENTE indiquées. PRIX RÉFÉRENCE 2026 (sources prix-travaux-m2.com/allotravaux.com) : BA13 standard fourniture 2,50-9€/plaque · BA13 fourni-posé 27-41€/m² · Carrelage grès cérame posé 55-120€/m² · Carrelage standard posé 60-75€/m² · Isolation fourniture seule 5-60€/m² · Isolation fourni-posé 25-120€/m². Réponds UNIQUEMENT en JSON valide : {"materiaux":[{"nom":"Produit précis avec dimensions","quantite":"X unités (détail calcul)","prixEstime":"X€","conseil":"marque/ref recommandée"}],"total":"X€","conseil":"conseil pratique incluant mise en oeuvre"}`,
          messages: [{ role: "user", content: `Calcule les matériaux pour ${calcType}. ${dims} Inclus pertes standards (10-15%). Prix marché France 2026 actualisés. Produits disponibles Leroy Merlin/Castorama/Brico Dépôt. Détaille chaque produit avec ses dimensions exactes et la marque recommandée.` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setCalcResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setCalcResult({ materiaux: [], total: "0€", conseil: e.message }); }
    finally { setCalcLoading(false); }
  }, [apiKey, profilIA, calcType, calcSurface, calcHauteur, calcPente, calcLongueur]);

  const calculerPrimes = useCallback(async () => {
    setPrimesLoading(true); setPrimesResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: `${profilIA()}\nTu es un expert certifié en aides rénovation France 2026 (MaPrimeRénov', CEE, éco-PTZ, TVA 5.5%, Anah). NOUVEAUTÉS 2026 (sources hellio.com/effy.fr/quelleenergie.fr) : RDV France Rénov' OBLIGATOIRE avant dépôt MaPrimeRénov'. Parcours accompagné recentré sur E/F/G uniquement (C/D exclus). ITE+ITI+chaudières biomasse SUPPRIMÉS en monogeste. Profil Rose (revenus supérieurs) EXCLU du parcours par geste. Plafond 20 000€ sur 5 ans. BARÈMES PAR GESTE (Bleu/Jaune/Violet — Rose exclu) : PAC air/eau 5 000/4 000/3 000€ · PAC géo 11 000/9 000/6 000€ · Fenêtres 100/80/40€/équip. · Isolation combles 25/20/15€/m² · Toiture terrasse 75/60/40€/m² · Poêle à bois 1 250/800/400€ · VMC DF 2 500/2 000/1 500€. CEE revalorisées : PAC air/eau +1 000€, PAC géo +2 000€, isol. combles ~10-15€/m², murs ~15-25€/m². PLAFONDS REVENUS 2026 (1 pers IDF/Province) : Très modeste ≤23 541€/≤17 009€ · Modeste ≤28 657€/≤21 805€ · Intermédiaire ≤40 018€/≤30 549€. Artisan RGE OBLIGATOIRE. Éco-PTZ : 1 geste=15k€, 2-3 gestes=30k€, 4+=50k€ à 0%, max 20 ans. TVA 5.5% réno énergétique, 10% réno standard, logement >2 ans. Cumul optimal : MPR+CEE+éco-PTZ+TVA 5.5%+aides locales = jusqu'à 90% très modestes. Réponds UNIQUEMENT en JSON valide : {"aides":[{"nom":"Aide","montant":"X€","condition":"condition courte","demarche":"comment faire en 1 phrase"}],"total":"X€","reste_a_charge":"X€","conseil":"conseil pratique","attention":"point important","rdv_france_renov":"obligatoire avant dépôt — 0 808 800 700"}`,
          messages: [{ role: "user", content: `Foyer ${primesRev}, travaux : ${primesTrav}, surface : ${primesSurf}m². Quelles aides suis-je éligible en 2026 ? Calcule les montants exacts selon les barèmes 2026.` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setPrimesResult(parseAIJson(data?.content?.[0]?.text));
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
          system: `${profilIA()}\nTu es un expert en vérification d'artisans RGE France 2026. SITES OFFICIELS DE VÉRIFICATION : 1-Kbis/SIRET → infogreffe.fr ou societe.com 2-Assurance décennale → agira.fr (vérification par n° SIRET) 3-Certification RGE → france-renov.gouv.fr/annuaire-rge ou rge-artisan.fr 4-Qualibat → qualibat.com/certification 5-Qualifelec → qualifelec.com 6-QualiPAC → qualit-enr.org 7-Qualigaz → qualigaz.com (installations gaz). CHECKLIST 8 POINTS : Kbis récent, décennale valide, RGE en cours, RC pro, devis conforme, références vérifiables, pas d'acompte >30%, adresse fixe. SIGNAUX D'ALARME : paiement cash only, pas de devis avant travaux, pression urgence, prix anormalement bas, sous-traitance non déclarée, acompte >50%. Génère une checklist complète. Réponds UNIQUEMENT en JSON valide : {"checks":[{"label":"Vérification","comment":"comment vérifier","url":"site officiel","obligatoire":true}],"alertes":["alerte 1"],"signaux_alarme":["signal 1"],"conseils":"conseil global"}`,
          messages: [{ role: "user", content: `Je veux vérifier l'artisan "${artisanNom}" spécialisé en ${artisanSpec}. Checklist de vérification RGE, assurance décennale, existence légale.` }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setArtisanResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setArtisanResult({ checks: [], alertes: [e.message], conseils: "" }); }
    finally { setArtisanLoading(false); }
  }, [apiKey, profilIA, artisanNom, artisanSpec]);

  const planifierChantier = useCallback(async () => {
    setPlanningLoading(true); setPlanningResult(null);
    try {
      const r = await withRetry(() => fetch(apiURL(), {
        method: "POST", headers: apiHeaders(apiKey),
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1400,
          system: `Tu es expert certifié en planification de chantier bâtiment France 2026. ${profilIA()} DURÉES RÉALISTES (1 artisan qualifié) : dépose/démolition = 1j/pièce · gros œuvre/ragréage = 2-3j (+ séchage béton 28j) · plomberie brute = 1-2j · électricité brute = 1-2j · isolation murs = 1j/50m² · cloisons placo = 1j/25m² · carrelage = 1j/8-12m² · peinture 2 couches = 1j/40m² · menuiseries = 0.5j/unité · sanitaires = 0.5j/appareil. ORDRE IMPÉRATIF DES LOTS (NE JAMAIS INVERSER) : 1-Dépose/démolition 2-Gros œuvre 3-Plomberie brute 4-Électricité brute 5-Isolation 6-Cloisons/doublages 7-Enduits/ragréages (séchage 7-28j) 8-Carrelage/parquet 9-Peintures 10-Menuiseries 11-Sanitaires/appareillage 12-Nettoyage/réception. ERREURS FATALES : carrelage sur béton frais (<28j) · peinture sur enduit humide (<48h) · parquet avant carrelage SDB · branchement sous tension. Réponds UNIQUEMENT en JSON valide : {"duree_totale":"X semaines","semaines":[{"numero":1,"titre":"Titre court","taches":["tâche 1","tâche 2"],"materiaux_a_commander":["matériau 1"],"attention":"point critique","nb_artisans":"X"}],"ordre_metiers":["1. Corps de métier"],"chemin_critique":"étapes limitantes","conseils":"conseil global","budget_detail":"répartition budget par poste"}`,
          messages: [{ role: "user", content: "Projet : " + planningType + ", budget " + planningBudget + "€. Planning complet semaine par semaine." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setPlanningResult(parseAIJson(data?.content?.[0]?.text));
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
          system: `Tu es expert en rédaction de devis travaux France 2026, métreur certifié. ${profilIA()} PRIX MO 2026 TTC (sources obat.fr/habitatpresto.com, +3.2% CAPEB) : Maçon 35-70€/h · Carreleur 35-55€/h · Plombier 40-65€/h · Électricien 40-65€/h · Plaquiste 30-50€/h · Peintre 30-40€/h · Couvreur 45-70€/h · Charpentier 40-60€/h · Menuisier 40-60€/h · Terrassier 60-80€/h. IDF +20-30%, PACA +10%. PRIX MATÉRIAUX 2026 : BA13 2,50-9€/plaque · BA13 fourni-posé 27-41€/m² · Rail R48 2.30€/ml · Carrelage grès cérame posé 55-120€/m² · Carrelage standard posé 60-75€/m² · Peinture acrylique 4-8€/m² · Isolation fourni-posé 25-120€/m². TVA : 5.5% rénovation énergétique (art. 278-0 bis A CGI) · 10% rénovation standard (art. 279-0 bis CGI) · 20% construction neuve. Logement doit avoir >2 ans pour TVA réduite. Génère un devis professionnel conforme aux obligations légales. Réponds UNIQUEMENT en JSON valide : {"lignes":[{"description":"description précise","unite":"m² ou U ou ml ou forfait","quantite":"X","prix_unitaire":"X€","total":"X€","dtu":"DTU ou norme ou vide"}],"sous_total_ht":"X€","tva_taux":"10%","tva":"X€","total_ttc":"X€","validite":"30 jours","garanties":"décennale 10 ans + parfait achèvement 1 an","mentions":"TVA applicable selon art. 279-0 bis du CGI — logement >2 ans","conditions_paiement":"30% commande, 40% avancement, 30% réception"}`,
          messages: [{ role: "user", content: "Travaux : " + devisProDesc + "\nSurface : " + devisProSurface + "m²\nClient : " + (devisProClient || "À compléter") + "\nGénère le devis complet prix France 2026 avec prix MO et matériaux actualisés." }] })}));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      setDevisProResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) { setDevisProResult({ lignes: [], sous_total_ht: "0€", tva_taux: "10%", tva: "0€", total_ttc: "0€", validite: "30 jours", garanties: "", mentions: "" }); }
    finally { setDevisProLoading(false); }
  }, [apiKey, profilIA, devisProDesc, devisProSurface, devisProClient]);

  // ── Rentabilité — statut juridique + type de travaux ──────
  const [rentaType, setRentaType] = useState("Peinture");
  const [rentaStatut, setRentaStatut] = useState("Micro-entreprise");

  const calculerRentabilite = useCallback(() => {
    const surf = parseFloat(rentaSurface) || 0, taux = parseFloat(rentaTaux) || 0;
    const mat = parseFloat(rentaMat) || 0, dep = parseFloat(rentaDep) || 0;

    // Temps par type de travaux (h/m²) — moyennes réalistes 2026
    const TEMPS_PAR_TYPE = {
      "Peinture": 0.3,              // 2 couches, préparation incluse
      "Carrelage": 0.8,             // pose + joints + séchage
      "Placo / Cloison BA13": 0.5,  // ossature + plaques + joints
      "Enduit / Ragréage": 0.4,     // préparation + application
      "Isolation murs (ITI)": 0.45, // doublage isolant + finition
      "Isolation combles": 0.25,    // soufflage ou déroulage
      "Parquet / Sol stratifié": 0.35, // pose flottante ou collée
      "Plomberie": 0,               // forfait — pas au m²
      "Électricité": 0,             // forfait — pas au m²
      "Maçonnerie": 0.6,            // murs, reprises, ouvertures
      "Couverture / Toiture": 0.7,  // dépose + repose tuiles/ardoises
      "Menuiserie": 0,              // forfait — par unité
      "Façade / Ravalement": 0.5,   // échafaudage + enduit/peinture
    };

    // Forfaits pour métiers non surfaciques (h par intervention standard)
    const FORFAITS = {
      "Plomberie": 8,     // 1 journée type (remplacement sanitaires, etc.)
      "Électricité": 8,   // 1 journée type (tableau + prises pièce)
      "Menuiserie": 4,    // par unité (porte, fenêtre)
    };

    const tempsM2 = TEMPS_PAR_TYPE[rentaType] ?? 0.5;
    const heures = tempsM2 > 0 ? surf * tempsM2 : (FORFAITS[rentaType] || 8);
    const mo = heures * taux;

    // Charges sociales selon statut juridique
    const TAUX_CHARGES = {
      "Micro-entreprise": 0.22,    // 22% URSSAF artisan BIC
      "Auto-entrepreneur": 0.22,   // identique micro
      "EIRL": 0.35,                // ~35% charges RSI
      "SARL / SAS": 0.45,          // ~45% charges patronales + salariales gérant
      "Entreprise individuelle": 0.40, // ~40% cotisations TNS
    };
    const tauxCharges = TAUX_CHARGES[rentaStatut] ?? 0.22;

    // Frais généraux : 10% du CA (assurance, véhicule, outillage, comptable)
    const ca_total = mo + mat + dep;
    const charges = mo * tauxCharges;
    const fraisGeneraux = ca_total * 0.10;
    const benef = ca_total - mat - dep - charges - fraisGeneraux;
    const marge = ca_total > 0 ? Math.round((benef / ca_total) * 100) : 0;

    setRentaResult({
      heures: Math.round(heures * 10) / 10,
      mo: Math.round(mo),
      ca_total: Math.round(ca_total),
      charges: Math.round(charges),
      frais_generaux: Math.round(fraisGeneraux),
      benef: Math.round(benef),
      marge,
      prix_m2: surf > 0 ? Math.round(ca_total / surf) : 0,
      type_travaux: rentaType,
      statut: rentaStatut,
      taux_charges_pct: Math.round(tauxCharges * 100),
    });
  }, [rentaSurface, rentaTaux, rentaMat, rentaDep, rentaType, rentaStatut]);

  // ── Revenus du foyer pour MaPrimeRénov' ──────────────────
  const [dpeRevenu, setDpeRevenu] = useState("Modeste");
  const [dpeTravaux, setDpeTravaux] = useState("Isolation combles");

  const calcDPE = useCallback(() => {
    const s = parseFloat(dpeS) || 75;

    // ── MaPrimeRénov' 2026 — barèmes réels par geste + profil couleur ──
    // Sources : hellio.com, effy.fr, quelleenergie.fr — profils Bleu/Jaune/Violet, Rose EXCLU
    // Très modeste=Bleu, Modeste=Jaune, Intermédiaire=Violet, Aisé=Rose (exclu parcours par geste)
    const BAREME_MPR = {
      "Isolation combles": { "Très modeste": 25, "Modeste": 20, "Intermédiaire": 15, "Aisé": 0 },           // €/m² — Bleu/Jaune/Violet, Rose exclu
      "Isolation murs (ITI/ITE)": { "Très modeste": 0, "Modeste": 0, "Intermédiaire": 0, "Aisé": 0 },       // ⛔ ITE+ITI SUPPRIMÉS en monogeste 2026
      "Isolation plancher bas": { "Très modeste": 20, "Modeste": 15, "Intermédiaire": 10, "Aisé": 0 },       // €/m²
      "PAC air/eau": { "Très modeste": 5000, "Modeste": 4000, "Intermédiaire": 3000, "Aisé": 0 },           // forfait — Rose exclu
      "PAC géothermique": { "Très modeste": 11000, "Modeste": 9000, "Intermédiaire": 6000, "Aisé": 0 },      // forfait revalorisé 2026
      "VMC double flux": { "Très modeste": 2500, "Modeste": 2000, "Intermédiaire": 1500, "Aisé": 0 },        // forfait — Rose exclu
      "Fenêtres / Vitrages": { "Très modeste": 100, "Modeste": 80, "Intermédiaire": 40, "Aisé": 0 },        // par équipement — Rose exclu
      "Chauffe-eau thermodynamique": { "Très modeste": 1200, "Modeste": 800, "Intermédiaire": 400, "Aisé": 0 }, // forfait
      "Poêle à granulés": { "Très modeste": 1250, "Modeste": 800, "Intermédiaire": 400, "Aisé": 0 },         // poêle à bois barème 2026
    };

    // Calcul MaPrimeRénov'
    const baremeGeste = BAREME_MPR[dpeTravaux] || BAREME_MPR["Isolation combles"];
    const montantUnitaire = baremeGeste[dpeRevenu] || baremeGeste["Modeste"];
    const gestesSurfaciques = ["Isolation combles", "Isolation murs (ITI/ITE)", "Isolation plancher bas"];
    const gesteFenetres = dpeTravaux === "Fenêtres / Vitrages";
    let prime;
    if (gestesSurfaciques.includes(dpeTravaux)) {
      prime = Math.round(montantUnitaire * s);
    } else if (gesteFenetres) {
      const nbFenetres = Math.max(1, Math.round(s / 15)); // estimation 1 fenêtre / 15m²
      prime = Math.round(montantUnitaire * nbFenetres);
    } else {
      prime = montantUnitaire; // forfait
    }
    // Plafond annuel MaPrimeRénov' 2026 = 20 000€
    prime = Math.min(prime, 20000);

    // ── CEE 2026 — estimation par type (revalorisées, sources primesenergie.fr/hellowatt.fr) ──
    const CEE_BAREMES = {
      "Isolation combles": 12,        // €/m² (~10-15€/m², BAR-EN-101)
      "Isolation murs (ITI/ITE)": 20, // €/m² (~15-25€/m², BAR-EN-102)
      "Isolation plancher bas": 12,   // €/m² (BAR-EN-103)
      "PAC air/eau": 4000,            // forfait revalorisé +1 000€ (BAR-TH-104)
      "PAC géothermique": 6000,       // forfait revalorisé +2 000€
      "VMC double flux": 500,         // forfait (BAR-TH-125)
      "Fenêtres / Vitrages": 50,     // par fenêtre
      "Chauffe-eau thermodynamique": 150, // forfait (BAR-TH-148)
      "Poêle à granulés": 800,        // forfait (BAR-TH-112)
    };
    const ceeUnit = CEE_BAREMES[dpeTravaux] || 12;
    let cee;
    if (gestesSurfaciques.includes(dpeTravaux)) {
      cee = Math.round(ceeUnit * s);
    } else if (gesteFenetres) {
      cee = Math.round(ceeUnit * Math.max(1, Math.round(s / 15)));
    } else {
      cee = ceeUnit;
    }

    // ── Économies annuelles estimées selon chauffage ──
    // Dépend du type de chauffage et du poste de travaux
    const ECO_PAR_TYPE = {
      "Gaz naturel": 0.12,     // €/kWh
      "Électricité": 0.22,     // €/kWh
      "Fioul": 0.15,           // €/kWh
      "Bois / Granulés": 0.07, // €/kWh
      "PAC": 0.08,             // €/kWh (COP ~3)
    };
    const prixKwh = ECO_PAR_TYPE[dpeC] || 0.12;
    // Gain moyen en kWh/m²/an selon le poste
    const GAINS_KWH = {
      "Isolation combles": 45,       // ~25-30% des déperditions
      "Isolation murs (ITI/ITE)": 35, // ~20-25%
      "Isolation plancher bas": 15,   // ~7-10%
      "PAC air/eau": 80,             // remplacement chaudière gaz → PAC COP 4
      "PAC géothermique": 100,
      "VMC double flux": 20,
      "Fenêtres / Vitrages": 25,
      "Chauffe-eau thermodynamique": 30,
      "Poêle à granulés": 40,
    };
    const gainKwh = GAINS_KWH[dpeTravaux] || 30;
    const eco = Math.round(s * gainKwh * prixKwh);

    setDpeRes({
      prime,
      cee,
      total: prime + cee,
      eco,
      revenu: dpeRevenu,
      travaux: dpeTravaux,
      chauffage: dpeC,
      alerte_ite: dpeTravaux === "Isolation murs (ITI/ITE)" ? "ITE ET ITI en monogeste supprimées de MaPrimeRénov' 2026 — privilégiez le parcours accompagné (rénovation d'ampleur)" : null,
      alerte_rdv: "RDV France Rénov' OBLIGATOIRE avant tout dépôt MaPrimeRénov' 2026 — france-renov.gouv.fr ou 0 808 800 700",
    });
  }, [dpeS, dpeC, dpeRevenu, dpeTravaux]);

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
      const res = parseAIJson(data?.content?.[0]?.text);
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
      genererCRPDFLocal(p, parseAIJson(data?.content?.[0]?.text));
    } catch (e) { alert("Erreur CR : " + e.message); }
    finally { setCrLoading(false); }
  }, [apiKey, profilIA]);

  // ── PDFs (lazy-loaded — jsPDF + html2canvas chargés à la demande) ──
  const exportChatPDF = useCallback(() => {
    _exportChatPDF({ msgs, curIA, IAS, profilPDFLabel: profilPDFLabel() });
  }, [msgs, curIA, profilPDFLabel]);

  const genererPDF = useCallback(() => {
    genererCertificatPDF({ certNorme, certProjet, certProp, certArtisan, certSurface });
  }, [certNorme, certProjet, certProp, certArtisan, certSurface]);

  const genererDevisProPDF = useCallback(() => {
    _genererDevisProPDF({ devisProResult, devisProClient });
  }, [devisProResult, devisProClient]);

  const genererCRPDFLocal = useCallback((projet, cr) => {
    genererCRPDF({ projet, cr, profilPDFLabel: profilPDFLabel() });
  }, [profilPDFLabel]);

  // ── Context value ─────────────────────────────────────────────
  const value = {
    IS_DEV,
    // State
    theme, setTheme,
    page, setPage,
    apiKey, setApiKey, showKey, setShowKey, keyInput, setKeyInput, keyErr, setKeyErr,
    curDiv, setCurDiv, curIA, setCurIA, msgs, setMsgs, hist, setHist, input, setInput, loading, errMsg,
    store, setStore,
    dpeS, setDpeS, dpeT, setDpeT, dpeC, setDpeC, dpeRes, dpeRevenu, setDpeRevenu, dpeTravaux, setDpeTravaux,
    scanLoading, scanResult, setScanResult, scanIA, setScanIA, scannerTab, setScannerTab,
    arModeType, setArModeType, arAnchor, setArAnchor, arTilt, arShelfType, setArShelfType, showArAdvisor, setShowArAdvisor, arAdvInput, setArAdvInput, arAdvResult, arAdvLoading,
    certProjet, setCertProjet, certNorme, setCertNorme, certSurface, setCertSurface, certProp, setCertProp, certArtisan, setCertArtisan,
    rgpdOk, setRgpdOk, msgCount, showPaywall, setShowPaywall, isPremium, setIsPremium, onboardingDone, setOnboardingDone, onboardingStep, setOnboardingStep, userType, setUserType, pdgUnlocked, pinInput, pinError,
    toolTab, setToolTab, devisText, setDevisText, devisResult, devisLoading, calcType, setCalcType, calcSurface, setCalcSurface, calcHauteur, setCalcHauteur, calcPente, setCalcPente, calcLongueur, setCalcLongueur, calcResult, calcLoading,
    artisanNom, setArtisanNom, artisanSpec, setArtisanSpec, artisanResult, artisanLoading,
    primesRev, setPrimesRev, primesTrav, setPrimesTrav, primesSurf, setPrimesSurf, primesResult, primesLoading,
    counterDevis, setCounterDevis, counterLoading, planningType, setPlanningType, planningBudget, setPlanningBudget, planningResult, planningLoading,
    devisProDesc, setDevisProDesc, devisProClient, setDevisProClient, devisProSurface, setDevisProSurface, devisProResult, devisProLoading,
    rentaSurface, setRentaSurface, rentaTaux, setRentaTaux, rentaMat, setRentaMat, rentaDep, setRentaDep, rentaResult, rentaType, setRentaType, rentaStatut, setRentaStatut,
    projets, setProjets, projetNom, setProjetNom, projetType, setProjetType, projetNotes, setProjetNotes,
    projetChat, setProjetChat, projetChatMsgs, projetChatInput, setProjetChatInput, projetChatLoading, crLoading,
    voiceActive,
    // Refs
    msgsRef, arAnchorRef, arModeRef, arTiltRef, arShelfTypeRef,
    // Computed
    currentIA, chips,
    // Functions
    goPage, switchDiv, switchIA, activerIA, send, sendWithPhoto, rateMsg,
    analyserPhoto,
    startVoice, startUrgence, handlePin, handlePinDel,
    analyserDevis, genererContreDevis, calculerMateriaux, calculerPrimes, verifierArtisan,
    planifierChantier, genererDevisPro, calculerRentabilite, calcDPE, suggestShelf,
    ajouterProjet, supprimerProjet, ouvrirProjetChat, sendProjetChat, genererCRChantier,
    exportChatPDF, genererPDF, genererDevisProPDF, genererCRPDF: genererCRPDFLocal,
    profilIA, profilPDFLabel, rangColor, saveConv, loadConv, welcomeMsg,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
