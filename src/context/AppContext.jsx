import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IAS } from "../data/constants";
import { apiURL, apiHeaders, withRetry, streamChat } from "../utils/api";
import { exportChatPDF as _exportChatPDF, genererCertificatPDF, genererDevisProPDF as _genererDevisProPDF, genererCRPDF } from "../utils/pdf";
import { useUserState } from "./useUserState";
import { useChatState } from "./useChatState";
import { useToolsState } from "./useToolsState";
import { useDiagnosticState } from "./useDiagnosticState";

const IS_DEV = import.meta.env.DEV;

const ROUTE_TO_PAGE = { "/": "home", "/coach": "coach", "/scanner": "scanner", "/shop": "shop", "/cert": "cert", "/outils": "outils", "/projets": "projets", "/dashboard": "dashboard" };
const PAGE_TO_ROUTE = { home: "/", coach: "/coach", scanner: "/scanner", shop: "/shop", cert: "/cert", outils: "/outils", projets: "/projets", dashboard: "/dashboard" };

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Navigation ────────────────────────────────────────────────
  const [page, setPage] = useState(() => ROUTE_TO_PAGE[location.pathname] || "home");

  useEffect(() => {
    const p = ROUTE_TO_PAGE[location.pathname];
    if (p && p !== page) setPage(p);
  }, [location.pathname]);

  // ── API key (dev only) ────────────────────────────────────────
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("maestromind_key") || "");
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyErr, setKeyErr] = useState("");

  useEffect(() => { if (IS_DEV && !apiKey) setShowKey(true); }, [apiKey]);

  const activerIA = useCallback(() => {
    if (!keyInput.startsWith("sk-ant")) { setKeyErr("Cl\u00e9 invalide \u2014 doit commencer par sk-ant-"); return; }
    setKeyErr("");
    setApiKey(keyInput);
    localStorage.setItem("maestromind_key", keyInput);
    setShowKey(false);
  }, [keyInput]);

  // ── Boutique ──────────────────────────────────────────────────
  const [store, setStore] = useState("leroy");

  // ── Theme ────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem("mm_theme") || "dark");
  useEffect(() => { localStorage.setItem("mm_theme", theme); }, [theme]);

  // ── Certificat ────────────────────────────────────────────────
  const [certProjet, setCertProjet] = useState("Cloison BA13");
  const [certNorme, setCertNorme] = useState("DTU 25.41 \u2014 Cloisons pl\u00e2tre");
  const [certSurface, setCertSurface] = useState("10");
  const [certProp, setCertProp] = useState("");
  const [certArtisan, setCertArtisan] = useState("");

  // ── Projets ───────────────────────────────────────────────────
  const [projets, setProjets] = useState(() => { try { return JSON.parse(localStorage.getItem("bl_projets") || "[]"); } catch { return []; } });
  const [projetNom, setProjetNom] = useState("");
  const [projetType, setProjetType] = useState("R\u00e9novation");
  const [projetNotes, setProjetNotes] = useState("");
  const [projetChat, setProjetChat] = useState(null);
  const [projetChatMsgs, setProjetChatMsgs] = useState([]);
  const [projetChatInput, setProjetChatInput] = useState("");
  const [projetChatLoading, setProjetChatLoading] = useState(false);
  const [crLoading, setCrLoading] = useState(false);

  // ── CR Journalier ───────────────────────────────────────────
  const [crJournalierResult, setCrJournalierResult] = useState(null);
  const [crJournalierLoading, setCrJournalierLoading] = useState(false);
  const [showCRJournalier, setShowCRJournalier] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // ── Sub-hooks ─────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  const userState = useUserState();
  const { userType, msgCount, setMsgCount, isPremium, showPaywall, setShowPaywall, profilIA, profilPDFLabel } = userState;

  // goPage needs chat state, but chat state needs goPage → use a ref to break the cycle
  const goPageRef = useRef(null);

  const chatState = useChatState({
    userType, msgCount, setMsgCount, isPremium, showPaywall, setShowPaywall, profilIA,
    apiKey, goPageRef,
  });
  const { curIA, msgs, setMsgs, setHist, setErrMsg, welcomeMsg, saveConv } = chatState;

  const toolsState = useToolsState({ apiKey, profilIA });
  const { devisProResult, devisProClient } = toolsState;

  const diagnosticState = useDiagnosticState({ apiKey });

  // ── Navigation (goPage) ───────────────────────────────────────
  const goPage = useCallback((p) => {
    setPage(p);
    const route = PAGE_TO_ROUTE[p] || "/";
    if (location.pathname !== route) navigate(route);
    if (p === "coach") {
      setMsgs([{ role: "ai", text: welcomeMsg(curIA, userType) }]);
      setHist([]);
      setErrMsg("");
    }
  }, [page, curIA, userType, welcomeMsg, navigate, location.pathname, setMsgs, setHist, setErrMsg]);

  // Wire the ref so useChatState.startUrgence can call goPage
  useEffect(() => { goPageRef.current = goPage; }, [goPage]);

  // ── Helpers ───────────────────────────────────────────────────
  const rangColor = (rang) => {
    if (rang === "G\u00e9n\u00e9ral") return "#C9A84C";
    if (rang === "Colonel") return "#52C37A";
    if (rang === "Capitaine") return "#5290E0";
    return "#888780";
  };

  // ── Projets functions ─────────────────────────────────────────
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
    setProjetChatMsgs([{ role: "ai", text: "\uD83C\uDFD7 Je connais votre projet \"" + p.nom + "\" (" + p.type + "). " + (p.notes ? "Notes : " + p.notes + " \u2014 " : "") + "Posez-moi toutes vos questions sur ce chantier." }]);
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
      const body = { model: "claude-sonnet-4-20250514", max_tokens: 900,
        system: "Tu es l'assistant IA d\u00e9di\u00e9 \u00e0 ce projet \u2014 Nom : " + projetChat.nom + ". Type : " + projetChat.type + ". Date : " + projetChat.date + ". Statut : " + projetChat.statut + ". Notes : " + (projetChat.notes || "aucune") + ". Expert b\u00e2timent, normes DTU. R\u00e9ponds de fa\u00e7on concise et pratique.\n" + profilIA(),
        messages: newMsgs.filter(m => m.text !== "...").map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })).slice(-8) };
      const rep = await streamChat({ apiKey, body, onToken: (partial) => {
        setProjetChatMsgs([...newMsgs, { role: "ai", text: partial }]);
      }});
      setProjetChatMsgs([...newMsgs, { role: "ai", text: rep }]);
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
          system: `${profilIA()}\nTu es expert en compte-rendu de chantier. R\u00e9ponds UNIQUEMENT en JSON valide : {"avancement":"X%","travaux_realises":["travail 1"],"travaux_restants":["travail 1"],"observations":["observation 1"],"prochaine_intervention":"description","reserves":["r\u00e9serve ou vide"]}`,
          messages: [{ role: "user", content: "Projet : " + p.nom + "\nType : " + p.type + "\nDate : " + p.date + "\nStatut : " + p.statut + "\nNotes : " + (p.notes || "aucune") + "\nG\u00e9n\u00e8re le compte-rendu." }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      const clean = (data?.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(clean); } catch {
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
        else throw new Error("R\u00e9ponse IA invalide. R\u00e9essayez.");
      }
      genererCRPDFLocal(p, parsed);
    } catch (e) { alert("Erreur CR : " + e.message); }
    finally { setCrLoading(false); }
  }, [apiKey, profilIA]);

  // ── CR Journalier ───────────────────────────────────────────
  const genererCRJournalier = useCallback(async () => {
    setCrJournalierLoading(true);
    setCrJournalierResult(null);
    setShowCRJournalier(true);
    try {
      const today = new Date().toLocaleDateString("fr-FR");
      const analysisCount = parseInt(localStorage.getItem("mm_analysis_count") || "0");
      const body = {
        model: "claude-sonnet-4-20250514", max_tokens: 1000,
        system: IAS.crJournalier.sys + "\n" + profilIA(),
        messages: [{ role: "user", content: "Date : " + today + "\nProfil : " + userType + "\nNombre d'analyses realisees : " + analysisCount + "\nGenere le compte-rendu de fin de journee." }],
      };
      const rep = await streamChat({ apiKey, body, onToken: (partial) => {
        setCrJournalierResult(partial);
      }});
      setCrJournalierResult(rep);
    } catch (e) {
      setCrJournalierResult("Erreur : " + e.message);
    } finally {
      setCrJournalierLoading(false);
    }
  }, [apiKey, profilIA, userType]);

  // ── PDFs ──────────────────────────────────────────────────────
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
    // Navigation & Theme
    theme, setTheme,
    page, setPage,
    goPage,
    // API key
    apiKey, setApiKey, showKey, setShowKey, keyInput, setKeyInput, keyErr, setKeyErr,
    activerIA,
    // Boutique
    store, setStore,
    // Certificat
    certProjet, setCertProjet, certNorme, setCertNorme, certSurface, setCertSurface, certProp, setCertProp, certArtisan, setCertArtisan,
    // Projets
    projets, setProjets, projetNom, setProjetNom, projetType, setProjetType, projetNotes, setProjetNotes,
    projetChat, setProjetChat, projetChatMsgs, projetChatInput, setProjetChatInput, projetChatLoading, crLoading,
    ajouterProjet, supprimerProjet, ouvrirProjetChat, sendProjetChat, genererCRChantier,
    // PDFs
    exportChatPDF, genererPDF, genererDevisProPDF, genererCRPDF: genererCRPDFLocal,
    // CR Journalier
    crJournalierResult, crJournalierLoading, showCRJournalier, setShowCRJournalier, genererCRJournalier,
    // Misc
    rangColor,
    // ── Spread sub-hooks ──────────────────────────────────────
    ...userState,
    ...chatState,
    ...toolsState,
    ...diagnosticState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
