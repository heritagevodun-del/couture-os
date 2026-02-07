import SideBar from "@/components/SideBar"; // Assure-toi que ce composant existe
import SubscriptionGuard from "@/components/SubscriptionGuard"; // Le Vigile qu'on a créé

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🔒 LE VIGILE ENTOURE TOUT LE DASHBOARD
    <SubscriptionGuard>
      <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 font-sans text-gray-900 dark:text-white">
        {/* 1. LA BARRE LATÉRALE (Menu) */}
        <SideBar />

        {/* 2. LA ZONE DE CONTENU (Là où s'affiche ta page Dashboard, Clients, etc.) */}
        <main className="flex-1 overflow-y-auto relative">{children}</main>
      </div>
    </SubscriptionGuard>
  );
}
