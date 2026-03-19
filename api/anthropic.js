/**
 * MAESTROMIND — Proxy sécurisé Anthropic API (Vercel Serverless)
 * La clé API reste côté serveur, jamais exposée au client.
 */

// Rate limiting en mémoire (par IP, reset entre cold starts)
const rateMap = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60000;

function checkRate(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    rateMap.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed" } });

  // Rate limiting
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || "unknown";
  if (!checkRate(ip)) {
    return res.status(429).json({ error: { message: "Trop de requêtes. Réessayez dans quelques secondes." } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: "Clé API non configurée sur le serveur." } });

  const body = req.body;
  if (!body || !body.messages) return res.status(400).json({ error: { message: "Corps de requête invalide." } });

  // Sécurité : limiter la taille du payload (5MB max — photos base64 incluses)
  const payload = JSON.stringify(body);
  if (payload.length > 5 * 1024 * 1024) {
    return res.status(413).json({ error: { message: "Requête trop volumineuse (max 5MB)." } });
  }

  // Sécurité : limiter max_tokens et forcer le modèle
  body.max_tokens = Math.min(body.max_tokens || 1000, 2000);
  body.model = "claude-sonnet-4-20250514";
  const wantStream = !!body.stream;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ ...body, stream: wantStream }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // Streaming : pipe la réponse SSE directement au client
    if (wantStream && response.ok) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); return; }
          res.write(value);
        }
      };
      return pump();
    }

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    const msg = err.name === "AbortError" ? "Délai dépassé (30s). Réessayez." : "Erreur proxy : " + err.message;
    return res.status(502).json({ error: { message: msg } });
  }
}
