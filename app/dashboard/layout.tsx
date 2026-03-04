import { Metadata } from "next";
import SubscriptionGuard from "@/components/SubscriptionGuard";
import DashboardShell from "@/components/DashboardShell";

// 🛡️ UX PRO : On définit le titre de l'onglet du navigateur
export const metadata: Metadata = {
  title: "Tableau de bord | Couture OS",
  description: "Espace de gestion de votre atelier de couture",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 🔒 1. Le Vigile vérifie l'abonnement en silence
    <SubscriptionGuard>
      {/* 📱 2. Le Shell gère l'interface, le menu et la bannière */}
      <DashboardShell>{children}</DashboardShell>
    </SubscriptionGuard>
  );
}
