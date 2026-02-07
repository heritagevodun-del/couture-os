import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ReactNode } from "react";

interface SubscriptionGuardProps {
  children: ReactNode;
}

export default async function SubscriptionGuard({
  children,
}: SubscriptionGuardProps) {
  const supabase = await createClient();

  // 1. Récupérer l'utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Récupérer son statut d'abonnement
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const status = profile?.subscription_status;

  // 3. LA LISTE DES ÉLUS (Ceux qui ont le droit d'entrer)
  // 'trialing' = Essai gratuit en cours
  // 'active' = Paiement OK
  const allowedStatuses = ["trialing", "active"];

  // 4. LE VERDICT
  if (!status || !allowedStatuses.includes(status)) {
    // Si le statut n'est pas bon (ex: 'past_due' car paiement échoué, ou 'canceled')
    // On le redirige de force vers une page qui lui dit "C'est fini, faut payer"
    redirect("/subscription-expired");
  }

  // Si tout est bon, on affiche l'application
  return <>{children}</>;
}
