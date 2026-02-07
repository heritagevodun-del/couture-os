import SideBar from "@/components/SideBar";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import TrialBanner from "@/components/TrialBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🔒 1. Le Vigile vérifie l'accès (60 jours ou Paiement)
    <SubscriptionGuard>
      <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 font-sans text-gray-900 dark:text-white">
        {/* 2. Barre latérale */}
        <SideBar />

        {/* 3. Zone principale */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* 📢 Bandeau d'alerte (si en période d'essai) */}
          <TrialBanner />

          {/* Contenu de la page */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
        </main>
      </div>
    </SubscriptionGuard>
  );
}
