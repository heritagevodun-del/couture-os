"use client";

import Link from "next/link";
// IMPORT DU NOUVEAU LOGO
import Logo from "@/components/Logo";
import {
  ArrowRight,
  CheckCircle2,
  Scissors,
  ShieldCheck,
  Zap,
  Globe,
  Smartphone,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-white transition-colors duration-300">
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo Officiel */}
          <div className="flex items-center gap-3">
            {/* On utilise le composant Logo ici, taille w-10 h-10 */}
            <Logo className="w-10 h-10 shadow-sm rounded-full" />
            <span className="font-bold text-xl tracking-tight">CoutureOS</span>
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
            >
              Connexion
            </Link>
            <Link
              href="/login"
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Essayer
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* J'ai aussi ajouté le logo en plus grand ici pour l'impact */}
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
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-gray-200 dark:shadow-none"
            >
              Commencer maintenant <ArrowRight size={20} />
            </Link>
            <Link
              href="#pricing"
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
            <div className="bg-white dark:bg-neutral-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition duration-300">
              <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center mb-6">
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
            <div className="bg-white dark:bg-neutral-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition duration-300">
              <div className="w-12 h-12 bg-[#D4AF37] text-white rounded-2xl flex items-center justify-center mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Factures en 1 Clic</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Générez des factures professionnelles PDF automatiquement.
                Envoyez-les par WhatsApp à vos clients sans effort.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-neutral-950 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition duration-300">
              <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center mb-6">
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

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">
            Un prix adapté à votre région
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Plan International */}
            <div className="p-8 border border-gray-100 dark:border-gray-800 rounded-3xl text-left hover:border-black dark:hover:border-white transition bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={18} className="text-gray-400" />
                <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wide">
                  International
                </h3>
              </div>
              <div className="text-4xl font-bold mb-6">
                9.90€{" "}
                <span className="text-lg text-gray-400 font-medium">/mois</span>
              </div>

              <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" /> Clients
                  illimités
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />{" "}
                  Catalogue photo HD
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" /> Support
                  prioritaire
                </li>
              </ul>

              <Link
                href="/login"
                className="block w-full py-3 bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-bold text-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Choisir
              </Link>
            </div>

            {/* Plan Afrique - MISE EN AVANT */}
            <div className="relative p-8 bg-black dark:bg-neutral-800 text-white rounded-3xl shadow-2xl text-left transform md:scale-105 border border-gray-800">
              <div className="absolute top-0 right-0 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                OFFRE POPULAIRE
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={18} className="text-[#D4AF37]" />
                <h3 className="text-lg font-bold text-[#D4AF37] uppercase tracking-wide">
                  Zone Afrique
                </h3>
              </div>

              <div className="text-4xl font-bold mb-6">
                1 000 F{" "}
                <span className="text-lg text-gray-400 font-medium">/mois</span>
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Prix spécial lancement pour soutenir les artisans locaux.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#D4AF37]" /> Tout
                  illimité
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#D4AF37]" /> Paiement
                  Mobile Money
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[#D4AF37]" />{" "}
                  Fonctionne sur mobile
                </li>
              </ul>

              <Link
                href="/login"
                className="block w-full py-3 bg-[#D4AF37] text-black font-bold text-center rounded-xl hover:bg-yellow-500 transition"
              >
                Commencer à 1000F
              </Link>
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
