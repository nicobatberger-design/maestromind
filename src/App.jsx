import { lazy, Suspense, useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import s from "./styles/index";
import { useRappelsToast, RappelToast } from "./components/RappelsChantier";

// Chargés immédiatement (écrans d'entrée)
import OnboardingScreen from "./components/OnboardingScreen";
import PinScreen from "./components/PinScreen";
import Header from "./components/Header";
import NavBar from "./components/NavBar";
import Toast, { NetworkBanner } from "./components/Toast";

// Chargés à la demande (code splitting)
const HomePage = lazy(() => import("./components/HomePage"));
const CoachPage = lazy(() => import("./components/CoachPage"));
const ScannerPage = lazy(() => import("./components/ScannerPage"));
const ShopPage = lazy(() => import("./components/ShopPage"));
const CertPage = lazy(() => import("./components/CertPage"));
const OutilsPage = lazy(() => import("./components/OutilsPage"));
const ProjetsPage = lazy(() => import("./components/ProjetsPage"));
const DashboardPage = lazy(() => import("./components/DashboardPage"));
const AuthPage = lazy(() => import("./components/AuthPage"));
const SettingsPage = lazy(() => import("./components/SettingsPage"));
import SearchOverlay from "./components/SearchOverlay";
const ProjetChatOverlay = lazy(() => import("./components/ProjetChatOverlay"));
const PaywallOverlay = lazy(() => import("./components/PaywallOverlay"));
const RgpdBanner = lazy(() => import("./components/RgpdBanner"));
const InstallPrompt = lazy(() => import("./components/InstallPrompt"));

function LazyFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(201,168,76,0.5)", fontSize: 12 }}>
      Chargement...
    </div>
  );
}

// Splash screen animé au lancement
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("in"); // "in" → "out" → done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("out"), 1000);
    const t2 = setTimeout(() => onDone(), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "#06080D",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      animation: phase === "in" ? "splashFadeIn 0.5s ease-out forwards" : "splashFadeOut 0.5s ease-in forwards",
    }}>
      {/* Injection des keyframes */}
      <style>{`
        @keyframes splashFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes splashFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes splashLogoScale { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Logo carré doré avec M */}
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "splashLogoScale 0.5s ease-out forwards",
      }}>
        <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 28, color: "#06080D" }}>M</span>
      </div>

      {/* Nom */}
      <h1 style={{
        fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 22,
        background: "linear-gradient(135deg,#EDD060,#C9A84C,#7A6030)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        margin: "16px 0 6px",
        animation: "splashLogoScale 0.5s ease-out 0.15s both",
      }}>MAESTROMIND</h1>

      {/* Sous-titre */}
      <p style={{
        fontFamily: "DM Sans,sans-serif", fontWeight: 400, fontSize: 13,
        color: "rgba(240,237,230,0.45)", margin: 0,
        animation: "splashLogoScale 0.5s ease-out 0.3s both",
      }}>IA Bâtiment</p>
    </div>
  );
}

function AppContent() {
  const { onboardingDone, showPinOverlay, theme, modeChantier, goPage, switchIA, switchDiv } = useApp();
  const { toast, dismissToast } = useRappelsToast();
  const [showSearch, setShowSearch] = useState(false);
  // Splash au retour d'un utilisateur déjà onboardé (1x par session)
  const [showSplash, setShowSplash] = useState(() => {
    if (!localStorage.getItem("bl_onboarded")) return false; // Nouveaux users → onboarding directement
    if (sessionStorage.getItem("mm_splash_done")) return false;
    return true;
  });
  const handleSplashDone = useState(() => () => { setShowSplash(false); try { sessionStorage.setItem("mm_splash_done", "1"); } catch {} })[0];

  if (showSplash) return <SplashScreen onDone={handleSplashDone} />;

  // Raccourcis clavier globaux
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K / Cmd+K → ouvrir/fermer la recherche
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
      // Escape → fermer la recherche si ouverte
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  if (!onboardingDone) return <OnboardingScreen />;

  return (
    <>
      <RappelToast toast={toast} onDismiss={dismissToast} />
      <NetworkBanner />
      <div className={modeChantier ? "mode-chantier" : ""} style={s.app} data-theme={theme}>
        <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.09) 0%,transparent 70%)", pointerEvents: "none", animation: "orbFloat 7s ease-in-out infinite", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: 60, right: -80, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(82,144,224,0.05) 0%,transparent 70%)", pointerEvents: "none", animation: "orbFloat 9s ease-in-out infinite 1.5s", zIndex: 0 }} />

        <Header onSearchClick={() => setShowSearch(true)} />

        <div style={s.pages}>
          <Suspense fallback={<LazyFallback />}>
            <HomePage />
            <CoachPage />
            <ScannerPage />
            <ShopPage />
            <CertPage />
            <OutilsPage />
            <ProjetsPage />
            <DashboardPage />
            <AuthPage />
            <SettingsPage />
          </Suspense>
        </div>

        <NavBar />
        <Toast />
      </div>

      <Suspense fallback={null}>
        <ProjetChatOverlay />
        <PaywallOverlay />
        <RgpdBanner />
        <InstallPrompt />
      </Suspense>

      {showPinOverlay && <PinScreen overlay />}
      <SearchOverlay visible={showSearch} onClose={() => setShowSearch(false)} onSelectIA={(key, isDiv) => { if (isDiv) { switchDiv(key); } else { switchIA(key); } goPage("coach"); }} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
