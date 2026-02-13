import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Initialisation Supabase ADMIN
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  try {
    // 1. Récupération de la signature envoyée par Kkiapay
    const signature = request.headers.get("x-kkiapay-signature");
    const secret = process.env.KKIAPAY_SECRET_HASH;

    if (!secret) {
      console.error(
        "❌ ERREUR CONFIG : KKIAPAY_SECRET_HASH manquant dans .env",
      );
      return NextResponse.json(
        { message: "Server Configuration Error" },
        { status: 500 },
      );
    }

    // 2. Lecture du corps brut (Raw Body) pour la vérification
    const rawBody = await request.text();

    // 3. Vérification cryptographique de la signature (HMAC SHA256)
    // On recrée la signature avec notre secret et le contenu reçu
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    // Comparaison sécurisée
    if (signature !== computedSignature) {
      console.error("⛔ ALERTE SÉCURITÉ : Signature Webhook invalide !");
      return NextResponse.json(
        { message: "Forbidden: Invalid Signature" },
        { status: 403 },
      );
    }

    // 4. Si la signature est bonne, on parse le JSON
    const body = JSON.parse(rawBody);
    console.log("🔔 Webhook Kkiapay AUTHENTIFIÉ reçu");

    const { status, transactionId, metadata } = body;

    // 5. Logique métier standard
    if (status !== "SUCCESS") {
      return NextResponse.json({ message: "Transaction non réussie" });
    }

    // Gestion robuste des métadonnées (parfois string, parfois objet)
    let userId = metadata?.userId;
    if (!userId && typeof metadata === "string") {
      try {
        const parsedMeta = JSON.parse(metadata);
        userId = parsedMeta.userId;
      } catch (e) {
        console.error("Erreur parsing metadata", e);
      }
    }

    if (!userId) {
      console.error("❌ Pas de User ID dans les métadonnées");
      return NextResponse.json(
        { message: "User ID manquant" },
        { status: 400 },
      );
    }

    // 6. Calcul date fin (+30 jours)
    const now = new Date();
    const endDate = new Date(now.setDate(now.getDate() + 30));

    // 7. Update Supabase
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        plan_id: "premium_africa",
        current_period_end: endDate.toISOString(),
        stripe_customer_id: `kkiapay_${transactionId}`,
      })
      .eq("id", userId);

    if (error) {
      console.error("❌ Erreur update Supabase :", error);
      return NextResponse.json({ message: "Erreur interne" }, { status: 500 });
    }

    console.log(`✅ Abonnement activé pour ${userId} (Sécurisé)`);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur Webhook :", err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
