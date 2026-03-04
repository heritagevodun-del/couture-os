import { createClient } from "@/utils/supabase/server";

// --- 1. DÉFINITION STRICTE DES QUOTAS ---
type SubscriptionTier = "free" | "start" | "pro";

type QuotaLimits = {
  clients: number;
  active_orders: number;
};

export const QUOTAS: Record<SubscriptionTier, QuotaLimits> = {
  free: {
    clients: 10,
    active_orders: 3,
  },
  start: {
    clients: 50,
    active_orders: 5,
  },
  pro: {
    clients: Infinity,
    active_orders: Infinity,
  },
};

/**
 * Récupère le niveau d'abonnement actuel en vérifiant l'essai gratuit ET l'abonnement
 */
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "free";

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status, created_at") // 👈 Ajout de created_at
    .eq("id", user.id)
    .single();

  if (!profile) return "free";

  // 1. RÈGLE D'OR PAYANTE : Si l'abonnement est actif via Stripe / Kkiapay
  if (
    profile.subscription_status === "active" ||
    profile.subscription_status === "pro"
  ) {
    return (profile.subscription_tier as SubscriptionTier) || "pro";
  }

  // 2. 🔥 CORRECTION CRITIQUE PLG : Calcul de l'essai gratuit de 60 jours côté SERVEUR
  // Même si le statut n'est pas "active", on vérifie si l'utilisateur vient de s'inscrire
  if (profile.created_at) {
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const daysUsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysUsed <= 60) {
      // Pendant la période d'essai, on offre la puissance maximale pour créer la dépendance au produit (Product-Led Growth)
      return "pro";
    }
  }

  // 3. Essai terminé et pas d'abonnement payé -> Rétrogradation au plan gratuit
  return "free";
}

/**
 * VÉRIFICATION 1 : Autorisation d'ajouter un Client
 */
export async function canAddClient(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const tier = await getSubscriptionTier();

  // Si Pro (ou en période d'essai), pas de limite
  if (tier === "pro") return true;

  const { count } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const limit = QUOTAS[tier].clients;

  return (count || 0) < limit;
}

/**
 * VÉRIFICATION 2 : Autorisation de créer une Commande
 */
export async function canCreateOrder(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const tier = await getSubscriptionTier();

  if (tier === "pro") return true;

  // On compte ce qui est EN COURS (donc ni 'termine', ni 'annule')
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "termine")
    .neq("status", "annule");

  const limit = QUOTAS[tier].active_orders;

  return (count || 0) < limit;
}

/**
 * STATISTIQUES D'USAGE (Pour afficher les barres de progression sur le Dashboard)
 */
export async function getUsageStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const tier = await getSubscriptionTier();

  // Requêtes parallèles pour des performances optimales sur le Dashboard
  const [clientsRes, ordersRes] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "termine")
      .neq("status", "annule"),
  ]);

  return {
    tier,
    limits: QUOTAS[tier],
    usage: {
      clients: clientsRes.count || 0,
      active_orders: ordersRes.count || 0,
    },
  };
}
