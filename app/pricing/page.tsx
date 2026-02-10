"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ShieldCheck,
  Zap,
  Smartphone,
  CreditCard,
  ArrowLeft,
  Globe,
  MapPin,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();
  // Par défaut sur 'africa'
  const [zone, setZone] = useState<"africa" | "world">("africa");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // On appelle NOTRE api en lui disant quelle zone a été choisie
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone }),
      });

      const data = await res.json();

      // 1. Si l'utilisateur n'est pas connecté
      if (res.status === 401) {
        router.push("/login?next=/pricing");
        return;
      }

      // 2. Si tout est OK, on redirige vers le paiement Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur Stripe : " + (data.error || "Inconnue"));
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
      {/* Bouton Retour */}
      <Link
        href="/dashboard"
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500"
        aria-label="Retour au tableau de bord"
      >
        <ArrowLeft size={24} />
      </Link>

      {/* TITRE */}
      <div className="text-center mb-8 max-w-2xl mt-10 md:mt-0">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Passez en mode <span className="text-[#D4AF37]">Pro</span>.
        </h1>
        <p className="text-gray-500 text-lg">
          Choisissez l&lsquo;offre adaptée à votre région.
        </p>
      </div>

      {/* SÉLECTEUR DE ZONE (Le Switch) */}
      <div className="bg-gray-100 dark:bg-neutral-900 p-1.5 rounded-xl flex items-center mb-8 shadow-inner">
        <button
          onClick={() => setZone("africa")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${
            zone === "africa"
              ? "bg-white dark:bg-[#D4AF37] text-black shadow-md scale-105"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <MapPin size={16} /> Zone Afrique
        </button>
        <button
          onClick={() => setZone("world")}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${
            zone === "world"
              ? "bg-white dark:bg-white text-black shadow-md scale-105"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Globe size={16} /> International
        </button>
      </div>

      {/* CARTE DE PRIX */}
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden relative transition-all hover:scale-[1.01]">
        {/* Bandeau jaune */}
        <div className="bg-[#D4AF37] text-black text-center py-2 font-bold text-xs uppercase tracking-widest">
          🎉 60 Jours d&apos;essai gratuit
        </div>

        <div className="p-8 text-center">
          {/* AFFICHAGE DU PRIX DYNAMIQUE */}
          <div className="flex items-center justify-center gap-1 mb-2 transition-all">
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
              ? "Tarif adapté au pouvoir d'achat local (UEMOA/CEMAC)."
              : "Tarif standard pour le reste du monde."}
          </p>

          {/* LISTE DES AVANTAGES */}
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
              <span>Sauvegarde sécurisée Cloud</span>
            </li>
          </ul>

          {/* BOUTON D'ABONNEMENT */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
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
                Commencer l&lsquo;essai gratuit
              </>
            )}
          </button>

          {/* MOYENS DE PAIEMENT */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-2">
              Paiement sécurisé via :
            </p>
            <div className="flex justify-center gap-4 text-gray-400">
              <div className="flex items-center gap-1 text-xs">
                <CreditCard size={14} /> Carte Bancaire
              </div>
              {zone === "africa" && (
                <div
                  className="flex items-center gap-1 text-xs opacity-50"
                  title="Bientôt"
                >
                  <Smartphone size={14} /> Mobile Money (Bientôt)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400 max-w-md text-center">
        Aucun prélèvement immédiat. Annulable à tout moment depuis votre compte.
      </p>
    </div>
  );
}
