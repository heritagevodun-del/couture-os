"use client";

import Link from "next/link";
import { Lock, CreditCard, LogOut, HelpCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function ExpiredPage() {
  const router = useRouter();
  const supabase = createClient();

  // Fonction de sécurité pour libérer l'utilisateur coincé
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#111] p-8 rounded-3xl shadow-2xl text-center border border-gray-200 dark:border-gray-800">
        {/* Icône de Verrouillage */}
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Lock size={36} strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white font-serif">
          Accès Verrouillé
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">
          Votre période d&apos;essai est terminée ou votre dernier paiement a
          échoué.
          <br />
          <br />
          <span className="text-green-600 dark:text-green-500 font-medium bg-green-50 dark:bg-green-900/10 px-3 py-1 rounded-full">
            Vos données sont 100% en sécurité.
          </span>
          <br />
          <br />
          Réactivez votre abonnement pour retrouver l&apos;accès à vos clients
          et mesures.
        </p>

        <div className="space-y-4">
          {/* Bouton Primaire : Payer */}
          <Link
            href="/pricing"
            className="w-full py-4 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] hover:-translate-y-0.5"
          >
            <CreditCard size={20} /> Réactiver mon atelier
          </Link>

          {/* Actions Secondaires */}
          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3">
            <button
              onClick={handleSignOut}
              className="w-full py-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Me déconnecter
            </button>

            <Link
              href="mailto:support@nova-ent.com"
              className="text-xs text-gray-400 hover:text-[#D4AF37] transition-colors flex items-center justify-center gap-1"
            >
              <HelpCircle size={14} /> J&apos;ai besoin d&apos;aide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
