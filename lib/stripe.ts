import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "ERREUR CRITIQUE : La variable STRIPE_SECRET_KEY est manquante dans .env.local",
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // C'est la seule version que votre librairie actuelle accepte
  apiVersion: "2023-10-16",
  typescript: true,
});
