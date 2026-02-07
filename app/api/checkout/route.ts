import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe"; // 👈 C'est cet import qui corrigeait l'erreur "Namespace Stripe introuvable"

// 👇 COLLEZ VOS NOUVEAUX IDs ICI
const PRICES = {
  africa: "price_1Sy86ZEQ6UKEvtgmhJyHZjtc", // <--- L'ID du prix à 2000 XOF
  world: "price_1Sy88qEQ6UKEvtgmiPuj2wXY", // <--- L'ID du prix à 9.99 EUR
};

// 🌍 LISTE COMPLÈTE DES PAYS D'AFRIQUE (Codes ISO Alpha-2)
const AFRICA_COUNTRIES = [
  "DZ", // Algérie
  "AO", // Angola
  "BJ", // Bénin
  "BW", // Botswana
  "BF", // Burkina Faso
  "BI", // Burundi
  "CM", // Cameroun
  "CV", // Cap-Vert
  "CF", // République centrafricaine
  "TD", // Tchad
  "KM", // Comores
  "CG", // Congo (Brazzaville)
  "CD", // Congo (RDC)
  "CI", // Côte d'Ivoire
  "DJ", // Djibouti
  "EG", // Égypte
  "GQ", // Guinée équatoriale
  "ER", // Érythrée
  "SZ", // Eswatini
  "ET", // Éthiopie
  "GA", // Gabon
  "GM", // Gambie
  "GH", // Ghana
  "GN", // Guinée
  "GW", // Guinée-Bissau
  "KE", // Kenya
  "LS", // Lesotho
  "LR", // Liberia
  "LY", // Libye
  "MG", // Madagascar
  "MW", // Malawi
  "ML", // Mali
  "MR", // Mauritanie
  "MU", // Maurice
  "MA", // Maroc
  "MZ", // Mozambique
  "NA", // Namibie
  "NE", // Niger
  "NG", // Nigeria
  "RW", // Rwanda
  "ST", // Sao Tomé-et-Principe
  "SN", // Sénégal
  "SC", // Seychelles
  "SL", // Sierra Leone
  "SO", // Somalie
  "ZA", // Afrique du Sud
  "SS", // Soudan du Sud
  "SD", // Soudan
  "TZ", // Tanzanie
  "TG", // Togo
  "TN", // Tunisie
  "UG", // Ouganda
  "ZM", // Zambie
  "ZW", // Zimbabwe
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zone } = body; // On reçoit 'africa' ou 'world' depuis le site

    // 1. Auth Check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Veuillez vous connecter." },
        { status: 401 },
      );
    }

    // 2. Configuration selon la zone
    let priceId = PRICES.world;
    // On type correctement la variable pour éviter l'erreur TypeScript
    let allowedCountries:
      | Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[]
      | undefined = undefined;

    if (zone === "africa") {
      priceId = PRICES.africa;
      // 🔒 SÉCURITÉ : On force Stripe à n'accepter que des adresses africaines
      allowedCountries =
        AFRICA_COUNTRIES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];
    }

    // 3. Création Session Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Essai gratuit 14 jours
      subscription_data: {
        trial_period_days: 60,
      },
      // Configuration de l'adresse de facturation
      billing_address_collection: "required",
      shipping_address_collection:
        zone === "africa"
          ? {
              allowed_countries: allowedCountries!, // Restriction active
            }
          : undefined,

      // Métadonnées pour le futur Webhook
      metadata: {
        userId: user.id,
        planName: "premium", // Tout le monde est "premium" maintenant
        zone: zone,
      },

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/pricing?payment=cancelled`,
      locale: "fr",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    // ✅ Correction : 'unknown' au lieu de 'any'
    console.error("[STRIPE ERROR]", error);

    let errorMessage = "Erreur lors de l'initialisation du paiement.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
