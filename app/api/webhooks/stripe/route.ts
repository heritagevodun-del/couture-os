import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// Init Supabase Admin (Pour contourner la sécurité RLS et écrire dans la DB)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  // 1. Vérification de la signature (Sécurité)
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown Error";
    console.error(`❌ Erreur Signature: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // 2. Gestion du Cycle de Vie de l'Abonnement
  try {
    switch (event.type) {
      // ✅ CAS A : NOUVEL ABONNEMENT (Premier paiement ou début essai)
      case "checkout.session.completed": {
        // CORRECTION : On caste ici, car on est SÛR que c'est une Session
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName; // 'start' ou 'pro'

        if (!userId) {
          console.error("⚠️ Pas de userId dans les métadonnées");
          break;
        }

        console.log(`🎉 Nouvel abonnement pour : ${userId}`);

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_tier: planName,
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);
        break;
      }

      // 💰 CAS B : PAIEMENT MENSUEL RÉUSSI (Renouvellement)
      case "invoice.payment_succeeded": {
        // CORRECTION : Ici, l'objet est une INVOICE, pas une Subscription
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // On s'assure que le statut reste 'active'
        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "active" })
          .eq("stripe_customer_id", customerId);

        console.log(`💰 Renouvellement réussi pour le client ${customerId}`);
        break;
      }

      // ❌ CAS C : PAIEMENT ÉCHOUÉ (Carte expirée, fonds insuffisants)
      case "invoice.payment_failed": {
        // CORRECTION : Ici aussi, c'est une INVOICE
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabaseAdmin
          .from("profiles")
          .update({ subscription_status: "past_due" }) // "En retard"
          .eq("stripe_customer_id", customerId);

        console.log(`⚠️ Paiement échoué pour le client ${customerId}`);
        break;
      }

      // 🗑️ CAS D : ABONNEMENT ANNULÉ (Fin définitive)
      case "customer.subscription.deleted": {
        // CORRECTION : Ici, c'est bien une SUBSCRIPTION
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_tier: "free", // Retour au gratuit
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);

        console.log(`🚫 Abonnement supprimé pour le client ${customerId}`);
        break;
      }
    }
  } catch (error) {
    console.error("❌ Erreur Logique Webhook:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
