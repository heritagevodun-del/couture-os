import SubscriptionGuard from "@/components/SubscriptionGuard";
import DashboardShell from "@/components/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🔒 1. Le Vigile vérifie l'abonnement
    <SubscriptionGuard>
      {/* 📱 2. Le Shell gère la navigation (Desktop + Mobile) */}
      <DashboardShell>{children}</DashboardShell>
    </SubscriptionGuard>
  );
}
