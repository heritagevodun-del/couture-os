import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

// 👇👇👇 C'EST ICI QU'IL FAUT COLLER TES VRAIS IDS LIVE 👇👇👇
const PRICES = {
  // Colle l'ID du prix à 2000 FCFA ici (ex: price_1QjXa...)
  africa: "price_1SzGr7EQ6UKEvtgm1uBmoR9R",

  // Colle l'ID du prix à 9.99 EUR ici (ex: price_1QjXb...)
  world: "price_1SzGtVEQ6UKEvtgmI1ZtuvDw",
};

// Liste des pays éligibles au tarif Afrique (Pour bloquer les tricheurs si besoin)
const AFRICA_COUNTRIES = [
  "DZ",
  "AO",
  "BJ",
  "BW",
  "BF",
  "BI",
  "CM",
  "CV",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "CI",
  "DJ",
  "EG",
  "GQ",
  "ER",
  "SZ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "KE",
  "LS",
  "LR",
  "LY",
  "MG",
  "MW",
  "ML",
  "MR",
  "MU",
  "MA",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RW",
  "ST",
  "SN",
  "SC",
  "SL",
  "SO",
  "ZA",
  "SS",
  "SD",
  "TZ",
  "TG",
  "TN",
  "UG",
  "ZM",
  "ZW",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zone } = body; // On récupère le choix de l'utilisateur

    // 1. Vérification Authentification
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Veuillez vous connecter pour vous abonner." },
        { status: 401 },
      );
    }

    // 2. Sélection du bon prix
    let priceId = PRICES.world; // Par défaut : Monde
    let allowedCountries:
      | Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[]
      | undefined = undefined;

    if (zone === "africa") {
      priceId = PRICES.africa;
      // Optionnel : On peut forcer l'adresse de facturation en Afrique pour ce tarif
      allowedCountries =
        AFRICA_COUNTRIES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];
    }

    // 3. Création de la session de paiement
    // Récupération de l'URL du site (Prod ou Local)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"], // Carte bancaire
      customer_email: user.email, // Pré-remplit l'email
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // On demande l'adresse pour valider la localisation et pour la facture
      billing_address_collection: "required",

      // Si zone Afrique, on limite les pays sélectionnables (Optionnel, tu peux retirer ce bloc si ça gêne)
      shipping_address_collection:
        zone === "africa"
          ? { allowed_countries: allowedCountries! }
          : undefined,

      // Métadonnées pour retrouver le user plus tard via Webhook
      metadata: {
        userId: user.id,
        planName: "premium",
        zone: zone,
      },

      // Redirections
      success_url: `${baseUrl}/dashboard?payment=success`,
      cancel_url: `${baseUrl}/pricing?payment=cancelled`,

      // Langue de la page Stripe
      locale: "fr",

      // Essai gratuit (si configuré ici, sinon configurer dans Stripe directement)
      subscription_data: {
        trial_period_days: 60,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("[STRIPE ERROR]", error);
    let errorMessage = "Erreur interne Stripe";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
