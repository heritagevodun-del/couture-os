import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// 🛡️ SÉCURITÉ : Fail-Fast pour le compte Admin Supabase
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error(
    "🔥 ERREUR CRITIQUE : Clés Supabase Admin manquantes pour le Webhook Kkiapay.",
  );
}

// Initialisation Supabase ADMIN
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request: Request) {
  try {
    // 1. Récupération de la signature
    const signature = request.headers.get("x-kkiapay-signature");
    const secret = process.env.KKIAPAY_SECRET_HASH;

    // 🛡️ SÉCURITÉ : Fail-Fast pour Kkiapay
    if (!secret) {
      console.error("🔥 ERREUR CRITIQUE : KKIAPAY_SECRET_HASH manquant.");
      return NextResponse.json(
        { message: "Server Configuration Error" },
        { status: 500 },
      );
    }

    if (!signature) {
      console.error(
        "❌ ERREUR : Signature Kkiapay manquante dans les headers.",
      );
      return NextResponse.json(
        { message: "Missing Signature" },
        { status: 400 },
      );
    }

    // 2. Lecture du corps brut
    const rawBody = await request.text();

    // 3. Vérification cryptographique ANTI-TIMING ATTACKS
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const bufferSignature = Buffer.from(signature);
    const bufferComputed = Buffer.from(computedSignature);

    // 🛡️ FIX SÉCURITÉ : On vérifie la longueur AVANT timingSafeEqual pour éviter un crash Node.js
    if (
      bufferSignature.length !== bufferComputed.length ||
      !crypto.timingSafeEqual(bufferSignature, bufferComputed)
    ) {
      console.error("⛔ ALERTE SÉCURITÉ : Signature Kkiapay invalide !");
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 4. Parsing du JSON
    const body = JSON.parse(rawBody);
    console.log("🔔 Webhook Kkiapay AUTHENTIFIÉ reçu");

    const { status, transactionId, metadata } = body;

    // Si la transaction échoue, on retourne 200 avec un message pour dire à Kkiapay d'arrêter de réessayer
    if (status !== "SUCCESS") {
      return NextResponse.json({
        message: "Transaction non réussie",
        received: true,
      });
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
        // 🔥 FIX BUSINESS : On utilise "active" pour que lib/check-limits.ts le déverrouille !
        subscription_status: "active",
        subscription_tier: "pro",
        trial_end: endDate.toISOString(),
        stripe_customer_id: `kkiapay_${transactionId}`, // Tag permettant de reconnaître la source
        stripe_subscription_id: `mm_${transactionId}`, // Indique un abonnement manuel sans auto-renouvellement
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
