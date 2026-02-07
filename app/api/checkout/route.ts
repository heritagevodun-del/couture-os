import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";

// 👇 SÉCURITÉ : Remets tes VRAIS IDs Stripe ici à la place des XXXXX
const STRIPE_PRICE_IDS: Record<string, string> = {
  start: "price_1Sxq3nEQ6UKEvtgmf2TrrA5B", // <--- TON VRAI ID START
  pro: "price_1Sxq54EQ6UKEvtgmQMFLy3Vc", // <--- TON VRAI ID PRO
};

export async function POST(request: Request) {
  try {
    // 1. Récupération du body
    const body = await request.json();
    const { plan } = body; // 'start' ou 'pro'

    // 2. Auth Supabase
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour vous abonner." },
        { status: 401 },
      );
    }

    // 3. Validation de l'offre
    const priceId = STRIPE_PRICE_IDS[plan];

    if (!priceId) {
      console.error(`❌ Plan inconnu demandé : ${plan}`);
      return NextResponse.json(
        { error: "Offre inconnue ou invalide." },
        { status: 400 },
      );
    }

    // 4. Création Session Stripe
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
      // ✅ ESSAI GRATUIT 60 JOURS
      subscription_data: {
        trial_period_days: 60,
      },
      // ⚠️ METADATA CRUCIALES
      metadata: {
        userId: user.id,
        planName: plan,
      },
      // URLs de redirection
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/pricing?payment=cancelled`,
      locale: "fr",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    // ✅ CORRECTION ICI : 'unknown' au lieu de 'any'
    console.error("[STRIPE ERROR]", error);

    let errorMessage = "Erreur lors de la création du paiement.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
