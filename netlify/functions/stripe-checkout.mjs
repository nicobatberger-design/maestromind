export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { priceId } = await req.json();
    const origin = req.headers.get("origin") || "https://maestromind.netlify.app";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId || process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/?premium=1`,
      cancel_url: `${origin}/?cancelled=1`,
      allow_promotion_codes: true,
    });
    return Response.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: "/api/stripe-checkout" };
