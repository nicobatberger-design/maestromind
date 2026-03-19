const IS_DEV = import.meta.env.DEV;

export const PDG_PIN_HASH = import.meta.env.VITE_PDG_PIN_HASH || "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92";

export function apiURL() {
  return IS_DEV ? "https://api.anthropic.com/v1/messages" : "https://maestromind-maestromind.vercel.app/api/anthropic";
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

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
