import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

// 👇 REMETS TES VRAIS IDs ICI
const PRICES = {
  africa: "price_1Sy86ZEQ6UKEvtgmhJyHZjtc", // <--- Remets ton ID 2000 FCFA
  world: "price_1Sy88qEQ6UKEvtgmiPuj2wXY", // <--- Remets ton ID 9.99 EUR
};

// 🌍 LISTE PAYS AFRIQUE
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
    const { zone } = body;

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

    // 🛠️ CORRECTION TYPAGE : On définit le type exact autorisé par Stripe (plus de 'any')
    let allowedCountries:
      | Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[]
      | undefined = undefined;

    if (zone === "africa") {
      priceId = PRICES.africa;
      // On force le typage ici pour dire à TypeScript "T'inquiète, ces codes pays sont valides"
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
      billing_address_collection: "required",
      shipping_address_collection:
        zone === "africa"
          ? {
              allowed_countries: allowedCountries!,
            }
          : undefined,
      metadata: {
        userId: user.id,
        planName: "premium",
        zone: zone,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/pricing?payment=cancelled`,
      locale: "fr",
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
