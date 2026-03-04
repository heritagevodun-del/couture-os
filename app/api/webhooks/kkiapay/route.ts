import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Initialisation Supabase ADMIN
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    // 1. Récupération de la signature
    const signature = request.headers.get("x-kkiapay-signature");
    const secret = process.env.KKIAPAY_SECRET_HASH;

    if (!secret || !signature) {
      console.error("❌ ERREUR : Configuration ou Signature manquante");
      return NextResponse.json({ message: "Server Error" }, { status: 500 });
    }

    // 2. Lecture du corps brut
    const rawBody = await request.text();

    // 3. Vérification cryptographique ANTI-TIMING ATTACKS
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    // On utilise Buffer et timingSafeEqual pour une comparaison sécurisée
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );

    if (!isSignatureValid) {
      console.error("⛔ ALERTE SÉCURITÉ : Signature Kkiapay invalide !");
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 4. Parsing du JSON
    const body = JSON.parse(rawBody);
    console.log("🔔 Webhook Kkiapay AUTHENTIFIÉ reçu");

    const { status, transactionId, metadata } = body;

    if (status !== "SUCCESS") {
      return NextResponse.json({ message: "Transaction non réussie" });
    }

    // 5. Extraction robuste du UserID
    let userId = metadata?.userId;
    if (!userId && typeof metadata === "string") {
      try {
        userId = JSON.parse(metadata).userId;
      } catch (e) {
        console.error("Erreur parsing metadata", e);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { message: "User ID manquant" },
        { status: 400 },
      );
    }

    // 6. Calcul date de fin EXACTE (+30 jours pour le Mobile Money)
    const now = new Date();
    const endDate = new Date(now.setDate(now.getDate() + 30));

    // 7. Update Supabase avec le VRAI schéma
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "kkiapay_active", // Statut spécifique
        subscription_tier: "pro", // Vraie colonne (remplace plan_id)
        trial_end: endDate.toISOString(), // Vraie colonne (remplace current_period_end)
        stripe_customer_id: `kkiapay_${transactionId}`,
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Erreur update Supabase :", error);
      return NextResponse.json({ message: "Erreur BDD" }, { status: 500 });
    }

    console.log(
      `✅ Abonnement Mobile Money activé pour ${userId} jusqu'au ${endDate.toISOString()}`,
    );
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur Webhook :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
