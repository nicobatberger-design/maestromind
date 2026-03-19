import { loadStripe } from "@stripe/stripe-js";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export async function checkoutPremium() {
  if (!stripePromise) {
    console.warn("[MAESTROMIND] Stripe non configuré — clé VITE_STRIPE_PUBLIC_KEY manquante");
    return null;
  }
  try {
    const res = await fetch("https://maestromind-maestromind.vercel.app/api/stripe-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: import.meta.env.VITE_STRIPE_PRICE_ID || "price_maestromind_premium" }),
    });
    const { sessionId, url } = await res.json();
    if (url) {
      window.location.href = url;
      return;
    }
    const stripe = await stripePromise;
    if (stripe && sessionId) {
      await stripe.redirectToCheckout({ sessionId });
    }
  } catch (err) {
    console.error("[MAESTROMIND] Erreur Stripe checkout:", err);
    throw err;
  }
}

export default stripePromise;
