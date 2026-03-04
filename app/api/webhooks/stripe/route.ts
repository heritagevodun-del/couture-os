import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// 🛡️ SÉCURITÉ : Fail-Fast pour le compte Admin
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error(
    "🔥 ERREUR CRITIQUE : Clés Supabase Admin manquantes pour le Webhook.",
  );
}

// Init Supabase Admin (Accès racine pour écriture serveur)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Missing Stripe Signature", { status: 400 });
  }

  // 🛡️ SÉCURITÉ : Fail-Fast pour le secret Webhook
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("🔥 ERREUR CRITIQUE : STRIPE_WEBHOOK_SECRET manquant.");
    return new NextResponse("Server Configuration Error", { status: 500 });
  }

  let event: Stripe.Event;

  // 1. Vérification de la signature cryptographique
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown Error";
    console.error(`❌ Erreur Signature: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // 2. Gestion du Cycle de Vie
  try {
    switch (event.type) {
      // ✅ CAS A : PREMIER PAIEMENT (Création de l'abonnement)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planName = session.metadata?.planName;

        if (!userId) {
          console.error(
            "⚠️ Webhook ignoré : Pas de userId dans les métadonnées",
          );
          return new NextResponse("OK", { status: 200 });
        }

        // On attache le userId au Customer Stripe pour ne jamais le perdre
        await stripe.customers.update(session.customer as string, {
          metadata: { userId },
        });

        // Mise à jour de la base de données Couture OS
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_tier: planName || "pro", // Fallback sécurité
            subscription_status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);

        if (error) throw new Error(`Erreur DB (Checkout): ${error.message}`);
        console.log(
          `🎉 Nouvel abonnement activé pour l'utilisateur : ${userId}`,
        );
        break;
      }

      // 🔄 CAS B : MISE À JOUR ABONNEMENT (Renouvellement, changement de carte, passage au niveau supérieur)
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status,
            stripe_subscription_id: subscription.id,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error(
            `⚠️ Erreur DB (Update): Le client ${customerId} n'est peut-être pas encore sync.`,
          );
        } else {
          console.log(
            `🔄 Statut mis à jour (${status}) pour le client Stripe ${customerId}`,
          );
        }
        break;
      }

      // 🗑️ CAS C : ABONNEMENT ANNULÉ DÉFINITIVEMENT
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);

        if (error) throw new Error(`Erreur DB (Delete): ${error.message}`);
        console.log(
          `🚫 Abonnement résilié pour le client Stripe ${customerId}`,
        );
        break;
      }

      default:
        console.log(`ℹ️ Événement ignoré: ${event.type}`);
    }
  } catch (error) {
    console.error("❌ Erreur Logique Webhook:", error);
    // On retourne 500 pour que Stripe réessaie plus tard (Mécanisme de sécurité vitale)
    return new NextResponse("Erreur interne du traitement", { status: 500 });
  }

  return new NextResponse("OK", { status: 200 });
}
