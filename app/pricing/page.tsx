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
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [zone, setZone] = useState<"africa" | "world">("africa");
  const [loadingStripe, setLoadingStripe] = useState(false);

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
    };
    getUser();
  }, [supabase]);

  const planInfo = SUBSCRIPTION_PLANS.PREMIUM;
  const pricingInfo = planInfo.pricing[zone];

  const handleStripeSubscribe = async () => {
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
    <div className="min-h-screen bg-white dark:bg-black flex flex-col items-center justify-center p-4 relative">
      <Link
        href="/dashboard"
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500"
        aria-label="Retour"
      >
        <ArrowLeft size={24} />
      </Link>

      <div className="text-center mb-10 max-w-2xl mt-10 md:mt-0">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Passez en mode <span className="text-[#D4AF37]">Pro</span>.
        </h1>
        <p className="text-gray-500 text-lg">{planInfo.description}</p>
      </div>

      {/* SÉLECTEUR DE ZONE */}
      <div className="bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl flex items-center mb-10 shadow-inner">
        <button
          onClick={() => setZone("africa")}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
            zone === "africa"
              ? "bg-white dark:bg-[#D4AF37] text-black shadow-md"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <MapPin size={16} /> Afrique
        </button>
        <button
          onClick={() => setZone("world")}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
            zone === "world"
              ? "bg-white dark:bg-white text-black shadow-md"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Globe size={16} /> International
        </button>
      </div>

      {/* CARTE PRIX */}
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden relative hover:scale-[1.01] transition-transform">
        <div className="bg-[#D4AF37] text-black text-center py-2 font-bold text-xs uppercase tracking-widest">
          {zone === "africa"
            ? "⭐ Offre Spéciale Afrique"
            : "🎉 60 Jours d'essai gratuit"}
        </div>

        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-5xl font-black text-gray-900 dark:text-white">
              {pricingInfo.amount}
            </span>
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {pricingInfo.currency}
              </span>
              <span className="text-xs text-gray-400">
                {pricingInfo.period}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-8">
            {zone === "africa"
              ? "Tarif adapté au pouvoir d'achat local."
              : "Tarif standard international."}
          </p>

          <ul className="text-left space-y-4 mb-8 px-4">
            {planInfo.features.map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
              >
                <Check className="text-[#D4AF37] flex-shrink-0" size={20} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3">
            <button
              onClick={handleStripeSubscribe}
              disabled={loadingStripe}
              className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
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

            {zone === "africa" && userId && (
              <KkiapayButton
                amount={2000}
                email={userEmail}
                fullName={userName}
                userId={userId}
              />
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Paiement sécurisé :</p>
            <div className="flex justify-center gap-4 text-gray-400">
              <div className="flex items-center gap-1 text-xs">
                <CreditCard size={14} /> Visa / Mastercard
              </div>
              {zone === "africa" && (
                <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                  <Zap size={14} /> MTN / Moov / Celtiis
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
