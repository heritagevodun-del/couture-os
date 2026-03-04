import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import Stripe from "stripe";

// Configuration des prix (Live IDs)
const PRICES = {
  africa: "price_1SzGr7EQ6UKEvtgm1uBmoR9R",
  world: "price_1SzGtVEQ6UKEvtgmI1ZtuvDw",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zone } = body;

    // 1. Vérification Authentification stricte
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

    // 2. Vérification de l'historique du profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, trial_end")
      .eq("id", user.id)
      .single();

    // 3. Configuration de la session de paiement
    const priceId = zone === "africa" ? PRICES.africa : PRICES.world;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Typage strict pour éviter les erreurs TypeScript
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Uniquement l'adresse de facturation (Friction UX minimale)
      billing_address_collection: "required",

      metadata: {
        userId: user.id,
        planName: "pro", // Alignement strict avec ta base de données
        zone: zone,
      },
      success_url: `${baseUrl}/dashboard?payment=success`,
      cancel_url: `${baseUrl}/pricing?payment=cancelled`,
      locale: "fr",
    };

    // --- LOGIQUE ANTI-DUPLICATION (CLONAGE) ---
    // Si on a déjà un ID client Stripe (et pas un ID Kkiapay), on le réutilise.
    if (
      profile?.stripe_customer_id &&
      profile.stripe_customer_id.startsWith("cus_")
    ) {
      sessionConfig.customer = profile.stripe_customer_id;
    } else {
      sessionConfig.customer_email = user.email;
    }

    // --- LOGIQUE DE FACTURATION INTELLIGENTE (TRIAL) ---
    if (profile?.trial_end) {
      // On convertit la date de fin d'essai en timestamp Unix (secondes) pour Stripe
      const trialEndUnix = Math.floor(
        new Date(profile.trial_end).getTime() / 1000,
      );
      const nowUnix = Math.floor(Date.now() / 1000);

      // Stripe exige que la fin de l'essai soit au moins dans 48h.
      // S'il lui reste plus de 48h, Stripe attendra. S'il lui reste moins (ou échu), facturation immédiate.
      if (trialEndUnix > nowUnix + 48 * 3600) {
        sessionConfig.subscription_data = {
          trial_end: trialEndUnix,
        };
      }
    }

    // 4. Génération du lien de paiement sécurisé
    const session = await stripe.checkout.sessions.create(sessionConfig);

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
