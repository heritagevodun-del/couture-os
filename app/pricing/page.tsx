"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Ajout pour la redirection
import {
  Check,
  ShieldCheck,
  Zap,
  Smartphone,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();
  const [zone, setZone] = useState<"africa" | "world">("africa");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone }),
      });

      const data = await res.json();

      // 1. Gestion du cas "Non Connecté" (401)
      if (res.status === 401) {
        // On redirige vers le login en gardant en mémoire qu'il voulait payer
        router.push("/login?next=/pricing");
        return;
      }

      // 2. Gestion du succès (Redirection Stripe)
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur : " + data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Une erreur de connexion est survenue.");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4 relative">
      {/* Bouton Retour discret (utile si on vient du dashboard) */}
      <Link
        href="/dashboard"
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500"
        aria-label="Retour"
      >
        <ArrowLeft size={24} />
      </Link>

      {/* 1. HEADER SIMPLE */}
      <div className="text-center mb-10 max-w-2xl mt-10 md:mt-0">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Passez en mode <span className="text-[#D4AF37]">Pro</span>.
        </h1>
        <p className="text-gray-500 text-lg">
          Gérez vos clients, vos mesures et vos commandes sans limite.
        </p>
      </div>

      {/* 2. LE SWITCH ZONE (DESIGN TYPE IOS) */}
      <div className="bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl flex items-center mb-10 shadow-inner">
        <button
          onClick={() => setZone("africa")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
            zone === "africa"
              ? "bg-white dark:bg-[#D4AF37] text-black shadow-md"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Zone Afrique
        </button>
        <button
          onClick={() => setZone("world")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
            zone === "world"
              ? "bg-white dark:bg-white text-black shadow-md"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          International
        </button>
      </div>

      {/* 3. LA CARTE DE PRIX UNIQUE */}
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden relative transition-all hover:scale-[1.01]">
        {/* BANDEAU PROMOTIONNEL */}
        <div className="bg-[#D4AF37] text-black text-center py-2 font-bold text-xs uppercase tracking-widest">
          🎉 60 Jours d&apos;essai gratuit
        </div>

        <div className="p-8 text-center">
          {/* PRIX DYNAMIQUE */}
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-5xl font-black text-gray-900 dark:text-white">
              {zone === "africa" ? "2 000" : "9,99"}
            </span>
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {zone === "africa" ? "FCFA" : "€"}
              </span>
              <span className="text-xs text-gray-400">/mois</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            {zone === "africa"
              ? "Tarif spécial résidents Afrique de l'Ouest."
              : "Tarif standard international."}
          </p>

          {/* LISTE FONCTIONNALITÉS */}
          <ul className="text-left space-y-4 mb-8 px-4">
            <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Check className="text-[#D4AF37] flex-shrink-0" size={20} />
              <span>
                Clients & Commandes <strong>illimités</strong>
              </span>
            </li>
            <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Check className="text-[#D4AF37] flex-shrink-0" size={20} />
              <span>Galerie photos & Mesures complètes</span>
            </li>
            <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <ShieldCheck className="text-[#D4AF37] flex-shrink-0" size={20} />
              <span>Sauvegarde sécurisée dans le Cloud</span>
            </li>
          </ul>

          {/* BOUTON D'ACTION */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none"
          >
            {loading ? (
              "Chargement..."
            ) : (
              <>
                <Zap
                  size={18}
                  className={
                    zone === "africa" ? "text-[#D4AF37]" : "text-black"
                  }
                />
                Commencer mes 60 jours gratuits
              </>
            )}
          </button>

          {/* NOTE DE BAS DE PAGE (Moyens de paiement) */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-2">
              Moyens de paiement acceptés :
            </p>
            <div className="flex justify-center gap-4 text-gray-400">
              <div className="flex items-center gap-1 text-xs">
                <CreditCard size={14} /> Visa / Mastercard
              </div>
              {/* On mentionne le Mobile Money pour rassurer */}
              {zone === "africa" && (
                <div
                  className="flex items-center gap-1 text-xs opacity-50"
                  title="Bientôt disponible"
                >
                  <Smartphone size={14} /> Mobile Money (Bientôt)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER SÉCURITÉ */}
      <p className="mt-8 text-xs text-gray-400 max-w-md text-center">
        Paiement sécurisé par Stripe. Vous ne serez pas débité avant la fin de
        votre période d&apos;essai de 60 jours. Annulable à tout moment.
      </p>
    </div>
  );
}
