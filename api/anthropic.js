/**
 * MAESTROMIND — Proxy sécurisé Anthropic API
 * La clé API reste côté serveur, jamais exposée au client.
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed" } });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: "Clé API non configurée sur le serveur." } });

  // Limite de taille de payload (sécurité)
  const body = req.body;
  if (!body || !body.messages) return res.status(400).json({ error: { message: "Corps de requête invalide." } });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: { message: "Erreur proxy : " + err.message } });
  }
}
