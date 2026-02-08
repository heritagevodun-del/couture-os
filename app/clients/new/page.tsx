import { canAddClient } from "@/lib/check-limits";
import NewClientForm from "@/components/clients/NewClientForm";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export default async function NewClientPage() {
  // 1. VÉRIFICATION SERVEUR STRICTE
  const allowed = await canAddClient();

  // 2. CAS : LIMITE ATTEINTE
  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header simple pour le retour */}
          <div className="flex items-center gap-4 mb-10">
            <Link
              href="/clients"
              className="p-2 bg-white dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nouveau Client
            </h1>
          </div>

          {/* Bannière de Blocage */}
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 mb-6">
              <Lock size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Limite atteinte
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 px-4">
              Vous avez atteint le nombre maximum de clients pour votre plan
              actuel. Passez à la version Pro pour un accès illimité.
            </p>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Voir les offres Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. CAS : ACCÈS AUTORISÉ -> ON AFFICHE LE FORMULAIRE
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6 transition-colors duration-300">
      <NewClientForm />
    </div>
  );
}
