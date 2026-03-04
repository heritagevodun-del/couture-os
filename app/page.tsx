import Link from "next/link";
import Logo from "@/components/Logo";
import {
  ArrowRight,
  Scissors,
  ShieldCheck,
  Zap,
  CreditCard,
  Star,
} from "lucide-react";
import { Metadata } from "next";

// 🛡️ SEO PRO : Optimisation du référencement de la page d'accueil
export const metadata: Metadata = {
  title: "Couture OS | Le logiciel de gestion pour tailleurs et couturiers",
  description:
    "Gérez vos clients, mensurations, commandes et factures sur une seule application sécurisée. Essai gratuit de 60 jours.",
};

// 💡 ARCHITECTURE : Suppression du 'use client'. Cette page est 100% Server Side Rendered pour une vitesse fulgurante.
export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] text-gray-900 dark:text-white font-sans selection:bg-[#D4AF37]/30">
      {/* --- NAVBAR STICKY --- */}
      <nav className="fixed w-full bg-white/80 dark:bg-[#050505]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo Officiel */}
          <Link href="/" className="flex items-center gap-3 group">
            <Logo className="w-10 h-10 shadow-sm rounded-full border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-transform" />
            <span className="font-black text-xl tracking-tight font-serif">
              Couture<span className="text-[#D4AF37]">OS</span>
            </span>
          </Link>

          {/* Boutons Responsives */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="hidden md:block text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors uppercase tracking-wider"
            >
              Connexion
            </Link>
            <Link
              href="/login"
              className="bg-[#D4AF37] hover:bg-[#b5952f] text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] hover:-translate-y-0.5"
            >
              Essai Gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4AF37] rounded-full opacity-[0.03] dark:opacity-[0.05] blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold mb-8 uppercase tracking-widest">
            <Star size={14} className="fill-[#D4AF37]" /> La référence de la
            mode sur-mesure
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] font-serif">
            L&apos;excellence artisanale, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-yellow-600">
              l&apos;efficacité digitale.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Oubliez les carnets perdus et les oublis. Centralisez vos clients,
            mensurations, commandes et factures dans une application conçue pour
            les professionnels.
          </p>

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              {/* BOUTON PRINCIPAL */}
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#b5952f] text-black rounded-xl font-bold text-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.33)]"
              >
                Commencer gratuitement <ArrowRight size={20} />
              </Link>

              {/* BOUTON SECONDAIRE */}
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-[#111] text-gray-900 dark:text-white rounded-xl font-bold text-lg hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all border border-gray-200 dark:border-gray-800 shadow-sm"
              >
                Découvrir l&apos;offre Pro
              </Link>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5 font-medium bg-gray-100 dark:bg-[#111] px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800">
              <CreditCard size={14} className="text-[#D4AF37]" /> Aucune carte
              bancaire requise pour l&apos;essai de 60 jours.
            </p>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section
        id="features"
        className="py-24 bg-white dark:bg-[#111] border-y border-gray-100 dark:border-gray-800 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-gray-50 dark:bg-[#050505] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Scissors size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif tracking-tight">
                Précision Absolue
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Gabarits de mensurations professionnels. Enregistrez les mesures
                une seule fois et retrouvez-les instantanément pour chaque
                nouvelle création.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-[#050505] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/30 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-700">
                <Zap size={100} />
              </div>
              <div className="relative z-10 w-14 h-14 bg-[#D4AF37] text-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Zap size={24} />
              </div>
              <h3 className="relative z-10 text-xl font-bold mb-3 font-serif tracking-tight">
                Facturation Instantanée
              </h3>
              <p className="relative z-10 text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Générez des devis et factures PDF aux couleurs de votre atelier
                en un clic. Relancez vos clients via WhatsApp sans effort.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-[#050505] p-8 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/30 transition-all duration-300 group">
              <div className="w-14 h-14 bg-[#25D366] text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif tracking-tight">
                Paiements Sécurisés
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                Acceptez les paiements par Carte Bancaire ou Mobile Money (MTN,
                Moov). Vos données clients sont cryptées sur un Cloud hautement
                sécurisé.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 text-center border-t border-gray-200 dark:border-gray-900 bg-gray-50 dark:bg-[#050505] relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 grayscale opacity-70">
            <Logo className="w-6 h-6 rounded-full" />
            <span className="font-bold text-sm tracking-tight font-serif">
              CoutureOS
            </span>
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            © 2026 Nova ENT. L&apos;outil des créateurs.
          </p>

          <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-wider">
            <Link
              href="/legal/terms"
              className="text-gray-500 hover:text-[#D4AF37] transition-colors"
            >
              Conditions
            </Link>
            <Link
              href="/legal/privacy"
              className="text-gray-500 hover:text-[#D4AF37] transition-colors"
            >
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
