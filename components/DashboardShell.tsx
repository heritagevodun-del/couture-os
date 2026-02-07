"use client";

import { useState } from "react";
import SideBar from "@/components/SideBar";
import { Menu, X } from "lucide-react";
import TrialBanner from "@/components/TrialBanner";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 font-sans text-gray-900 dark:text-white overflow-hidden">
      {/* --- 1. SIDEBAR (Mobile & Desktop) --- */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full overflow-y-auto">
          {/* Bouton pour fermer sur mobile (CORRIGÉ avec aria-label) */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 md:hidden p-2 text-gray-500 hover:text-black"
            aria-label="Fermer le menu" // 👈 AJOUTÉ
          >
            <X size={24} />
          </button>

          <SideBar />
        </div>
      </div>

      {/* --- 2. OVERLAY --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- 3. CONTENU PRINCIPAL --- */}
      <main className="flex-1 flex flex-col w-full min-w-0 overflow-hidden">
        {/* HEADER MOBILE (CORRIGÉ avec aria-label) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          <span className="font-bold text-lg">CoutureOS</span>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-md"
            aria-label="Ouvrir le menu" // 👈 AJOUTÉ
          >
            <Menu size={24} />
          </button>
        </div>

        {/* BANNIÈRE D'ESSAI */}
        <TrialBanner />

        {/* LA PAGE */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
