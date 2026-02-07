"use client";

import Link from "next/link";
import { Lock, CreditCard } from "lucide-react";

export default function ExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-neutral-950 p-6">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-xl text-center border border-gray-200 dark:border-gray-800">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={32} />
        </div>

        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Votre accès est verrouillé
        </h1>

        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Votre période d&apos;essai est terminée ou votre paiement a échoué.
          <br />
          Vos données (Clients, Mesures) sont en sécurité, mais vous devez
          réactiver votre abonnement pour y accéder.
        </p>

        <div className="space-y-4">
          <Link
            href="/pricing"
            className="block w-full py-4 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={20} /> Réactiver mon abonnement
          </Link>

          <Link
            href="/"
            className="block text-sm text-gray-400 hover:text-gray-600"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
