import SubscriptionGuard from "@/components/SubscriptionGuard";
import DashboardShell from "@/components/DashboardShell"; // 👈 C'est lui qui gère le Mobile maintenant

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🔒 1. Le Vigile vérifie si on a le droit d'entrer (60 jours ou Paiement)
    <SubscriptionGuard>
      {/* 📱 2. Le Shell gère l'affichage (Barre latérale, Menu Mobile, Bandeau) */}
      <DashboardShell>{children}</DashboardShell>
    </SubscriptionGuard>
  );
}
