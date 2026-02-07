"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Logo from "@/components/Logo";
import {
  LayoutDashboard,
  Users,
  Scissors,
  Image,
  Settings,
  LogOut,
  // Shirt, <-- SUPPRIMÉ CAR INUTILISÉ
  BookOpen,
} from "lucide-react";

// --- CONFIGURATION DU MENU ---
const MENU_ITEMS = [
  {
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    label: "Commandes",
    href: "/orders",
    icon: Scissors,
  },
  {
    label: "Catalogue",
    href: "/catalogue",
    icon: BookOpen,
  },
  {
    label: "Galerie",
    href: "/gallery",
    icon: Image,
  },
  {
    label: "Paramètres",
    href: "/settings",
    icon: Settings,
  },
];

export default function SideBar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white dark:bg-[#0a0a0a] border-r border-gray-100 dark:border-gray-800 sticky top-0 overflow-y-auto transition-colors z-40">
      {/* 1. EN-TÊTE (Logo) */}
      <div className="p-6 flex items-center gap-3 mb-6">
        <Logo className="w-8 h-8 rounded-full shadow-sm" />
        <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
          CoutureOS
        </span>
      </div>

      {/* 2. MENU DE NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2">
        {MENU_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-md"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white"
              }`}
            >
              <item.icon
                size={20}
                className={
                  isActive
                    ? "text-[#D4AF37]"
                    : "group-hover:text-[#D4AF37] transition-colors"
                }
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. PIED DE PAGE (Déconnexion & Infos) */}
      <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={20} />
          <span>Se déconnecter</span>
        </button>

        <div className="mt-6 px-4 text-xs text-gray-400 font-medium">
          <p>CoutureOS v2.0</p>
          <p className="opacity-50">© 2026 Nova ENT</p>
        </div>
      </div>
    </aside>
  );
}
