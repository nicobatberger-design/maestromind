// Rate limiting en mémoire (par IP, reset entre cold starts)
const rateMap = new Map();
const RATE_LIMIT = 30; // max requêtes par minute par IP
const RATE_WINDOW = 60000; // 1 minute

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

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }
  if (req.method !== "POST") {
    return Response.json({ error: { message: "Method not allowed" } }, { status: 405 });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-nf-client-connection-ip") || "unknown";
  if (!checkRate(ip)) {
    return Response.json({ error: { message: "Trop de requêtes. Réessayez dans quelques secondes." } }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ error: { message: "Clé API non configurée sur le serveur." } }, { status: 500 });

  let body;
  try { body = await req.json(); } catch { return Response.json({ error: { message: "JSON invalide." } }, { status: 400 }); }
  if (!body || !body.messages) return Response.json({ error: { message: "Corps de requête invalide." } }, { status: 400 });

  // Sécurité : limiter max_tokens et forcer le modèle
  body.max_tokens = Math.min(body.max_tokens || 1000, 2000);
  body.model = "claude-sonnet-4-20250514";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch (err) {
    return Response.json({ error: { message: "Erreur proxy : " + err.message } }, { status: 502 });
  }
};

export const config = { path: "/api/anthropic" };
