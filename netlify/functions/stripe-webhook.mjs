export default async (req) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers.get("stripe-signature");
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      console.log("[MAESTROMIND] Premium subscription activated:", event.data.object.customer_email);
    }
    if (event.type === "customer.subscription.deleted") {
      console.log("[MAESTROMIND] Premium subscription cancelled:", event.data.object.customer);
    }
    return Response.json({ received: true });
  } catch (err) {
    return Response.json({ error: "Webhook Error" }, { status: 400 });
  }
};

export const config = { path: "/api/stripe-webhook" };
