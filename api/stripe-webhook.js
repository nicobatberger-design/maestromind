const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    const rawBody = req.body;
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Webhook Error" });
  }
  if (event.type === "checkout.session.completed") {
    console.log("[MAESTROMIND] Premium subscription activated:", event.data.object.customer_email);
  }
  if (event.type === "customer.subscription.deleted") {
    console.log("[MAESTROMIND] Premium subscription cancelled:", event.data.object.customer);
  }
  res.status(200).json({ received: true });
};
