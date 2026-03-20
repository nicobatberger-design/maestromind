import { useState, useCallback } from "react";
import { PROFILS, PDG_PIN_HASH } from "../data/constants";
import { hashPin } from "../utils/api";

// Obfuscation compteur paywall (anti-triche localStorage)
const MC_KEY = "bl_mc_v2";
export function readMsgCount() {
  try {
    const raw = localStorage.getItem(MC_KEY);
    if (!raw) return 0;
    const n = parseInt(atob(raw), 10);
    return isNaN(n) ? 0 : n;
  } catch { return 0; }
}
export function writeMsgCount(n) {
  try { localStorage.setItem(MC_KEY, btoa(String(n))); } catch {}
}

export function useUserState() {
  // ── Auth / Onboarding ─────────────────────────────────────────
  const [rgpdOk, setRgpdOk] = useState(() => localStorage.getItem("rgpd_accepted") === "1");
  const [msgCount, setMsgCount] = useState(() => readMsgCount());
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
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // ── Mode Chantier ───────────────────────────────────────────
  const [modeChantier, setModeChantier] = useState(() => localStorage.getItem("mm_mode_chantier") === "1");

  // ── Helpers ───────────────────────────────────────────────────
  const profilIA = useCallback(() => ({
    "Particulier":  "PROFIL UTILISATEUR : Particulier / non-professionnel. Langage simple et accessible, pas de jargon sans explication. Indiquer quand il faut imp\u00e9rativement faire appel \u00e0 un professionnel.",
    "Artisan Pro":  "PROFIL UTILISATEUR : Professionnel du b\u00e2timent / artisan qualifi\u00e9. Langage technique complet, r\u00e9f\u00e9rences DTU obligatoires (num\u00e9ro + paragraphe), quantitatifs pr\u00e9cis, normes de mise en \u0153uvre, responsabilit\u00e9 d\u00e9cennale.",
    "Architecte":   "PROFIL UTILISATEUR : Architecte / Ma\u00eetre d'\u0153uvre. Prescriptions techniques de conception, coordination inter-corps d'\u00e9tat, r\u00e9glementation ERP/PMR, aspects administratifs (permis, AT, assurances MOE).",
    "Investisseur": "PROFIL UTILISATEUR : Investisseur immobilier. Focus ROI et valorisation du bien, estimations en \u20ac/m\u00b2, impact sur la valeur locative/v\u00e9nale, optimisation des aides financi\u00e8res cumulables.",
  }[userType] || ""), [userType]);

  const profilPDFLabel = useCallback(() => ({
    "Particulier":  "Document Particulier",
    "Artisan Pro":  "Document Professionnel",
    "Architecte":   "Document Ma\u00eetre d'\u0152uvre",
    "Investisseur": "Rapport Investisseur",
  }[userType] || "Document MAESTROMIND"), [userType]);

  // ── PIN ───────────────────────────────────────────────────────
  const handlePin = useCallback((d) => {
    if (pinInput.length >= 6) return;
    const np = pinInput + d;
    setPinInput(np);
    setPinError("");
    if (np.length === 6) {
      hashPin(np).then(hash => {
        if (hash === PDG_PIN_HASH) { setPdgUnlocked(true); setShowPinOverlay(false); }
        else { setTimeout(() => { setPinInput(""); setPinError("Code incorrect \u2014 r\u00e9essayez"); }, 400); }
      });
    }
  }, [pinInput]);

  const handlePinDel = useCallback(() => { setPinInput(p => p.slice(0, -1)); setPinError(""); }, []);

  return {
    rgpdOk, setRgpdOk,
    msgCount, setMsgCount,
    showPaywall, setShowPaywall,
    isPremium, setIsPremium,
    onboardingDone, setOnboardingDone,
    onboardingStep, setOnboardingStep,
    userType, setUserType,
    pdgUnlocked, showPinOverlay, setShowPinOverlay, pinInput, setPinInput, pinError, setPinError,
    profilIA, profilPDFLabel,
    handlePin, handlePinDel,
    modeChantier, setModeChantier,
  };
}
