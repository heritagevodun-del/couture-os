import { canAddClient } from "@/lib/check-limits";
import NewClientForm from "@/components/clients/NewClientForm";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Metadata } from "next";

// 🛡️ UX PRO : Titre de l'onglet du navigateur
export const metadata: Metadata = {
  title: "Nouveau Client | Couture OS",
};

export default async function NewClientPage() {
  // 1. VÉRIFICATION SERVEUR STRICTE (Inviolable)
  const allowed = await canAddClient();

  // 2. CAS : LIMITE ATTEINTE (Bloqueur de création)
  if (!allowed) {
    return (
      <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] p-4 md:p-6 font-sans transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          {/* Header simple pour le retour */}
          <div className="flex items-center gap-4 mb-10">
            <Link
              href="/clients"
              className="p-3 bg-white dark:bg-[#111] rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-[#D4AF37] transition-colors shadow-sm"
              aria-label="Retour à la liste des clients"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">
              Nouveau Client
            </h1>
          </div>

          {/* Bannière de Blocage Premium */}
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-red-50 dark:bg-red-950/30 rounded-full text-red-600 dark:text-red-500 mb-6 shadow-inner">
              <Lock size={40} strokeWidth={1.5} />
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 font-serif">
              Atelier Complet
            </h2>

            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
              Vous avez atteint le nombre maximum de clients autorisé pour votre
              abonnement actuel.
              <br />
              <br />
              Passez au statut{" "}
              <strong className="text-gray-900 dark:text-white">
                Pro
              </strong>{" "}
              pour débloquer un carnet d&apos;adresses illimité et développer
              votre activité sans restriction.
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

  // 3. CAS : ACCÈS AUTORISÉ -> ON AFFICHE LE FORMULAIRE
  // On applique les mêmes fonds pour que le formulaire enfant s'intègre parfaitement
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] p-4 md:p-6 transition-colors duration-300">
      <NewClientForm />
    </div>
  );
}
