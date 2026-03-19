const IS_DEV = import.meta.env.DEV;

export const PDG_PIN_HASH = import.meta.env.VITE_PDG_PIN_HASH || "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";

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
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}

/**
 * Streaming fetch — lit les SSE Anthropic et appelle onToken(texte_accumulé) à chaque chunk.
 * Retourne le texte complet à la fin.
 */
export async function streamChat({ apiKey, body, onToken }) {
  const headers = apiHeaders(apiKey);
  const r = await fetch(apiURL(), {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Erreur API " + r.status);
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
  return acc || "Désolé, réessayez.";
}

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
