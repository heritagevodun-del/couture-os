"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

export default function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAccess = async () => {
      // 1. Vérification connexion
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Récupération profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status, created_at")
        .eq("id", user.id)
        .single();

      // 3. Calculs
      const subscriptionStatus = profile?.subscription_status || "free";
      const createdAt = new Date(profile?.created_at || new Date());
      const now = new Date();

      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      const daysUsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const TRIAL_LIMIT = 60; // ⚠️ Limite à 60 jours

      // --- DÉCISION ---

      // CAS 1 : Client PAYANT (Pro) -> OK
      if (subscriptionStatus === "active" || subscriptionStatus === "pro") {
        setLoading(false);
        return;
      }

      // CAS 2 : Essai TERMINÉ -> DEHORS
      if (daysUsed > TRIAL_LIMIT) {
        router.push("/subscription-expired"); // 👈 Redirection correcte
        return;
      }

      // CAS 3 : En essai -> OK
      setLoading(false);
    };

    checkAccess();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return <>{children}</>;
}
