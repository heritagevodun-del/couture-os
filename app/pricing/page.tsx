"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/app/constants/plans";
import { createClient } from "@/utils/supabase/client";
import KkiapayButton from "@/components/KkiapayButton";
import {
  Check,
  CreditCard,
  ArrowLeft,
  Globe,
  MapPin,
  Loader2,
  Zap,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [zone, setZone] = useState<"africa" | "world">("africa");
  const [loadingStripe, setLoadingStripe] = useState(false);

  // 🛡️ NOUVEAU : État de chargement initial pour éviter le clignotement des boutons
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || "");
        setUserName(user.user_metadata?.full_name || "Client CoutureOS");
      }
      setIsCheckingUser(false); // Fin de la vérification
    };
    getUser();
  }, [supabase]);

  const planInfo = SUBSCRIPTION_PLANS.PREMIUM;
  const pricingInfo = planInfo.pricing[zone];

  const handleStripeSubscribe = async () => {
    // 🛡️ OPTIMISATION : Pas besoin d'interroger le serveur si on sait déjà qu'il n'est pas connecté
    if (!userId) {
      router.push("/login?next=/pricing");
      return;
    }

    setLoadingStripe(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone }),
      });

      const data = await res.json();

      if (res.status === 401) {
        router.push("/login?next=/pricing");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur : " + data.error);
        setLoadingStripe(false);
      }
    } catch (err) {
      console.error(err);
      setLoadingStripe(false);
      alert("Une erreur de connexion est survenue.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col items-center justify-center p-4 relative font-sans">
      <Link
        href="/dashboard"
        className="absolute top-6 left-6 p-3 rounded-full bg-white dark:bg-[#111] shadow-sm border border-gray-200 dark:border-gray-800 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition text-gray-500"
        aria-label="Retour au tableau de bord"
      >
        <ArrowLeft size={20} />
      </Link>

      <div className="text-center mb-10 max-w-2xl mt-16 md:mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight font-serif">
          Passez en mode <span className="text-[#D4AF37]">Pro</span>.
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {planInfo.description}
        </p>
      </div>

      {/* SÉLECTEUR DE ZONE */}
      <div className="bg-white dark:bg-[#111] p-1.5 rounded-xl flex items-center mb-10 shadow-sm border border-gray-200 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <button
          onClick={() => setZone("africa")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
            zone === "africa"
              ? "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]/30"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <MapPin size={16} /> Afrique
        </button>
        <button
          onClick={() => setZone("world")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
            zone === "world"
              ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Globe size={16} /> International
        </button>
      </div>

      {/* CARTE PRIX */}
      <div className="w-full max-w-md bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden relative hover:-translate-y-1 transition-transform duration-300 animate-in fade-in slide-in-from-bottom-6">
        <div className="bg-[#D4AF37] text-black text-center py-2.5 font-bold text-xs uppercase tracking-widest shadow-inner">
          {zone === "africa"
            ? "⭐ Offre Spéciale Afrique"
            : "🎉 60 Jours d'essai gratuit".replace("'", "&apos;")}
        </div>

        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
              {pricingInfo.amount}
            </span>
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                {pricingInfo.currency}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {pricingInfo.period}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {zone === "africa"
              ? "Tarif adapté au pouvoir d'achat local.".replace("'", "&apos;")
              : "Tarif standard international."}
          </p>

          <div className="h-px w-full bg-gray-100 dark:bg-gray-800 mb-8" />

          <ul className="text-left space-y-4 mb-8 px-2">
            {planInfo.features.map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <div className="mt-0.5 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 p-1 rounded-full text-[#D4AF37]">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-4">
            {isCheckingUser ? (
              // 🛡️ SQUELETTE DE CHARGEMENT : Évite que les boutons clignotent
              <div className="w-full h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
                <Loader2 size={20} className="text-gray-400 animate-spin" />
              </div>
            ) : (
              <>
                <button
                  onClick={handleStripeSubscribe}
                  disabled={loadingStripe}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                >
                  {loadingStripe ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Payer par Carte Bancaire
                    </>
                  )}
                </button>

                {zone === "africa" &&
                  (userId ? (
                    <div className="mt-3">
                      <KkiapayButton
                        amount={2000}
                        email={userEmail}
                        fullName={userName}
                        userId={userId}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => router.push("/login?next=/pricing")}
                      className="w-full mt-3 bg-[#25D366] text-white font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Smartphone size={18} />
                      Payer par Mobile Money (MTN/Moov)
                    </button>
                  ))}
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider font-bold">
              Paiement sécurisé
            </p>
            <div className="flex justify-center gap-5 text-gray-400">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <CreditCard size={16} className="text-gray-500" /> Visa /
                Mastercard
              </div>
              {zone === "africa" && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-500">
                  <Zap size={16} /> Mobile Money
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
