"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Clock } from "lucide-react";

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
      const daysUsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setDaysLeft(60 - daysUsed);
    };

    checkTrial();
  }, [supabase]); // 👈 Correction Linter ici

  if (isPro || daysLeft === null) return null;
  if (daysLeft <= 0) return null;

  return (
    <div className="bg-indigo-600 text-white px-4 py-2 text-sm flex flex-col md:flex-row items-center justify-between gap-2 shadow-md z-10">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-yellow-300" />
        <span>
          Mode Essai : Il vous reste{" "}
          <span className="font-bold text-yellow-300">{daysLeft} jours</span>{" "}
          gratuits.
        </span>
      </div>
      <Link
        href="/pricing"
        className="bg-white text-indigo-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-indigo-50 transition"
      >
        S&apos;abonner maintenant
      </Link>
    </div>
  );
}
