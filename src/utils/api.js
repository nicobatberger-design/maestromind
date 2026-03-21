const IS_DEV = import.meta.env.DEV;

export function apiURL() {
  return IS_DEV ? "https://api.anthropic.com/v1/messages" : "https://maestromind.vercel.app/api/anthropic";
}

export function apiHeaders(apiKey) {
  return IS_DEV
    ? { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" }
    : { "Content-Type": "application/json" };
}

export async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      // Ne pas réessayer sur erreurs d'authentification
      if (e.message?.includes("401") || e.message?.includes("403") || e.message?.includes("Clé API")) throw e;
      if (i === retries - 1) throw e;
      // Attente plus longue sur rate limit (429)
      const delai = e.message?.includes("429") || e.message?.includes("Trop de requêtes") ? 5000 : 1000 * Math.pow(2, i);
      await new Promise(r => setTimeout(r, delai));
    }
  }
}

/**
 * Streaming fetch — lit les SSE Anthropic et appelle onToken(texte_accumulé) à chaque chunk.
 * Retourne le texte complet à la fin.
 */
export async function streamChat({ apiKey, body, onToken }) {
  const headers = apiHeaders(apiKey);
  // Timeout 30s pour éviter les requêtes qui restent bloquées
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 30000);
  let r;
  try {
    r = await fetch(apiURL(), {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, stream: true }),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    // Erreur réseau (offline, DNS, etc.)
    if (e instanceof TypeError || e.name === "TypeError") throw new Error("Pas de connexion internet");
    if (e.name === "AbortError") throw new Error("Délai dépassé — réessayez");
    throw e;
  }
  if (!r.ok) {
    // Tenter de lire le JSON, sinon gérer les pages HTML d'erreur
    let msg = "";
    try {
      const ct = r.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await r.json();
        msg = data?.error?.message || "";
      }
    } catch { /* réponse non-JSON ignorée */ }
    if (r.status === 429) throw new Error("429 — Trop de requêtes — patientez quelques secondes");
    if (r.status === 401 || r.status === 403) throw new Error(r.status + " — Clé API invalide ou expirée");
    if (r.status >= 500) throw new Error(r.status + " — Serveur temporairement indisponible — réessayez");
    throw new Error(msg || "Erreur API " + r.status);
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let acc = "";
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw);
        if (evt.type === "content_block_delta" && evt.delta?.text) {
          acc += evt.delta.text;
          onToken(acc);
        }
      } catch {}
    }
  }
  clearTimeout(timeout);
  return acc || "Désolé, réessayez.";
}

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
