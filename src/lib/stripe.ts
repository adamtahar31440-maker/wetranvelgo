import Stripe from "stripe";

let _stripe: Stripe | null = null;

// Lazy init so the app can build/run before STRIPE_SECRET_KEY is configured.
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// MAD isn't always supported for card payments on Stripe depending on account
// settings; amounts are passed in the smallest currency unit (centimes).
export const STRIPE_CURRENCY = "mad";
