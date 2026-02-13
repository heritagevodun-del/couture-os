import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// On initialise Supabase avec les droits d'ADMIN (Service Role)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    // 1. Lire les données envoyées par Kkiapay
    const body = await request.json();
    console.log("🔔 Webhook Kkiapay reçu :", body);

    // Kkiapay envoie généralement : { transactionId, status, amount, metadata: { userId, ... } }
    const { status, transactionId, metadata } = body;

    // 2. Vérification de sécurité basique
    if (status !== "SUCCESS") {
      return NextResponse.json(
        { message: "Transaction non réussie" },
        { status: 400 },
      );
    }

    if (!metadata?.userId) {
      console.error("❌ Pas de User ID dans les métadonnées");
      return NextResponse.json(
        { message: "User ID manquant" },
        { status: 400 },
      );
    }

    const userId = metadata.userId;

    // 3. Calcul de la date de fin (+30 jours)
    const now = new Date();
    const endDate = new Date(now.setDate(now.getDate() + 30));

    // 4. Mise à jour de Supabase
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active", // ou 'pro'
        plan_id: "premium_africa", // Pour savoir qu'il est sur l'offre Afrique
        current_period_end: endDate.toISOString(),
        stripe_customer_id: `kkiapay_${transactionId}`, // On stocke l'ID transaction ici pour référence
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Erreur update Supabase :", error);
      return NextResponse.json({ message: "Erreur interne" }, { status: 500 });
    }

    console.log(
      `✅ Abonnement activé pour l'utilisateur ${userId} jusqu'au ${endDate}`,
    );
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur Webhook :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
