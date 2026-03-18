import { lazy, Suspense } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import s from "./styles/index";

// Chargés immédiatement (écrans d'entrée)
import OnboardingScreen from "./components/OnboardingScreen";
import PinScreen from "./components/PinScreen";
import Header from "./components/Header";
import NavBar from "./components/NavBar";

// Chargés à la demande (code splitting)
const HomePage = lazy(() => import("./components/HomePage"));
const CoachPage = lazy(() => import("./components/CoachPage"));
const ScannerPage = lazy(() => import("./components/ScannerPage"));
const ShopPage = lazy(() => import("./components/ShopPage"));
const CertPage = lazy(() => import("./components/CertPage"));
const OutilsPage = lazy(() => import("./components/OutilsPage"));
const ProjetsPage = lazy(() => import("./components/ProjetsPage"));
const DashboardPage = lazy(() => import("./components/DashboardPage"));
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
  const { onboardingDone, pdgUnlocked } = useApp();

  if (!onboardingDone) return <OnboardingScreen />;
  if (!pdgUnlocked) return <PinScreen />;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes logoGlow { 0%,100% { box-shadow: 0 2px 14px rgba(201,168,76,0.45); } 50% { box-shadow: 0 2px 28px rgba(201,168,76,0.75), 0 0 48px rgba(201,168,76,0.18); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-18px) scale(1.06); } }
        @keyframes pinSuccess { 0% { transform:scale(1); } 40% { transform:scale(1.18); } 100%{ transform:scale(1); } }
        @keyframes voicePulse { 0%,100% { box-shadow: 0 0 0 0 rgba(224,82,82,0.4); } 50% { box-shadow: 0 0 0 8px rgba(224,82,82,0); } }
        .bl-msg { animation: fadeSlideUp 0.28s cubic-bezier(0.4,0,0.2,1) both; }
        .bl-fc:hover { border-color:rgba(201,168,76,0.28) !important; transform:translateY(-2px); box-shadow:0 6px 24px rgba(201,168,76,0.1), inset 0 1px 0 rgba(255,255,255,0.06) !important; }
        .bl-chip:hover{ background:rgba(201,168,76,0.09) !important; border-color:rgba(201,168,76,0.28) !important; color:#C9A84C !important; }
        .bl-pin:active { transform:scale(0.91) !important; background:rgba(201,168,76,0.18) !important; }
        * { -webkit-tap-highlight-color:transparent; }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      <div style={s.app}>
        <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle,rgba(201,168,76,0.09) 0%,transparent 70%)", pointerEvents: "none", animation: "orbFloat 7s ease-in-out infinite", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: 60, right: -80, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(82,144,224,0.05) 0%,transparent 70%)", pointerEvents: "none", animation: "orbFloat 9s ease-in-out infinite 1.5s", zIndex: 0 }} />

        <Header />

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
          </Suspense>
        </div>

        <NavBar />
      </div>

      <Suspense fallback={null}>
        <ProjetChatOverlay />
        <PaywallOverlay />
        <RgpdBanner />
        <InstallPrompt />
      </Suspense>
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
