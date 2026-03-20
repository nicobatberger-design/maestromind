import { lazy, Suspense, useState } from "react";
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

function AppContent() {
  const { onboardingDone, showPinOverlay, theme, modeChantier, goPage, switchIA, switchDiv } = useApp();
  const { toast, dismissToast } = useRappelsToast();
  const [showSearch, setShowSearch] = useState(false);

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
