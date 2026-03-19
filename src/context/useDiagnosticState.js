import { useState, useRef, useEffect, useCallback } from "react";
import { IAS } from "../data/constants";
import { apiURL, apiHeaders, withRetry } from "../utils/api";

function parseAIJson(text) {
  const clean = (text || "").replace(/```json|```/g, "").trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error("R\u00e9ponse IA invalide. R\u00e9essayez.");
}

export function useDiagnosticState({ apiKey }) {
  // ── DPE ───────────────────────────────────────────────────────
  const [dpeS, setDpeS] = useState(75);
  const [dpeT, setDpeT] = useState("Appartement");
  const [dpeC, setDpeC] = useState("Gaz naturel");
  const [dpeRes, setDpeRes] = useState(null);
  const [dpeRevenu, setDpeRevenu] = useState("Modeste");
  const [dpeTravaux, setDpeTravaux] = useState("Isolation combles");

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

  // ── Refs ──────────────────────────────────────────────────────
  const arAnchorRef = useRef(null);
  const arModeRef = useRef("etagere");
  const arTiltRef = useRef({ beta: 0, gamma: 0 });
  const arShelfTypeRef = useRef("flottante");

  // ── Effects ──────────────────────────────────────────────────
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

  // ── Analyser Photo (Scanner) ──────────────────────────────────
  const analyserPhoto = useCallback(async (dataUrl, iaKey) => {
    setScanLoading(true);
    setScanResult(null);
    const ia = iaKey || scanIA;
    const base64 = dataUrl.split(",")[1];
    const mediaType = (dataUrl.split(";")[0].split(":")[1] || "image/jpeg");
    const sysScan = IAS[ia].sys + " Analyse la photo fournie et r\u00e9ponds UNIQUEMENT en JSON valide (aucun texte hors JSON) : {\"urgence\":\"MODERE\",\"titre\":\"Titre court\",\"etapes\":[\"etape 1\",\"etape 2\",\"etape 3\"],\"materiaux\":[\"Mat\u00e9riau identifi\u00e9\"],\"cout_estime\":\"100-300\u20ac\",\"delai\":\"1-2 jours\",\"reference_dtu\":\"DTU XX.X\",\"conseils_pro\":\"Conseil cl\u00e9\"}. Urgences : BAS, MODERE, URGENT, DANGER.";
    try {
      const r = await fetch(apiURL(), {
        method: "POST",
        headers: apiHeaders(apiKey),
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: sysScan,
          messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }, { type: "text", text: "Analyse ce probl\u00e8me de b\u00e2timent." }] }]
        }),
      });
      const data = await r.json();
      if (data.error) throw new Error(data.error.message);
      setScanResult(parseAIJson(data?.content?.[0]?.text));
    } catch (e) {
      setScanResult({ urgence: "ERREUR", titre: "Analyse impossible", etapes: [e.message] });
    } finally { setScanLoading(false); }
  }, [apiKey, scanIA]);

  // ── DPE Calcul ────────────────────────────────────────────────
  const calcDPE = useCallback(() => {
    const s = parseFloat(dpeS) || 75;

    const BAREME_MPR = {
      "Isolation combles": { "Tr\u00e8s modeste": 25, "Modeste": 20, "Interm\u00e9diaire": 15, "Ais\u00e9": 0 },
      "Isolation murs (ITI/ITE)": { "Tr\u00e8s modeste": 0, "Modeste": 0, "Interm\u00e9diaire": 0, "Ais\u00e9": 0 },
      "Isolation plancher bas": { "Tr\u00e8s modeste": 20, "Modeste": 15, "Interm\u00e9diaire": 10, "Ais\u00e9": 0 },
      "PAC air/eau": { "Tr\u00e8s modeste": 5000, "Modeste": 4000, "Interm\u00e9diaire": 3000, "Ais\u00e9": 0 },
      "PAC g\u00e9othermique": { "Tr\u00e8s modeste": 11000, "Modeste": 9000, "Interm\u00e9diaire": 6000, "Ais\u00e9": 0 },
      "VMC double flux": { "Tr\u00e8s modeste": 2500, "Modeste": 2000, "Interm\u00e9diaire": 1500, "Ais\u00e9": 0 },
      "Fen\u00eatres / Vitrages": { "Tr\u00e8s modeste": 100, "Modeste": 80, "Interm\u00e9diaire": 40, "Ais\u00e9": 0 },
      "Chauffe-eau thermodynamique": { "Tr\u00e8s modeste": 1200, "Modeste": 800, "Interm\u00e9diaire": 400, "Ais\u00e9": 0 },
      "Po\u00eale \u00e0 granul\u00e9s": { "Tr\u00e8s modeste": 1250, "Modeste": 800, "Interm\u00e9diaire": 400, "Ais\u00e9": 0 },
    };

    const baremeGeste = BAREME_MPR[dpeTravaux] || BAREME_MPR["Isolation combles"];
    const montantUnitaire = baremeGeste[dpeRevenu] || baremeGeste["Modeste"];
    const gestesSurfaciques = ["Isolation combles", "Isolation murs (ITI/ITE)", "Isolation plancher bas"];
    const gesteFenetres = dpeTravaux === "Fen\u00eatres / Vitrages";
    let prime;
    if (gestesSurfaciques.includes(dpeTravaux)) {
      prime = Math.round(montantUnitaire * s);
    } else if (gesteFenetres) {
      const nbFenetres = Math.max(1, Math.round(s / 15));
      prime = Math.round(montantUnitaire * nbFenetres);
    } else {
      prime = montantUnitaire;
    }
    prime = Math.min(prime, 20000);

    const CEE_BAREMES = {
      "Isolation combles": 12, "Isolation murs (ITI/ITE)": 20, "Isolation plancher bas": 12,
      "PAC air/eau": 4000, "PAC g\u00e9othermique": 6000, "VMC double flux": 500,
      "Fen\u00eatres / Vitrages": 50, "Chauffe-eau thermodynamique": 150, "Po\u00eale \u00e0 granul\u00e9s": 800,
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

    const ECO_PAR_TYPE = {
      "Gaz naturel": 0.12, "\u00c9lectricit\u00e9": 0.22, "Fioul": 0.15,
      "Bois / Granul\u00e9s": 0.07, "PAC": 0.08,
    };
    const prixKwh = ECO_PAR_TYPE[dpeC] || 0.12;
    const GAINS_KWH = {
      "Isolation combles": 45, "Isolation murs (ITI/ITE)": 35, "Isolation plancher bas": 15,
      "PAC air/eau": 80, "PAC g\u00e9othermique": 100, "VMC double flux": 20,
      "Fen\u00eatres / Vitrages": 25, "Chauffe-eau thermodynamique": 30, "Po\u00eale \u00e0 granul\u00e9s": 40,
    };
    const gainKwh = GAINS_KWH[dpeTravaux] || 30;
    const eco = Math.round(s * gainKwh * prixKwh);

    setDpeRes({
      prime, cee, total: prime + cee, eco,
      revenu: dpeRevenu, travaux: dpeTravaux, chauffage: dpeC,
      alerte_ite: dpeTravaux === "Isolation murs (ITI/ITE)" ? "ITE ET ITI en monog\u00e8ste supprim\u00e9es de MaPrimeR\u00e9nov' 2026 \u2014 privil\u00e9giez le parcours accompagn\u00e9 (r\u00e9novation d'ampleur)" : null,
      alerte_rdv: "RDV France R\u00e9nov' OBLIGATOIRE avant tout d\u00e9p\u00f4t MaPrimeR\u00e9nov' 2026 \u2014 france-renov.gouv.fr ou 0 808 800 700",
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
          system: `Tu es un expert en d\u00e9coration et am\u00e9nagement int\u00e9rieur. L'utilisateur d\u00e9crit sa pi\u00e8ce ou son mur. Recommande le type d'\u00e9tag\u00e8re le plus adapt\u00e9 PARMI : flottante, industrielle, angle, console, cube. R\u00e9ponds UNIQUEMENT en JSON valide : {"type":"flottante","raison":"courte explication","dimensions":"L x H recommand\u00e9s","produit":"nom produit pr\u00e9cis","prix":"fourchette","ou":"enseigne (Leroy Merlin, IKEA ou Castorama)","url_keyword":"terme de recherche pour trouver le produit","conseils":"1 conseil pratique d'installation"}`,
          messages: [{ role: "user", content: arAdvInput }] }) }));
      const data = await r.json(); if (data.error) throw new Error(data.error.message);
      const res = parseAIJson(data?.content?.[0]?.text);
      setArAdvResult(res);
      if (res.type) { setArShelfType(res.type); arShelfTypeRef.current = res.type; }
    } catch (e) { setArAdvResult({ type: "flottante", raison: e.message, dimensions: "", produit: "", prix: "", ou: "", url_keyword: "", conseils: "" }); }
    finally { setArAdvLoading(false); }
  }, [apiKey, arAdvInput]);

  return {
    dpeS, setDpeS, dpeT, setDpeT, dpeC, setDpeC, dpeRes, dpeRevenu, setDpeRevenu, dpeTravaux, setDpeTravaux,
    scanLoading, scanResult, setScanResult, scanIA, setScanIA, scannerTab, setScannerTab,
    arModeType, setArModeType, arAnchor, setArAnchor, arTilt, arShelfType, setArShelfType, showArAdvisor, setShowArAdvisor, arAdvInput, setArAdvInput, arAdvResult, arAdvLoading,
    arAnchorRef, arModeRef, arTiltRef, arShelfTypeRef,
    analyserPhoto, calcDPE, suggestShelf,
  };
}
