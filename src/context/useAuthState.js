import { useState, useEffect, useCallback } from "react";
import { supabase, signIn as _signIn, signUp as _signUp, signOut as _signOut, onAuthChange } from "../utils/supabase";

export function useAuthState() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Écoute les changements d'auth
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    const { data } = onAuthChange((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    // Vérifier la session au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });
    return () => data?.subscription?.unsubscribe();
  }, []);

  const isPremiumUser = user?.user_metadata?.premium === true;

  const login = useCallback(async (email, password) => {
    setAuthError("");
    try {
      await _signIn(email, password);
    } catch (e) {
      setAuthError(e.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : e.message);
      throw e;
    }
  }, []);

  const register = useCallback(async (email, password, nom) => {
    setAuthError("");
    try {
      await _signUp(email, password, nom);
    } catch (e) {
      const msg = e.message.includes("already registered") ? "Cet email est déjà utilisé" : e.message;
      setAuthError(msg);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthError("");
    await _signOut();
    setUser(null);
  }, []);

  return {
    user, authLoading, authError, setAuthError,
    isPremiumUser, login, register, logout,
    isSupabaseConfigured: !!supabase,
  };
}
