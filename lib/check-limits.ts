import { createClient } from "@/utils/supabase/server";

// 1. DÉFINITION DES QUOTAS (Alignés sur la page Pricing)
export const QUOTAS = {
  free: {
    clients: 10,
    active_orders: 3,
  },
  start: {
    clients: 50, // ✅ Cohérent avec votre offre Start
    active_orders: 5,
  },
  pro: {
    clients: Infinity, // ✅ Cohérent avec votre offre Pro
    active_orders: Infinity,
  },
};

type SubscriptionTier = "free" | "start" | "pro";

/**
 * Récupère le niveau d'abonnement actuel
 */
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "free";

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", user.id)
    .single();

  // ⚠️ CORRECTION MAJEURE ICI :
  // On accepte 'active' (payé) ET 'trialing' (essai gratuit 60j)
  const validStatuses = ["active", "trialing"];

  if (
    !profile ||
    !profile.subscription_tier ||
    !validStatuses.includes(profile.subscription_status) // <-- La correction est ici
  ) {
    return "free";
  }

  return profile.subscription_tier as SubscriptionTier;
}

/**
 * VÉRIFICATION 1 : Ajout Client
 */
export async function canAddClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const tier = await getSubscriptionTier();

  if (tier === "pro") return true;

  const { count } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const limit = QUOTAS[tier].clients;

  return (count || 0) < limit;
}

/**
 * VÉRIFICATION 2 : Création Commande
 */
export async function canCreateOrder() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const tier = await getSubscriptionTier();

  if (tier === "pro") return true;

  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("status", "in", "('completed','cancelled')");

  const limit = QUOTAS[tier].active_orders;

  return (count || 0) < limit;
}

/**
 * STATISTIQUES D'USAGE (Pour le Dashboard)
 */
export async function getUsageStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const tier = await getSubscriptionTier();

  const { count: clientCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .not("status", "in", "('completed','cancelled')");

  return {
    tier,
    limits: QUOTAS[tier],
    usage: {
      clients: clientCount || 0,
      active_orders: orderCount || 0,
    },
  };
}
