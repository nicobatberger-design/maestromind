const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { priceId } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId || process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${req.headers.origin}/?premium=1`,
      cancel_url: `${req.headers.origin}/?cancelled=1`,
      allow_promotion_codes: true,
    });
    res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: err.message });
  }
};
