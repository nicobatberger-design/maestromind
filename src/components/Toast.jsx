import { useState, useEffect } from "react";
import { useNetworkStatus } from "../utils/network";

let showToastFn = null;

export function triggerToast(message) {
  if (showToastFn) showToastFn(message);
}

/** Banniere reseau : hors-ligne (rouge) ou reconnecte (vert) */
export function NetworkBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnect(true);
      const t = setTimeout(() => setShowReconnect(false), 3000);
      return () => clearTimeout(t);
    }
    setShowReconnect(false);
  }, [isOnline, wasOffline]);

  if (isOnline && !showReconnect) return null;

  const offline = !isOnline;
  const bg = offline ? "rgba(224,82,82,0.95)" : "rgba(82,195,122,0.95)";
  const text = offline
    ? "\u26A1 Mode hors-ligne \u2014 les fonctions IA ne sont pas disponibles"
    : "\u2713 Connexion r\u00E9tablie";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0,
      background: bg, color: "#F0EDE6",
      padding: "10px 16px", fontSize: 13, fontWeight: 700,
      textAlign: "center", zIndex: 9999,
    }}>
      {text}
    </div>
  );
}

export default function Toast() {
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    showToastFn = (m) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 2500);
    };
    return () => { showToastFn = null; };
  }, []);

  if (!msg) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: "rgba(82,195,122,0.95)", color: "#06080D",
      padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700,
      zIndex: 300, boxShadow: "0 4px 20px rgba(82,195,122,0.3)",
    }}>
      {"\u2713"} {msg}
    </div>
  );
}
