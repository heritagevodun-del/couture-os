"use client";

import { useState, useEffect } from "react";
import SideBar from "@/components/SideBar";
import { Menu } from "lucide-react";
import TrialBanner from "@/components/TrialBanner";
import { usePathname } from "next/navigation";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // UX Pro : Ferme automatiquement le menu mobile si l'utilisateur change de route
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    // Base de l'application
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white overflow-hidden selection:bg-[#D4AF37]/30">
      {/* --- 1. OVERLAY --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --- 2. SIDEBAR --- */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#111] shadow-2xl md:shadow-none border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SideBar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* --- 3. CONTENU PRINCIPAL --- */}
      <main className="flex-1 flex flex-col w-full min-w-0 h-full overflow-hidden relative">
        {/* HEADER MOBILE */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-gray-800 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-black text-xl font-serif tracking-tight">
              Couture<span className="text-[#D4AF37]">OS</span>
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-black rounded-xl transition-colors focus:ring-2 focus:ring-[#D4AF37]/50"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* LA ZONE D'ALERTE */}
        <div className="z-10 w-full shrink-0">
          <TrialBanner />
        </div>

        {/* LA ZONE DE TRAVAIL */}
        {/* 🛡️ Nettoyage : On laisse Next.js et iOS gérer le scroll natif (overflow-y-auto suffit) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative overscroll-y-contain">
          <div className="mx-auto max-w-7xl p-4 md:p-8 lg:p-10 w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
