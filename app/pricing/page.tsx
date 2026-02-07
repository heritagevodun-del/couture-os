"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Crown, Sparkles, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// --- STRATÉGIE VALIDÉE ---
// Start : 50 Clients (Suffisant pour débuter, frustrant pour grandir)
// Pro : Illimité (La vraie liberté)
const TIERS = [
  {
    id: "start",
    name: "Start",
    price: "2.000 F",
    period: "/mois",
    description: "L'essentiel pour démarrer sereinement.",
    features: [
      "Jusqu'à 50 Clients",
      "50 Commandes en cours",
      "Factures PDF",
      "Relances WhatsApp Auto",
      "30 modèles Catalogue",
      "60 JOURS D'ESSAI OFFERTS",
    ],
    buttonText: "Activer l'essai 60 jours",
    recommended: false,
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro Illimité",
    price: "5.000 F",
    period: "/mois",
    description: "La puissance totale pour votre atelier.",
    features: [
      "Clients ILLIMITÉS",
      "Commandes ILLIMITÉES",
      "Factures PDF",
      "Relances WhatsApp Auto",
      "50 modèles Catalogue",
      "60 JOURS D'ESSAI OFFERTS",
    ],
    buttonText: "Activer l'essai 60 jours",
    recommended: true,
    highlight: true,
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleCheckout = async (tierId: string) => {
    setLoading(tierId);
    try {
      // 1. Vérification Auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Création Session Stripe
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tierId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du paiement");
      }

      // 3. Redirection Stripe
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur critique : Pas d'URL de paiement reçue.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-gray-900 dark:text-white transition-colors duration-300 font-sans">
      {/* NAVBAR SIMPLIFIÉE */}
      <nav className="fixed w-full bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-black dark:bg-white text-white dark:text-black w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
              C
            </div>
            <span className="font-bold text-lg tracking-tight">CoutureOS</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-500 hover:text-red-500 flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} /> Se déconnecter
          </button>
        </div>
      </nav>

      {/* HEADER MARKETING */}
      <div className="pt-32 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold mb-6 border border-[#D4AF37]/20">
            <Sparkles size={12} />
            ÉTAPE FINALE : ACTIVEZ VOTRE ACCÈS
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
            Choisissez votre <span className="text-[#D4AF37]">Puissance</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Pour accéder à CoutureOS, veuillez sélectionner une offre.
            <br />
            <strong>Vous ne serez pas débité aujourd&apos;hui.</strong>{" "}
            L&apos;accès est gratuit pendant 60 jours.
          </p>
        </div>
      </div>

      {/* GRILLE DES PRIX */}
      <div className="pb-24 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col h-full ${
                tier.recommended
                  ? "bg-[#0a0a0a] dark:bg-black text-white border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/10 scale-105 z-10 ring-1 ring-[#D4AF37]/50"
                  : "bg-white dark:bg-[#111] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-black px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg flex items-center gap-2">
                  <Crown size={12} strokeWidth={3} /> Recommandé
                </div>
              )}

              <div className="mb-8">
                <h3
                  className={`text-xl font-bold flex items-center gap-2 ${tier.recommended ? "text-[#D4AF37]" : "text-gray-900 dark:text-white"}`}
                >
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tighter">
                    {tier.price}
                  </span>
                  <span
                    className={`text-sm font-medium ${tier.recommended ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {tier.period}
                  </span>
                </div>
                <p
                  className={`mt-4 text-sm leading-relaxed min-h-[40px] ${tier.recommended ? "text-gray-400" : "text-gray-500"}`}
                >
                  {tier.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {tier.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm group"
                  >
                    <CheckCircle2
                      size={18}
                      className={`shrink-0 mt-0.5 transition-colors ${
                        tier.recommended
                          ? "text-[#D4AF37]"
                          : "text-gray-400 group-hover:text-green-600"
                      }`}
                    />
                    <span
                      className={
                        tier.recommended
                          ? "text-gray-300"
                          : "text-gray-600 dark:text-gray-300"
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(tier.id)}
                disabled={loading !== null}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  tier.recommended
                    ? "bg-[#D4AF37] text-black hover:bg-[#F4CF57] shadow-lg shadow-[#D4AF37]/20"
                    : "bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                } ${loading !== null ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading === tier.id ? (
                  <>
                    {" "}
                    <Loader2 className="animate-spin h-4 w-4" />{" "}
                    Sécurisation...{" "}
                  </>
                ) : (
                  tier.buttonText
                )}
              </button>

              <p className="text-center text-[10px] mt-3 opacity-50 uppercase tracking-widest">
                Aucun prélèvement aujourd&apos;hui
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
