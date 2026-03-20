import { useState, useEffect, useRef } from "react";

/**
 * Hook de detection de l'etat reseau.
 * Retourne { isOnline, wasOffline } — wasOffline se reinitialise apres 5s.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Reset wasOffline apres 5s
      timerRef.current = setTimeout(() => setWasOffline(false), 5000);
    };

    const goOffline = () => {
      setIsOnline(false);
      // Annuler le timer si on repasse offline
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { isOnline, wasOffline };
}
