"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

export default function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // 👈 L'outil anti-boucle infinie

  useEffect(() => {
    // 🛑 RÈGLE N°1 : Éviter la boucle infinie.
    // Si l'utilisateur est DÉJÀ sur la page d'expiration, on arrête de vérifier et on affiche la page.
    if (pathname === "/subscription-expired") {
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      // Instanciation à l'intérieur pour optimiser les performances React
      const supabase = createClient();

      // 1. Vérification connexion
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Récupération profil (On utilise 'trial_end' de la BDD comme Source de Vérité)
      const { data: profile } = await supabase
        .from("profiles")
        // On récupère exactement ce dont on a besoin
        .select("subscription_tier, subscription_status, trial_end, created_at")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // Sécurité : si le profil n'existe pas encore (latence trigger), on laisse passer pour l'instant
        setLoading(false);
        return;
      }

      const status = profile.subscription_status;
      const tier = profile.subscription_tier;

      // --- DÉCISION FINANCIÈRE ---
      // CAS 1 : Client PAYANT Actif -> ACCÈS IMMÉDIAT
      // ⚠️ On exclut 'kkiapay_active' d'ici pour l'obliger à passer le test de la date !
      if (
        status === "active" ||
        (tier === "pro" && status !== "kkiapay_active")
      ) {
        setLoading(false);
        return;
      }

      // CAS 2 : Vérification de la Période d'Essai (Calcul côté Serveur/BDD)
      const now = new Date();
      // On prend la date de fin d'essai de la BDD. Si elle est vide (vieux compte), on calcule +60 jours.
      const trialEnd = profile.trial_end
        ? new Date(profile.trial_end)
        : new Date(
            new Date(profile.created_at).getTime() + 60 * 24 * 60 * 60 * 1000,
          );

      if (now > trialEnd) {
        // Essai TERMINÉ -> DEHORS
        router.push("/subscription-expired");
        return;
      }

      // CAS 3 : En essai (Délai non dépassé) -> OK
      setLoading(false);
    };

    checkAccess();
  }, [router, pathname]); // Le useEffect ne se relance que si l'URL change

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#050505]">
        {/* Loader avec la couleur or Couture OS */}
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return <>{children}</>;
}
