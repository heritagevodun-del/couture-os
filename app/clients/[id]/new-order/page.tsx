import { canCreateOrder } from "@/lib/check-limits";
import NewOrderForm from "@/components/orders/NewOrderForm";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Next.js 15 : On attend les params
  const { id } = await params;

  // ✅ Vérification quota côté serveur
  const allowed = await canCreateOrder();

  // 🔒 CAS : LIMITE ATTEINTE
  if (!allowed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6 flex flex-col">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/clients/${id}`}
              className="p-2 bg-white dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nouvelle Commande
            </h1>
          </div>

          {/* Bannière de Blocage */}
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in">
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 mb-6">
              <Lock size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Limite atteinte
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 px-4">
              Vous avez atteint le nombre maximum de commandes actives pour
              votre plan. Terminez des commandes ou passez en Pro.
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

  // ✅ CAS : ACCÈS AUTORISÉ -> Afficher le formulaire Client
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6 transition-colors duration-300">
      <NewOrderForm clientId={id} />
    </div>
  );
}
