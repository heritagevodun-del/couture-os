import { canCreateOrder } from "@/lib/check-limits";
import NewOrderForm from "@/components/orders/NewOrderForm";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

// 🛡️ UX PRO : Titre de l'onglet du navigateur
export const metadata: Metadata = {
  title: "Nouvelle Commande | Couture OS",
};

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ Next.js 15 : On attend les params
  const { id } = await params;

  // ✅ Vérification quota côté serveur (Inviolable)
  const allowed = await canCreateOrder();

  // 🔒 CAS : LIMITE ATTEINTE (Bloqueur de création)
  if (!allowed) {
    return (
      <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] p-4 md:p-6 flex flex-col font-sans transition-colors duration-300">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <Link
              href={`/clients/${id}`}
              className="p-3 bg-white dark:bg-[#111] rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-[#D4AF37] transition-colors shadow-sm"
              aria-label="Retour au dossier client"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">
              Nouvelle Commande
            </h1>
          </div>

          {/* Bannière de Blocage Premium */}
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-full text-red-600 dark:text-red-500 mb-6 shadow-inner">
              <Lock size={40} strokeWidth={1.5} />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Carnet de commandes plein
            </h2>

            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
              Vous avez atteint la limite de commandes actives en simultané pour
              votre abonnement actuel.
              <br />
              <br />
              Livrez des commandes en cours, ou passez au statut{" "}
              <strong className="text-gray-900 dark:text-white">
                Pro
              </strong>{" "}
              pour produire sans aucune restriction.
            </p>

            <Link
              href="/pricing"
              className="px-8 py-4 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold text-base rounded-xl transition-all shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] hover:-translate-y-0.5"
            >
              Découvrir l&apos;offre Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ CAS : ACCÈS AUTORISÉ -> Afficher le formulaire
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] p-4 md:p-6 transition-colors duration-300">
      <NewOrderForm clientId={id} />
    </div>
  );
}
