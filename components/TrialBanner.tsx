"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isPro, setIsPro] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkTrial = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status, created_at")
        .eq("id", user.id)
        .single();

      if (
        profile?.subscription_status === "active" ||
        profile?.subscription_status === "pro"
      ) {
        setIsPro(true);
        return;
      }

      const createdAt = new Date(profile?.created_at || new Date());
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());

      // 🛡️ CORRECTION MATHÉMATIQUE : Math.floor est plus juste pour des jours révolus
      const daysUsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      setDaysLeft(60 - daysUsed);
    };

    checkTrial();
  }, [supabase]);

  // On ne rend rien si on charge, si c'est un pro, ou si l'essai est terminé
  if (isPro || daysLeft === null || daysLeft <= 0) return null;

  return (
    <div className="bg-[#050505] border-b border-[#D4AF37]/30 px-4 py-2.5 flex flex-col md:flex-row items-center justify-center md:justify-between gap-3 z-50 relative animate-in slide-in-from-top-4 fade-in duration-500 shadow-md">
      <div className="flex items-center gap-2.5 text-gray-400">
        {/* L'icône respire doucement pour attirer l'attention sans être agressive */}
        <Clock size={16} className="text-[#D4AF37] animate-pulse" />
        <span className="font-medium text-xs md:text-sm tracking-wide">
          Période d&apos;essai : Il vous reste{" "}
          <span className="font-bold text-[#D4AF37]">{daysLeft} jours</span>{" "}
          gratuits.
        </span>
      </div>

      <Link
        href="/pricing"
        className="flex items-center gap-1.5 bg-[#D4AF37] text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-[#b5952f] hover:scale-105 transition-all shadow-[0_0_10px_rgba(212,175,55,0.15)]"
      >
        Passer en Pro <ArrowRight size={14} />
      </Link>
    </div>
  );
}
