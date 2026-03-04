"use client";

import { useKKiaPay } from "kkiapay-react";
import { Smartphone } from "lucide-react"; // Loader2 retiré
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface KkiapayButtonProps {
  amount: number;
  email: string;
  fullName: string;
  userId: string;
}

export default function KkiapayButton({
  amount,
  email,
  fullName,
  userId,
}: KkiapayButtonProps) {
  const { openKkiapayWidget, addKkiapayListener, removeKkiapayListener } =
    useKKiaPay();
  const router = useRouter();

  // 🛡️ UX PRO : Gestion propre du cycle de vie React
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSuccess = (response: any) => {
      console.log("✅ Paiement Kkiapay réussi :", response);
      const tid = response.transactionId || response.transaction_id;

      // Redirection fluide via Next.js
      router.push(`/dashboard?payment=kkiapay_success&tid=${tid}`);
    };

    // On attache UNIQUEMENT l'événement reconnu par le typage Kkiapay
    addKkiapayListener("success", handleSuccess);

    // On nettoie l'écouteur à la destruction du composant (1 seul argument requis)
    return () => {
      removeKkiapayListener("success");
    };
  }, [addKkiapayListener, removeKkiapayListener, router]);

  const handlePayment = () => {
    // Préparation de la configuration propre
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widgetConfig: any = {
      amount: amount,
      api_key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || "",
      sandbox: process.env.NODE_ENV === "development",
      email: email,
      fullname: fullName,
      phone: "",
      theme: "#D4AF37", // L'Or de Couture OS
      paymentmethod: ["momo"],
      metadata: { userId: userId, plan: "premium" },
    };

    openKkiapayWidget(widgetConfig);
  };

  return (
    <button
      onClick={handlePayment}
      className="w-full mt-3 bg-[#25D366] text-white font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)]"
    >
      <Smartphone size={18} />
      Payer par Mobile Money
    </button>
  );
}
