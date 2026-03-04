"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import Logo from "@/components/Logo";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  BookOpen,
  // Scissors,
  // Image,
} from "lucide-react";

const MENU_ITEMS = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  // { label: "Commandes", href: "/orders", icon: Scissors },
  { label: "Catalogue", href: "/catalogue", icon: BookOpen },
  // { label: "Galerie", href: "/gallery", icon: Image },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

// Ajout de props pour gérer l'ouverture/fermeture sur mobile depuis un composant parent (ex: DashboardShell)
interface SideBarProps {
  onClose?: () => void;
}

export default function SideBar({ onClose }: SideBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    // La hauteur (h-full) doit s'adapter parfaitement au conteneur parent
    <aside className="flex flex-col w-full h-full bg-white dark:bg-[#050505] border-r border-gray-100 dark:border-gray-800 transition-colors">
      
      {/* 1. EN-TÊTE (Logo) */}
      <div className="p-6 flex items-center justify-between mb-4 border-b border-gray-50 dark:border-gray-900/50">
        <div className="flex items-center gap-3">
          <Logo className="w-9 h-9 rounded-full shadow-sm" />
          <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white font-serif">
            Couture<span className="text-[#D4AF37]">OS</span>
          </span>
        </div>
      </div>

      {/* 2. MENU DE NAVIGATION */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
          Menu Principal
        </div>
        
        {MENU_ITEMS.map((item) => {
          // Gestion stricte du lien actif (évite que /clients allume aussi /dashboard)
          const isActive = item.href === "/dashboard" 
            ? pathname === item.href 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose} // Ferme le menu sur mobile après un clic
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                isActive
                  // Style actif : Fond Or très léger, texte Noir/Blanc
                  ? "bg-[#D4AF37]/10 dark:bg-[#D4AF37]/5 text-gray-900 dark:text-white shadow-sm ring-1 ring-[#D4AF37]/20"
                  // Style inactif : Gris neutre
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <item.icon
                size={20}
                className={`transition-colors duration-300 ${
                  isActive
                    ? "text-[#D4AF37]"
                    : "text-gray-400 dark:text-gray-500 group-hover:text-[#D4AF37]"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. PIED DE PAGE (Déconnexion & Infos) */}
      <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#050505]">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-between px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <LogOut size={20} className={isLoggingOut ? "animate-pulse" : ""} />
            <span>{isLoggingOut ? "Déconnexion..." : "Se déconnecter"}</span>
          </div>
        </button>

        <div className="mt-6 flex flex-col items-center justify-center text-[11px] text-gray-400 font-medium">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Système Actif</span>
          </div>
          <p>Couture OS v2.1 • © 2026 Nova ENT</p>
        </div>
      </div>
    </aside>
  );
}