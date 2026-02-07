import { createClient } from "@/utils/supabase/server";

// 1. DÉFINITION DES QUOTAS
export const QUOTAS = {
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

  if (!profile) return "free";

  // 🔥 RÈGLE D'OR PLG : Trialing = PRO
  if (profile.subscription_status === "trialing") {
    return "pro";
  }

  // Si l'abonnement est actif
  if (profile.subscription_status === "active") {
    return (profile.subscription_tier as SubscriptionTier) || "free";
  }

  return "free";
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

  // Si Pro, pas de limite
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

  // ⚠️ CORRECTION ICI : On utilise les statuts français de ton App
  // On compte ce qui est EN COURS (donc pas 'termine' et pas 'annule')
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .neq("status", "termine") // <--- Harmonisé avec le Frontend
    .neq("status", "annule"); // <--- Harmonisé avec le Frontend

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
    .neq("status", "termine") // <--- Harmonisé
    .neq("status", "annule"); // <--- Harmonisé

  return {
    tier,
    limits: QUOTAS[tier],
    usage: {
      clients: clientCount || 0,
      active_orders: orderCount || 0,
    },
  };
}
