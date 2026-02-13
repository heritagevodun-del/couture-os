"use client";

import { useKKiaPay } from "kkiapay-react";
import { Smartphone, Loader2 } from "lucide-react";
import { useState } from "react";

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
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);

    openKkiapayWidget({
      amount: amount,
      api_key: process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY || "",
      sandbox: false,
      email: email,
      fullname: fullName,
      phone: "",
      theme: "#000000",
      paymentmethod: ["momo"],
      metadata: { userId: userId, plan: "premium" },
      // 👇 SÉCURITÉ TS : On force le typage pour accepter 'metadata'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addKkiapayListener("success", (response: any) => {
      console.log("Paiement réussi :", response);

      const tid = response.transactionId || response.transaction_id;

      window.location.href = `/dashboard?payment=kkiapay_success&tid=${tid}`;

      removeKkiapayListener("success");
      setLoading(false);
    });
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full mt-3 bg-[#25D366] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
    >
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <>
          <Smartphone size={18} />
          Payer par Mobile Money (MTN/Moov)
        </>
      )}
    </button>
  );
}
