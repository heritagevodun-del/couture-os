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

  // UX Pro : Ferme automatiquement le menu mobile si l'utilisateur change de route via un lien extérieur
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    // Base de l'application : Le fond de la page est gris très clair en jour, noir quasi total en nuit
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white overflow-hidden selection:bg-[#D4AF37]/30">
      {/* --- 1. OVERLAY (Le fond noir transparent sur mobile) --- */}
      {/* On le met avant pour qu'il soit bien sous la sidebar au niveau du z-index */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --- 2. SIDEBAR (Le Menu Latéral) --- */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#111] shadow-2xl md:shadow-none border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* On passe la prop onClose pour que le menu puisse se fermer lui-même */}
        <SideBar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* --- 3. CONTENU PRINCIPAL (Le Moteur) --- */}
      <main className="flex-1 flex flex-col w-full min-w-0 h-full overflow-hidden relative">
        {/* HEADER MOBILE (Apparaît uniquement sur téléphone) */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-gray-800 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg font-serif">
              Couture<span className="text-[#D4AF37]">OS</span>
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors focus:ring-2 focus:ring-[#D4AF37]/50"
            aria-label="Ouvrir le menu de navigation"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* LA ZONE D'ALERTE (Bannière) */}
        <div className="z-10 w-full shrink-0">
          <TrialBanner />
        </div>

        {/* LA ZONE DE TRAVAIL (Le contenu de la page) */}
        {/* L'utilisation de flex-1 et overflow-y-auto assure que seul le contenu scroll, pas toute la page */}
        <div className="flex-1 overflow-y-auto w-full relative scroll-smooth">
          {/* Un conteneur max-w pour éviter que sur un iMac 27 pouces, le contenu ne s'étire à l'infini */}
          <div className="mx-auto max-w-7xl p-4 md:p-8 lg:p-10 w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
