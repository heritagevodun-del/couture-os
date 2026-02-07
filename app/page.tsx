"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { ArrowRight, Scissors, ShieldCheck, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo Officiel */}
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 shadow-sm rounded-full" />
            <span className="font-bold text-xl tracking-tight">CoutureOS</span>
          </div>

          {/* Boutons (Nettoyé) */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
            >
              Connexion
            </Link>
            <Link
              href="/pricing"
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Voir les offres
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Logo className="w-24 h-24 shadow-lg rounded-full" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold mb-6 border border-yellow-100 dark:border-yellow-700/50">
            ✨ La référence pour les ateliers modernes
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Gérez votre atelier <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-yellow-600">
              comme un Pro.
            </span>
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Fini les carnets perdus. Centralisez vos clients, mesures et
            commandes dans une application sécurisée, conçue pour les couturiers
            exigeants.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Redirection vers Pricing car l'offre gratuite n'existe plus */}
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-gray-200 dark:shadow-none"
            >
              Commencer maintenant (60j offerts) <ArrowRight size={20} />
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-200 rounded-full font-bold text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition border border-gray-200 dark:border-gray-800"
            >
              Voir les tarifs
            </Link>
          </div>

          <div className="mt-12 text-sm text-gray-400 font-medium">
            Déjà utilisé par des ateliers à Paris, Dakar, Cotonou et New York.
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section
        id="features"
        className="py-24 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-neutral-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition duration-300 group">
              <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Scissors size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Mesures Digitales</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Enregistrez les mesures une seule fois. Retrouvez-les
                instantanément pour chaque nouvelle commande, sur mobile ou
                ordinateur.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-neutral-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition duration-300 group">
              <div className="w-12 h-12 bg-[#D4AF37] text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Factures en 1 Clic</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Générez des factures professionnelles PDF automatiquement.
                Envoyez-les par WhatsApp à vos clients sans effort.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-neutral-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition duration-300 group">
              <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">100% Sécurisé</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Vos données sont cryptées. Ne perdez plus jamais le numéro
                d&apos;un client important ou l&apos;historique de ses
                paiements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-neutral-900 transition-colors">
        <p>© 2026 CoutureOS. Fait avec passion pour les artisans.</p>
        <div className="flex justify-center gap-4 mt-4">
          <Link
            href="/legal/terms"
            className="hover:text-black dark:hover:text-white transition"
          >
            CGU
          </Link>
          <Link
            href="/legal/privacy"
            className="hover:text-black dark:hover:text-white transition"
          >
            Confidentialité
          </Link>
        </div>
      </footer>
    </div>
  );
}
